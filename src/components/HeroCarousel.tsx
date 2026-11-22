import { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  Play,
  Plus,
  ThumbsUp,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Game } from '../types/store';

interface HeroCarouselProps {
  games: Game[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  wishlistIds: string[];
  cartIds?: string[];
  libraryIds?: string[];
  onToggleWishlist: (gameId: string) => void;
  onPrimaryAction: (game: Game) => void;
  onWatchTrailer?: (game: Game) => void;
  onSelectGame?: (game: Game) => void;
}

const GAME_HERO_BACKDROPS: Record<string, string> = {
  'counter-strike-16': '/src/assets/images/game_cyberpunk_neon_1795288188615.jpg',
  'resident-evil-3': '/src/assets/images/game_mafia_noir_1795288189928.jpg',
  'crash-bandicoot-2': '/src/assets/images/game_farcry_tropical_1795288189049.jpg',
  'castlevania-sotn': '/src/assets/images/game_hogwarts_castle_1795288188979.jpg',
  'silent-hill-1': '/src/assets/images/game_mafia_noir_1795288189928.jpg',
  'pokemon-emerald': '/src/assets/images/game_horizon_peaks_1795288188949.jpg',
  'zelda-four-swords': '/src/assets/images/hero_league_champion_1795288189155.jpg',
  'bloody-roar-2': '/src/assets/images/hero_league_champion_1795288189155.jpg',
  'dino-crisis-1': '/src/assets/images/game_farcry_tropical_1795288189049.jpg',
  'dino-crisis-2': '/src/assets/images/game_farcry_tropical_1795288189049.jpg',
  'chrono-trigger': '/src/assets/images/hero_league_champion_1795288189155.jpg',
  'super-metroid': '/src/assets/images/game_cyberpunk_neon_1795288188615.jpg',
  'super-mario-world': '/src/assets/images/game_horizon_peaks_1795288188949.jpg',
};

export function HeroCarousel({
  games,
  activeIndex,
  onSelectIndex,
  wishlistIds,
  libraryIds = [],
  onToggleWishlist,
  onPrimaryAction,
  onSelectGame,
}: HeroCarouselProps) {
  const [isMuted, setIsMuted] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  if (games.length === 0) return null;

  const safeIndex = Math.min(Math.max(activeIndex, 0), games.length - 1);
  const activeGame = games[safeIndex] ?? games[0];
  const isWishlisted = wishlistIds.includes(activeGame.id);
  const isInLibrary = libraryIds.includes(activeGame.id);

  // Auto-advance hero slides every 7 seconds (identical to streaming carousel)
  useEffect(() => {
    if (isPaused || games.length <= 1) return;
    const timer = window.setInterval(() => {
      onSelectIndex((safeIndex + 1) % games.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [safeIndex, games.length, isPaused, onSelectIndex]);

  const backdropSrc =
    GAME_HERO_BACKDROPS[activeGame.id] ||
    activeGame.coverImage ||
    '/src/assets/images/hero_league_champion_1795288189155.jpg';

  const handlePrev = () => {
    onSelectIndex((safeIndex - 1 + games.length) % games.length);
  };

  const handleNext = () => {
    onSelectIndex((safeIndex + 1) % games.length);
  };

  return (
    <section
      data-testid="hero-carousel"
      aria-label="Destaque de Jogos"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="group relative w-full h-[360px] sm:h-[420px] lg:h-[clamp(410px,34vw,510px)] overflow-hidden rounded-[22px] bg-[#141414] border border-white/[0.08] select-none"
    >
      {/* Background Hero Artwork (Full-Bleed Panoramic identical to streaming) */}
      <img
        key={activeGame.id}
        src={backdropSrc}
        alt={activeGame.title}
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover object-center brightness-90"
      />

      {/* Cinematic Matte Vignette Gradients (Dark Aesthetic, Zero Glow, Identical to Streaming) */}
      <div
        data-testid="hero-gradient-bottom"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-transparent"
        aria-hidden="true"
      />

      <div
        data-testid="hero-gradient-left"
        className="pointer-events-none absolute inset-y-0 left-0 w-3/5 bg-gradient-to-r from-[#0A0A0A]/95 via-[#0A0A0A]/60 to-transparent"
        aria-hidden="true"
      />

      {/* Top-Right Sound / Audio Toggle (Identical to streaming hero) */}
      <button
        type="button"
        onClick={() => setIsMuted(!isMuted)}
        aria-label={isMuted ? 'Ativar Áudio do Trailer' : 'Silenciar'}
        className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white border border-white/15 backdrop-blur-sm transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
      >
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>

      {/* Bottom-Left Typography & Actions Block (Identical to Streaming) */}
      <div className="absolute bottom-0 left-0 z-10 max-w-xl px-6 sm:px-9 pb-10 sm:pb-11">
        <div className="text-[11px] font-bold tracking-[0.09em] text-[#FF2A3B]">
          {activeGame.console?.toUpperCase() ?? 'RETRO'} · {activeGame.releaseYear} ·{' '}
          {activeGame.category.toUpperCase()} · NOTA {activeGame.rating}
        </div>

        <h1 className="mt-1.5 text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.08] tracking-tight text-white line-clamp-2">
          {activeGame.title}
        </h1>

        <p className="mt-3 max-w-md line-clamp-3 text-[13.5px] leading-relaxed text-neutral-200">
          {activeGame.shortTagline || activeGame.description}
        </p>

        {/* Primary Action Row (Identical Button Structure to Streaming) */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onPrimaryAction(activeGame)}
            className="inline-flex h-11 items-center gap-2.5 rounded-full bg-[#E5192B] px-7 text-[13px] font-bold text-white transition-colors hover:bg-[#FF2436] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap shadow-md"
          >
            <Play className="h-4 w-4 fill-white" aria-hidden="true" />
            <span>Jogar Agora</span>
          </button>

          {/* Add / In Library Button */}
          <button
            type="button"
            onClick={() => onToggleWishlist(activeGame.id)}
            aria-label={
              isWishlisted
                ? `Remover ${activeGame.title} da biblioteca`
                : `Adicionar ${activeGame.title} à biblioteca`
            }
            aria-pressed={isWishlisted}
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
              isWishlisted || isInLibrary
                ? 'border-[#E5192B] bg-black/65 text-[#FF2A3B]'
                : 'border-white/50 bg-black/45 text-white hover:border-white hover:bg-white/15'
            }`}
          >
            {isWishlisted || isInLibrary ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>

          {/* Like / ThumbsUp Button */}
          <button
            type="button"
            onClick={() => onToggleWishlist(activeGame.id)}
            aria-label={`Curtir ${activeGame.title}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/50 bg-black/45 text-white hover:border-white hover:bg-white/15 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
          >
            <ThumbsUp className="h-4 w-4" />
          </button>

          {/* Details Button */}
          {onSelectGame && (
            <button
              type="button"
              onClick={() => onSelectGame(activeGame)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/35 bg-black/50 px-4 text-xs font-semibold text-white transition-colors hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] whitespace-nowrap"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Detalhes</span>
            </button>
          )}
        </div>
      </div>

      {/* Left/Right Slide Switch Arrows (on hover) */}
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Jogo anterior"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white/85 hover:text-white hover:bg-black/85 border border-white/15 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        type="button"
        onClick={handleNext}
        aria-label="Próximo jogo"
        className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white/85 hover:text-white hover:bg-black/85 border border-white/15 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Slide Pagination Dots (identical to streaming) */}
      <div
        role="tablist"
        aria-label="Slides de jogos em destaque"
        className="absolute inset-x-0 bottom-3.5 z-10 flex items-center justify-center gap-2"
      >
        {games.map((item, idx) => {
          const active = idx === safeIndex;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Slide ${idx + 1}: ${item.title}`}
              onClick={() => onSelectIndex(idx)}
              className={`transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                active
                  ? 'h-2 w-6 rounded-full bg-[#E5192B]'
                  : 'h-2 w-2 rounded-full bg-white/40 hover:bg-white/70'
              }`}
            />
          );
        })}
      </div>
    </section>
  );
}
