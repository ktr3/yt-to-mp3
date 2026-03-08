export default function Header() {
  return (
    <header className="border-b border-white/10 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="YT to MP3" className="w-12 h-12 object-contain" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-red-500">YT</span>{" "}
              <span className="text-white">to</span>{" "}
              <span className="text-green-500">MP3</span>
            </h1>
            <p className="text-xs text-gray-400">YouTube to MP3/WAV Converter</p>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm text-gray-400">
          <span className="px-3 py-1 rounded-full bg-white/5 text-xs">
            Free &amp; Unlimited
          </span>
        </nav>
      </div>
    </header>
  );
}
