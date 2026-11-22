import { Download, Pause, Pin, PinOff, Play } from 'lucide-react';
import type { DownloadItem, Game } from '../types/store';
import { GameCoverArt } from './GameCoverArt';

interface LibraryViewProps {
  libraryGames: Game[];
  fastLaunchIds: string[];
  downloads: DownloadItem[];
  onPlayGame: (game: Game) => void;
  onStartDownload: (game: Game) => void;
  onToggleDownloadPause: (gameId: string) => void;
  onToggleFastLaunch: (gameId: string) => void;
  onSelectGame: (game: Game) => void;
  onExploreStore: () => void;
}

export function LibraryView({
  libraryGames,
  fastLaunchIds,
  downloads,
  onPlayGame,
  onStartDownload,
  onToggleDownloadPause,
  onToggleFastLaunch,
  onSelectGame,
  onExploreStore,
}: LibraryViewProps) {
  const downloadByGameId = new Map(downloads.map((d) => [d.gameId, d]));

  return (
    <section aria-label="My Game Library" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">My Library</h1>
          <p className="mt-1 text-xs text-neutral-400 tabular-nums">
            {libraryGames.length} owned {libraryGames.length === 1 ? 'game' : 'games'} · Pin favorites to Fast Launch
          </p>
        </div>

        <button
          type="button"
          onClick={onExploreStore}
          className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-xs font-semibold text-[#FF2A3B] transition-colors hover:bg-[#242424]"
        >
          Browse Store
        </button>
      </div>

      {libraryGames.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#141414] px-6 py-16 text-center">
          <p className="text-sm font-semibold text-white">Your library is empty</p>
          <p className="mt-1 text-xs text-neutral-400">
            Purchase games from the store to install and play them here.
          </p>
          <button
            type="button"
            onClick={onExploreStore}
            className="mt-4 rounded-xl bg-[#E5192B] px-4 py-2 text-xs font-semibold text-white hover:bg-[#FF2436]"
          >
            Discover Games
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {libraryGames.map((game) => {
            const dl = downloadByGameId.get(game.id);
            const isDownloading = dl?.status === 'downloading';
            const isPaused = dl?.status === 'paused';
            const isInstalled = !dl || dl.status === 'completed';
            const isPinned = fastLaunchIds.includes(game.id);

            return (
              <article
                key={game.id}
                className="group flex flex-col overflow-hidden rounded-[18px] bg-[#141414] ring-1 ring-white/[0.06]"
              >
                <button
                  type="button"
                  onClick={() => onSelectGame(game)}
                  aria-label={`View details for ${game.title}`}
                  className="relative aspect-[16/9] w-full overflow-hidden text-left"
                >
                  <GameCoverArt game={game} showCardLogo className="h-full w-full" />
                </button>

                <div className="flex flex-1 flex-col justify-between p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-semibold text-white">{game.title}</h2>
                        <p className="mt-0.5 text-[11.5px] text-neutral-400">
                          {game.category} · {game.sizeGb} GB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onToggleFastLaunch(game.id)}
                        aria-label={
                          isPinned
                            ? `Unpin ${game.title} from Fast Launch`
                            : `Pin ${game.title} to Fast Launch`
                        }
                        title={isPinned ? 'Pinned to Fast Launch' : 'Pin to Fast Launch'}
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                          isPinned
                            ? 'bg-[#E5192B]/20 text-[#FF2A3B]'
                            : 'bg-[#202020] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {isPinned ? (
                          <Pin className="h-3.5 w-3.5" />
                        ) : (
                          <PinOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>

                    {(isDownloading || isPaused) && dl && (
                      <div className="mt-3">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isPaused ? 'bg-neutral-500' : 'bg-[#FF2436]'
                            }`}
                            style={{ width: `${Math.round(dl.progress)}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-neutral-400 tabular-nums">
                          <span>
                            {isPaused ? 'Paused' : `Downloading · ${dl.speedMbps.toFixed(1)} MB/s`}
                          </span>
                          <span className="font-semibold text-white">{Math.round(dl.progress)}%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {isDownloading || isPaused ? (
                      <button
                        type="button"
                        onClick={() => onToggleDownloadPause(game.id)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#242424] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#303030]"
                      >
                        {isDownloading ? (
                          <>
                            <Pause className="h-3.5 w-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="h-3.5 w-3.5" /> Resume
                          </>
                        )}
                      </button>
                    ) : isInstalled ? (
                      <button
                        type="button"
                        onClick={() => onPlayGame(game)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#E5192B] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#FF2436]"
                      >
                        <Play className="h-3.5 w-3.5 fill-white" /> Launch Game
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onStartDownload(game)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#242424] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#E5192B]"
                      >
                        <Download className="h-3.5 w-3.5" /> Install ({game.sizeGb} GB)
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
