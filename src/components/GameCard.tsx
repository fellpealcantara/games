import { Info, Play } from 'lucide-react';
import type { Game } from '../types/store';
import { GameCoverArt } from './GameCoverArt';

interface GameCardProps {
  game: Game;
  isInCart?: boolean;
  isOwned?: boolean;
  onSelectGame: (game: Game) => void;
  onQuickAddCart?: (gameId: string) => void;
  onPlayGame?: (game: Game) => void;
}

export function GameCard({
  game,
  onSelectGame,
  onPlayGame,
}: GameCardProps) {
  const sizeLabel =
    game.sizeGb >= 1
      ? `${game.sizeGb.toFixed(1)} GB`
      : `${Math.round(game.sizeGb * 1024)} MB`;

  const consoleColorMap: Record<string, string> = {
    PS1: 'text-[#60A5FA] bg-[#1E3A8A]/35 border-[#3B82F6]/30',
    SNES: 'text-[#F87171] bg-[#991B1B]/35 border-[#EF4444]/30',
    GBA: 'text-[#A78BFA] bg-[#5B21B6]/35 border-[#8B5CF6]/30',
    GBC: 'text-[#34D399] bg-[#065F46]/35 border-[#10B981]/30',
    CS16: 'text-[#FBBF24] bg-[#78350F]/35 border-[#F59E0B]/30',
  };

  const badgeClass =
    (game.console && consoleColorMap[game.console]) ||
    'text-neutral-300 bg-[#1F1F1F] border-white/10';

  // Authentic physical box aspect ratio per console
  const aspectClass =
    game.console === 'SNES'
      ? 'aspect-[512/357]'
      : game.console === 'CS16'
        ? 'aspect-[3/2]'
        : 'aspect-square';

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPlayGame) {
      onPlayGame(game);
    } else {
      onSelectGame(game);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectGame(game);
  };

  return (
    <article className="group flex flex-col select-none">
      {/* Box artwork without artificial borders, 100% full and proportional to the original game */}
      <div
        className={`relative w-full ${aspectClass} overflow-hidden rounded-2xl bg-[#141414] shadow-md`}
      >
        <button
          type="button"
          onClick={handleSelect}
          aria-label={`Ver detalhes de ${game.title}`}
          className="block h-full w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
        >
          <GameCoverArt game={game} />
        </button>

        {/* Hover Quick Action Play overlay */}
        <div className="pointer-events-none absolute inset-0 bg-black/50 opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 p-3">
          <button
            type="button"
            onClick={handlePlay}
            aria-label={`Jogar ${game.title}`}
            className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E5192B] text-white shadow-xl transition-transform duration-150 hover:scale-110 hover:bg-[#FF2436] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Play className="ml-0.5 h-6 w-6 fill-white" />
          </button>

          <button
            type="button"
            onClick={handleSelect}
            className="pointer-events-auto rounded-full bg-white/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/35"
          >
            Ver Detalhes
          </button>
        </div>
      </div>

      {/* Game info below box */}
      <div className="mt-2.5 flex flex-col items-start w-full">
        {/* Console tag & year / size */}
        <div className="flex items-center justify-between w-full">
          <span
            className={`rounded-md border px-2 py-0.5 text-[9.5px] font-bold tracking-[0.05em] uppercase ${badgeClass}`}
          >
            {game.console ?? 'RETRO'}
          </span>
          <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
            {game.releaseYear} · {sizeLabel}
          </span>
        </div>

        {/* Game Title with full tooltip */}
        <button
          type="button"
          onClick={handleSelect}
          title={game.title}
          className="mt-1.5 block w-full truncate text-left text-[13.5px] sm:text-[14px] font-semibold text-white transition-colors hover:text-[#FF2A3B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] rounded"
        >
          {game.title}
        </button>

        {/* Developer & Category */}
        <div className="mt-0.5 flex items-center justify-between w-full text-[11.5px] text-neutral-400">
          <span className="truncate">{game.developer.split('/')[0].trim()}</span>
          <span className="shrink-0 text-neutral-500 font-medium">{game.category}</span>
        </div>

        {/* Quick Actions Bar: Jogar e Detalhes */}
        <div className="mt-2.5 flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={handlePlay}
            className="flex-1 h-8 rounded-xl bg-[#E5192B] hover:bg-[#FF2436] text-white text-[11.5px] font-bold inline-flex items-center justify-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <Play className="h-3.5 w-3.5 fill-white" />
            <span>Jogar</span>
          </button>

          <button
            type="button"
            onClick={handleSelect}
            aria-label={`Ver detalhes de ${game.title}`}
            className="h-8 px-2.5 rounded-xl bg-[#1C1C1C] hover:bg-[#262626] border border-white/[0.08] text-neutral-300 hover:text-white text-[11.5px] font-semibold inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}
