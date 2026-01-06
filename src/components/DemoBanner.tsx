import { Play, LogOut } from "lucide-react";

interface DemoBannerProps {
  onExit?: () => void;
}

export function DemoBanner({ onExit }: DemoBannerProps) {
  const handleExit = () => {
    if (onExit) {
      onExit();
    } else {
      // Remove demo param and reload
      const url = new URL(window.location.href);
      url.searchParams.delete("demo");
      window.location.href = url.pathname;
    }
  };

  return (
    <div className="sticky top-0 z-[60] border-b px-4 py-2.5 bg-gradient-to-r from-violet-900 via-purple-900 to-violet-900 border-violet-700/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-500/25 border border-violet-400/30">
            <Play className="w-3.5 h-3.5 text-violet-300 fill-violet-300" />
            <span className="text-xs font-bold uppercase tracking-wide text-violet-200">
              Demo Mode
            </span>
          </div>
          <span className="text-sm hidden sm:inline text-violet-300/90">
            Explore BrewOS with simulated machine data
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExit}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors bg-violet-500/20 text-violet-200 hover:bg-violet-500/30 hover:text-violet-100 border border-violet-400/30"
          >
            <LogOut className="w-4 h-4" />
            <span>Exit Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
