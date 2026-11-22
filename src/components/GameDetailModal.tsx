import {
  Cloud,
  Cpu,
  Download,
  FolderOpen,
  Gamepad2,
  HardDrive,
  Heart,
  Monitor,
  Play,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import type { Game } from '../types/store';
import { GameCoverArt } from './GameCoverArt';

interface GameDetailModalProps {
  game: Game | null;
  isOwned: boolean;
  isInCart: boolean;
  isWishlisted: boolean;
  isDownloading: boolean;
  onClose: () => void;
  onToggleCart: (gameId: string) => void;
  onToggleWishlist: (gameId: string) => void;
  onPlayGame: (game: Game) => void;
  onStartDownload: (game: Game) => void;
  onWatchTrailer: (game: Game) => void;
}

export function GameDetailModal({
  game,
  isWishlisted,
  onClose,
  onToggleWishlist,
  onPlayGame,
}: GameDetailModalProps) {
  if (!game) return null;

  const sizeLabel =
    game.sizeGb >= 1
      ? `${game.sizeGb.toFixed(1)} GB`
      : `${Math.round(game.sizeGb * 1024)} MB`;

  const isCs16 = game.console === 'CS16';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs select-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-detail-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[24px] border border-white/10 bg-[#121212] shadow-2xl store-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero Banner Header */}
        <div className="relative h-60 sm:h-72 w-full overflow-hidden bg-black">
          <GameCoverArt game={game} className="h-full w-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes do jogo"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111]/85 text-white backdrop-blur-sm transition-colors hover:bg-[#242424]"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex items-center gap-2 text-[11px] font-bold tracking-[0.08em] text-[#FF2A3B]">
              <span className="rounded bg-[#E5192B] text-white px-2 py-0.5">
                {game.console ?? 'RETRO'}
              </span>
              <span>{game.category} · {game.releaseYear}</span>
            </div>

            <h2
              id="game-detail-title"
              className="mt-1 text-2xl sm:text-3xl font-bold text-white"
            >
              {game.title}
            </h2>

            <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-300">
              <span>{game.developer}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-white font-semibold tabular-nums">
                <Star className="h-3.5 w-3.5 fill-[#FF2A3B] text-[#FF2A3B]" />
                {game.rating.toFixed(1)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums font-mono">{sizeLabel}</span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="grid gap-6 p-6 md:grid-cols-[1.4fr_1fr]">
          <div className="space-y-5">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Sobre o Jogo
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">
                {game.description}
              </p>
            </div>

            {/* Hardware & Emulation Requirements */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Informações de Emulação
              </h3>
              <dl className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-xl bg-[#1A1A1A] p-3">
                  <dt className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <Cpu className="h-3.5 w-3.5 text-[#FF2A3B]" /> Núcleo Emulador
                  </dt>
                  <dd className="mt-1 text-xs font-medium text-white">
                    {isCs16
                      ? 'WebAssembly Xash3D'
                      : game.console === 'PS1'
                        ? 'PCSX ReARMed (WASM)'
                        : game.console === 'GBA'
                          ? 'mGBA (WASM)'
                          : game.console === 'SNES'
                            ? 'Snes9x (WASM)'
                            : 'PPSSPP Core'}
                  </dd>
                </div>
                <div className="rounded-xl bg-[#1A1A1A] p-3">
                  <dt className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <Gamepad2 className="h-3.5 w-3.5 text-[#FF2A3B]" /> Suporte a Joystick
                  </dt>
                  <dd className="mt-1 text-xs font-medium text-white">
                    Xbox, DualShock, DualSense e Genéricos
                  </dd>
                </div>
                <div className="rounded-xl bg-[#1A1A1A] p-3">
                  <dt className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <Cloud className="h-3.5 w-3.5 text-[#FF2A3B]" /> Saves em Nuvem
                  </dt>
                  <dd className="mt-1 text-xs font-medium text-white">
                    Sincronização Neon PostgreSQL
                  </dd>
                </div>
                <div className="rounded-xl bg-[#1A1A1A] p-3">
                  <dt className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                    <HardDrive className="h-3.5 w-3.5 text-[#FF2A3B]" /> Arquivo ROM
                  </dt>
                  <dd className="mt-1 text-xs font-medium text-white truncate">
                    {game.romFilename ?? 'Online WebAssembly'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Launch & Download Card */}
          <div className="flex flex-col justify-between rounded-2xl bg-[#1A1A1A] p-5 border border-white/[0.06]">
            <div>
              <div className="text-xs font-medium text-neutral-400">
                Pronto para Jogar
              </div>

              <p className="mt-2 text-sm font-semibold text-white">
                Emulação Direta no Navegador
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-neutral-400">
                {game.tags.map((tag, idx) => (
                  <span key={tag}>
                    {tag}
                    {idx < game.tags.length - 1 ? ' · ' : ''}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => onPlayGame(game)}
                className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#E5192B] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#FF2436] hover:shadow-lg hover:shadow-[#E5192B]/25 active:scale-[0.99]"
              >
                <Play className="h-4 w-4 fill-white" /> Iniciar Jogo (Play Online)
              </button>

              <div className="flex items-center justify-center gap-2 rounded-xl bg-[#1C1C1C] border border-white/[0.06] px-3.5 py-2.5 text-xs text-neutral-300 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Servidor Git Conectado · Sem Download Manual</span>
              </div>

              <button
                type="button"
                onClick={() => onToggleWishlist(game.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#242424] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#2F2F2F]"
              >
                <Heart
                  className={`h-4 w-4 ${
                    isWishlisted ? 'fill-[#FF2436] text-[#FF2436]' : 'text-neutral-300'
                  }`}
                />
                {isWishlisted ? 'Salvo nos Favoritos' : 'Favoritar Jogo'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
