export default function Header() {
  return (
    <header className="border-b border-white/10 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <img src="/logo.png" alt="YT to MP3" className="w-9 h-9 sm:w-12 sm:h-12 object-contain" />
          <div>
            <h1 className="text-base sm:text-xl font-bold tracking-tight">
              <span className="text-red-500">YT</span>{" "}
              <span className="text-white">to</span>{" "}
              <span className="text-green-500">MP3</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400">YouTube to MP3/WAV Converter</p>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm text-gray-400">
          <span className="px-2 sm:px-3 py-1 rounded-full bg-white/5 text-[10px] sm:text-xs">
            Free &amp; Unlimited
          </span>
        </nav>
      </div>
    </header>
  );
}
