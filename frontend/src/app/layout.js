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
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>
      </head>
      <body className="text-white antialiased">{children}</body>
    </html>
  );
}
