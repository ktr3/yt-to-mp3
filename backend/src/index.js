const express = require("express");
const cors = require("cors");
const convertRoutes = require("./routes/convert");
const { initDb } = require("./db");
const { startWorker } = require("./queues/convertQueue");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000" }));
app.use(express.json());
app.use("/downloads", express.static("/app/downloads"));

app.use("/api", convertRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

async function main() {
  await initDb();
  startWorker();
  app.listen(PORT, () => {
    console.log(`Clip2Audio backend running on port ${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
