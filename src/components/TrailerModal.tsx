import { useEffect, useState } from 'react';
import { Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import type { Game } from '../types/store';
import { GameCoverArt } from './GameCoverArt';

interface TrailerModalProps {
  game: Game | null;
  onClose: () => void;
  onPrimaryAction: (game: Game) => void;
  isInCart: boolean;
  isOwned: boolean;
}

export function TrailerModal({
  game,
  onClose,
  onPrimaryAction,
  isInCart,
  isOwned,
}: TrailerModalProps) {
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(14);
  const [chapterIndex, setChapterIndex] = useState(0);

  useEffect(() => {
    if (!game) return;
    setPlaying(true);
    setProgress(14);
    setChapterIndex(0);
  }, [game]);

  useEffect(() => {
    if (!game || !playing) return;
    const timer = window.setInterval(() => {
      setProgress((prev) => {
        const next = prev >= 100 ? 0 : prev + 1.5;
        const idx = Math.min(
          game.trailerChapters.length - 1,
          Math.floor((next / 100) * game.trailerChapters.length)
        );
        setChapterIndex(idx);
        return next;
      });
    }, 300);
    return () => window.clearInterval(timer);
  }, [game, playing]);

  if (!game) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-[24px] border border-white/10 bg-[#121212] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Simulated Interactive Trailer Stage (flat dark overlay, zero gradients) */}
        <div className="relative aspect-video w-full overflow-hidden bg-black">
          <div
            className={`h-full w-full transition-transform duration-1000 ${
              playing ? 'scale-105' : 'scale-100'
            }`}
          >
            <GameCoverArt game={game} className="h-full w-full" />
          </div>

          <div className="absolute inset-0 bg-black/50" />

          {/* Header */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-[#FF2A3B]">
                OFFICIAL GAMEPLAY PREVIEW
              </span>
              <h2 id="trailer-modal-title" className="text-lg font-bold text-white">
                {game.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close trailer preview"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111]/85 text-white hover:bg-[#242424]"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Center Pause/Play indicator */}
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Pause trailer' : 'Play trailer'}
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/65 text-white ring-1 ring-white/25 transition-colors hover:bg-[#E5192B]"
          >
            {playing ? (
              <Pause className="h-6 w-6 fill-white" />
            ) : (
              <Play className="ml-0.5 h-6 w-6 fill-white" />
            )}
          </button>

          {/* Bottom Scrubber & Chapters */}
          <div className="absolute inset-x-0 bottom-0 space-y-3 bg-black/70 p-5">
            <div className="flex flex-wrap items-center gap-2">
              {game.trailerChapters.map((chapter, idx) => (
                <button
                  key={chapter}
                  type="button"
                  onClick={() => {
                    setChapterIndex(idx);
                    setProgress((idx / game.trailerChapters.length) * 100 + 2);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    idx === chapterIndex
                      ? 'bg-[#E5192B] text-white'
                      : 'bg-[#222222] text-neutral-200 hover:bg-[#303030]'
                  }`}
                >
                  {chapter}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? 'Pause' : 'Play'}
                className="text-white hover:text-[#FF2A3B]"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>

              <input
                type="range"
                aria-label="Trailer timeline"
                min={0}
                max={100}
                value={Math.round(progress)}
                onChange={(e) => setProgress(Number(e.target.value))}
                className="h-1 flex-1 accent-[#E5192B]"
              />

              <span className="font-mono text-[11px] text-neutral-300 tabular-nums">
                {game.trailerDuration}
              </span>

              <button
                type="button"
                onClick={() => setMuted((m) => !m)}
                aria-label={muted ? 'Unmute trailer' : 'Mute trailer'}
                className="text-white hover:text-[#FF2A3B]"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Footer CTA bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#161616] px-6 py-4">
          <p className="text-xs text-neutral-400 max-w-md">{game.shortTagline}</p>
          <button
            type="button"
            onClick={() => {
              onPrimaryAction(game);
              onClose();
            }}
            className="rounded-xl bg-[#E5192B] px-5 py-2.5 text-xs font-extrabold tracking-wide text-white hover:bg-[#FF2436]"
          >
            {isOwned ? 'PLAY NOW' : isInCart ? 'VIEW IN CART' : game.isPreOrder ? 'PRE-ORDER' : 'ADD TO CART'}
          </button>
        </div>
      </div>
    </div>
  );
}
