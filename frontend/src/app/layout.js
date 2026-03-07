import "./globals.css";

export const metadata = {
  title: "YT to MP3 - YouTube to MP3/WAV Converter",
  description:
    "Extract audio from YouTube videos and export as MP3 or WAV. Fast, simple, and reliable.",
  keywords: [
    "youtube to mp3",
    "youtube to wav",
    "audio converter",
    "extract audio",
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="text-white antialiased">{children}</body>
    </html>
  );
}
