const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");
const { query } = require("../db");
const { downloadAudio, getVideoInfo } = require("../services/converter");

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const convertQueue = new Queue("convert", { connection });

function startWorker() {
  const worker = new Worker(
    "convert",
    async (job) => {
      const { conversionId, url, format, quality } = job.data;

      await query("UPDATE conversions SET status = $1 WHERE id = $2", [
        "processing",
        conversionId,
      ]);

      try {
        // Fetch video info if title is missing (playlist batch jobs)
        try {
          const row = await query("SELECT video_title FROM conversions WHERE id = $1", [conversionId]);
          if (!row.rows[0]?.video_title) {
            const info = await getVideoInfo(url);
            await query(
              "UPDATE conversions SET video_title = $1, video_thumbnail = $2, video_duration = $3 WHERE id = $4",
              [info.title, info.thumbnail, info.duration, conversionId]
            );
          }
        } catch { /* non-critical */ }

        const result = await downloadAudio(url, conversionId, format, quality);

        await query(
          `UPDATE conversions
           SET status = 'completed', file_path = $1, file_size = $2, completed_at = NOW()
           WHERE id = $3`,
          [result.filePath, result.fileSize, conversionId]
        );

        return result;
      } catch (err) {
        await query(
          "UPDATE conversions SET status = 'failed', error_message = $1 WHERE id = $2",
          [err.message, conversionId]
        );
        throw err;
      }
    },
    {
      connection,
      concurrency: 2,
      limiter: { max: 5, duration: 60000 },
    }
  );

  worker.on("completed", (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  console.log("Convert worker started");
}

module.exports = { convertQueue, startWorker };
