import { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Clock,
  Compass,
  Download,
  Film,
  Gamepad2,
  HelpCircle,
  Home,
  LayoutGrid,
  ListVideo,
  Pause,
  Play,
  CheckCircle2,
  Settings,
  Timer,
  X,
} from 'lucide-react';
import type { DownloadItem, Game, NavSection } from '../types/store';
import type { AppMode, StreamingNavSection } from '../types/streaming';
import { getGameBoxartUrl } from '../assets/boxarts';

interface SidebarProps {
  appMode: AppMode;
  onChangeAppMode: (mode: AppMode) => void;
  activeNav: NavSection;
  onSelectNav: (section: NavSection) => void;
  streamingNav: StreamingNavSection;
  onSelectStreamingNav: (section: StreamingNavSection) => void;
  onOpenStreamingSettings: () => void;
  onOpenStreamingHelp: () => void;
  fastLaunchGames: Game[];
  onFastLaunch: (game: Game) => void;
  downloads: DownloadItem[];
  gamesById: Map<string, Game>;
  onToggleDownloadPause: (gameId: string) => void;
  onRemoveDownload: (gameId: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  appMode,
  onChangeAppMode,
  activeNav,
  onSelectNav,
  streamingNav,
  onSelectStreamingNav,
  onOpenStreamingSettings,
  onOpenStreamingHelp,
  fastLaunchGames,
  onFastLaunch,
  downloads,
  gamesById,
  onToggleDownloadPause,
  onRemoveDownload,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [downloadsExpanded, setDownloadsExpanded] = useState(false);

  const primaryDownload =
    downloads.find((d) => d.status === 'downloading') ??
    downloads.find((d) => d.status === 'paused') ??
    downloads[0];

  const primaryGame = primaryDownload ? gamesById.get(primaryDownload.gameId) : undefined;

  const gameNavItems: { id: NavSection; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'categories', label: 'Categories', icon: LayoutGrid },
    { id: 'library', label: 'My Library', icon: Gamepad2 },
  ];

  const streamMenuItems: { id: StreamingNavSection; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'coming-soon', label: 'Coming Soon', icon: Timer },
  ];

  const streamLibraryItems: { id: StreamingNavSection; label: string; icon: typeof Home }[] = [
    { id: 'my-list', label: 'My List', icon: ListVideo },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'downloads', label: 'Downloads', icon: Download },
  ];

  const isStreaming = appMode === 'streaming';

  const sidebarBody = (
    <aside
      aria-label="Primary Sidebar Navigation"
      className="relative flex h-full w-[240px] shrink-0 flex-col justify-between rounded-[20px] bg-[#141414] p-4 ring-1 ring-white/[0.06]"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto store-scroll pr-0.5">
        {/* Dynamic Pixelated Brand Lockup: PLAY GAMEPLAY <-> PLAY STREAMING */}
        <div className="flex items-center justify-between px-1.5 pt-2 pb-5">
          <button
            type="button"
            onClick={() => {
              if (isStreaming) {
                onSelectStreamingNav('home');
              } else {
                onSelectNav('home');
              }
              onCloseMobile();
            }}
            className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] rounded-lg"
            aria-label={isStreaming ? 'PLAY STREAMING Home' : 'PLAY GAMEPLAY Home'}
          >
            {isStreaming ? (
              /* Hand-crafted 16x12 crisp pixel-art cinema clapperboard/film logo */
              <svg
                viewBox="0 0 16 12"
                className="h-8 w-11 shrink-0 text-white"
                shapeRendering="crispEdges"
                fill="currentColor"
                aria-hidden="true"
              >
                {/* Top clapper bar with pixel stripes */}
                <rect x="1" y="1" width="14" height="3" />
                <rect x="3" y="1" width="2" height="3" fill="#E5192B" />
                <rect x="7" y="1" width="2" height="3" fill="#E5192B" />
                <rect x="11" y="1" width="2" height="3" fill="#E5192B" />
                {/* Clapper hinge separator */}
                <rect x="1" y="4" width="14" height="1" fill="#141414" />
                {/* Film body */}
                <rect x="1" y="5" width="14" height="6" />
                {/* Pixel play triangle cutout inside film screen */}
                <rect x="6" y="6" width="1" height="4" fill="#141414" />
                <rect x="7" y="6" width="1" height="4" fill="#E5192B" />
                <rect x="8" y="7" width="2" height="2" fill="#E5192B" />
                <rect x="10" y="7" width="1" height="1" fill="#E5192B" />
                {/* Sprocket cutouts on sides */}
                <rect x="2" y="6" width="1" height="1" fill="#141414" />
                <rect x="2" y="9" width="1" height="1" fill="#141414" />
                <rect x="13" y="6" width="1" height="1" fill="#141414" />
                <rect x="13" y="9" width="1" height="1" fill="#141414" />
              </svg>
            ) : (
              /* Hand-crafted 16x11 crisp pixel-art gamepad icon */
              <svg
                viewBox="0 0 16 11"
                className="h-8 w-11 shrink-0 text-white"
                shapeRendering="crispEdges"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="3" y="1" width="10" height="1" />
                <rect x="2" y="2" width="12" height="1" />
                <rect x="1" y="3" width="14" height="4" />
                <rect x="1" y="7" width="4" height="1" />
                <rect x="11" y="7" width="4" height="1" />
                <rect x="0" y="7" width="4" height="2" />
                <rect x="12" y="7" width="4" height="2" />
                <rect x="0" y="9" width="3" height="1" />
                <rect x="13" y="9" width="3" height="1" />
                <rect x="4" y="3" width="1" height="3" fill="#141414" />
                <rect x="3" y="4" width="3" height="1" fill="#141414" />
                <rect x="11" y="3" width="1" height="1" fill="#E5192B" />
                <rect x="12" y="4" width="1" height="1" fill="#E5192B" />
                <rect x="10" y="4" width="1" height="1" fill="#141414" />
                <rect x="11" y="5" width="1" height="1" fill="#141414" />
                <rect x="7" y="5" width="2" height="1" fill="#141414" />
              </svg>
            )}

            <div className="flex flex-col leading-none">
              <span className="font-pixel text-[14px] tracking-[0.06em] text-white whitespace-nowrap">
                PLAY
              </span>
              <span
                data-testid="brand-subtitle"
                className="mt-1.5 font-pixel text-[7px] tracking-[0.11em] text-[#FF2A3B] whitespace-nowrap"
              >
                {isStreaming ? 'STREAMING' : 'GAMEPLAY'}
              </span>
            </div>
          </button>

          {mobileOpen && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mode Switch: Games <-> Streaming */}
        <div
          role="tablist"
          aria-label="Platform mode switch"
          className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-[#0D0D0D] p-1 ring-1 ring-white/[0.06]"
        >
          <button
            type="button"
            role="tab"
            aria-selected={!isStreaming}
            onClick={() => onChangeAppMode('games')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
              !isStreaming
                ? 'bg-[#E5192B] text-white'
                : 'text-neutral-400 hover:bg-[#1A1A1A] hover:text-white'
            }`}
          >
            <Gamepad2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Games</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isStreaming}
            onClick={() => onChangeAppMode('streaming')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11.5px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
              isStreaming
                ? 'bg-[#E5192B] text-white'
                : 'text-neutral-400 hover:bg-[#1A1A1A] hover:text-white'
            }`}
          >
            <Film className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Streaming</span>
          </button>
        </div>

        {/* Adaptive Sidebar Navigation */}
        {isStreaming ? (
          <div className="flex flex-1 flex-col justify-between">
            <div>
              {/* Menu Group */}
              <div className="px-2 pb-2 text-[11px] font-medium text-neutral-500">Menu</div>
              <nav aria-label="Streaming Menu" className="space-y-1">
                {streamMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = streamingNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectStreamingNav(item.id);
                        onCloseMobile();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
                        isActive
                          ? 'bg-[#222222] font-semibold text-white'
                          : 'text-[#8E8E93] hover:bg-[#1C1C1C] hover:text-neutral-200'
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          isActive ? 'text-[#FF2A3B]' : 'text-[#737378]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="my-5 h-px bg-white/[0.07]" />

              {/* Library Group */}
              <div className="px-2 pb-2 text-[11px] font-medium text-neutral-500">Library</div>
              <nav aria-label="Streaming Library" className="space-y-1">
                {streamLibraryItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = streamingNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectStreamingNav(item.id);
                        onCloseMobile();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
                        isActive
                          ? 'bg-[#222222] font-semibold text-white'
                          : 'text-[#8E8E93] hover:bg-[#1C1C1C] hover:text-neutral-200'
                      }`}
                    >
                      <Icon
                        className={`h-[18px] w-[18px] shrink-0 ${
                          isActive ? 'text-[#FF2A3B]' : 'text-[#737378]'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="my-5 h-px bg-white/[0.07]" />

              {/* Settings & Help */}
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenStreamingSettings();
                    onCloseMobile();
                  }}
                  className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#8E8E93] transition-colors hover:bg-[#1C1C1C] hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
                >
                  <Settings className="h-[18px] w-[18px] shrink-0 text-[#737378]" aria-hidden="true" />
                  <span className="whitespace-nowrap">Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenStreamingHelp();
                    onCloseMobile();
                  }}
                  className="flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium text-[#8E8E93] transition-colors hover:bg-[#1C1C1C] hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
                >
                  <HelpCircle className="h-[18px] w-[18px] shrink-0 text-[#737378]" aria-hidden="true" />
                  <span className="whitespace-nowrap">Help</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Games Sidebar Navigation */
          <>
            <nav aria-label="Main Store Views" className="space-y-1.5">
              {gameNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectNav(item.id);
                      onCloseMobile();
                    }}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex w-full items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
                      isActive
                        ? 'bg-[#242424] font-semibold text-white'
                        : 'text-[#8E8E93] hover:bg-[#1C1C1C] hover:text-neutral-200'
                    }`}
                  >
                    <Icon
                      className={`h-[18px] w-[18px] shrink-0 ${
                        isActive ? 'text-[#FF2A3B]' : 'text-[#737378]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* FAST LAUNCH */}
            <div className="mt-7">
              <div className="px-2 pb-3 text-[10.5px] font-bold tracking-[0.09em] text-[#7A7A80]">
                FAST LAUNCH
              </div>
              <ul className="space-y-2" aria-label="Fast launch games">
                {fastLaunchGames.map((game) => (
                  <li key={game.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onFastLaunch(game);
                        onCloseMobile();
                      }}
                      className="group flex w-full items-center gap-3 rounded-xl px-1.5 py-1.5 text-left transition-colors duration-150 hover:bg-[#1F1F1F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
                      aria-label={`Launch ${game.title}`}
                    >
                      {(() => {
                        const boxart = getGameBoxartUrl(game.id) || game.libretroBoxartUrl || game.coverImage;
                        return (
                          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#0A0A0A] ring-1 ring-white/10">
                            {boxart ? (
                              <img
                                src={boxart}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-[#1A1A1A]">
                                <Gamepad2 className="h-4 w-4 text-neutral-500" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/55 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                              <Play className="h-3.5 w-3.5 fill-[#FF2A3B] text-[#FF2A3B]" aria-hidden="true" />
                            </div>
                          </div>
                        );
                      })()}
                      <span className="truncate text-[12.5px] font-medium text-neutral-300 transition-colors group-hover:text-white">
                        {game.title}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>

      {/* Bottom Download Widget (shown in Games mode) */}
      {!isStreaming && (
        <div className="relative mt-4 pt-2">
          {downloadsExpanded && (
            <div
              role="region"
              aria-label="Downloads Queue"
              className="absolute right-0 bottom-full left-0 z-30 mb-2 rounded-2xl border border-white/10 bg-[#1A1A1A] p-3 shadow-2xl"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-xs font-semibold text-white">
                  Downloads ({downloads.length})
                </span>
                <button
                  type="button"
                  onClick={() => setDownloadsExpanded(false)}
                  aria-label="Collapse downloads queue"
                  className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-white"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {downloads.length === 0 ? (
                <p className="py-3 text-center text-xs text-neutral-400">No active downloads</p>
              ) : (
                <div className="max-h-48 space-y-2.5 overflow-y-auto store-scroll pr-0.5">
                  {downloads.map((dl) => {
                    const g = gamesById.get(dl.gameId);
                    if (!g) return null;
                    const pct = Math.round(dl.progress);
                    return (
                      <div key={dl.gameId} className="rounded-xl bg-[#101010] p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-medium text-white">
                            {g.title}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {dl.status !== 'completed' ? (
                              <button
                                type="button"
                                onClick={() => onToggleDownloadPause(dl.gameId)}
                                aria-label={
                                  dl.status === 'downloading'
                                    ? `Pause ${g.title} download`
                                    : `Resume ${g.title} download`
                                }
                                className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-neutral-200 hover:bg-[#E5192B] hover:text-white transition-colors"
                              >
                                {dl.status === 'downloading' ? (
                                  <Pause className="h-3 w-3" />
                                ) : (
                                  <Play className="h-3 w-3" />
                                )}
                              </button>
                            ) : (
                              <CheckCircle2
                                className="h-3.5 w-3.5 text-neutral-300"
                                aria-label="Download completed"
                              />
                            )}
                            <button
                              type="button"
                              onClick={() => onRemoveDownload(dl.gameId)}
                              aria-label={`Remove ${g.title} from downloads`}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#2E2E2E]">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              dl.status === 'completed'
                                ? 'bg-white'
                                : dl.status === 'paused'
                                  ? 'bg-neutral-500'
                                  : 'bg-[#FF2436]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-neutral-400 tabular-nums">
                          <span>
                            {dl.status === 'downloading'
                              ? `${dl.speedMbps.toFixed(1)} MB/s`
                              : dl.status === 'paused'
                                ? 'Paused'
                                : 'Installed'}
                          </span>
                          <span className="font-semibold text-white">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mb-1.5 flex justify-center">
            <button
              type="button"
              onClick={() => setDownloadsExpanded((prev) => !prev)}
              aria-expanded={downloadsExpanded}
              aria-label="Toggle downloads manager"
              className="flex h-5 w-10 items-center justify-center rounded-full text-neutral-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
            >
              {downloadsExpanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronUp className="h-3.5 w-3.5" />
              )}
            </button>
          </div>

          {primaryDownload && primaryGame ? (
            <button
              type="button"
              onClick={() => setDownloadsExpanded((prev) => !prev)}
              aria-label={`${primaryGame.title} ${primaryDownload.status} ${Math.round(primaryDownload.progress)}%`}
              className="flex w-full items-center gap-2.5 rounded-xl bg-[#1F1F1F] p-2.5 text-left transition-colors hover:bg-[#272727] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
            >
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#0A0A0A]">
                {(() => {
                  const bImg = getGameBoxartUrl(primaryGame.id) || primaryGame.libretroBoxartUrl || primaryGame.coverImage;
                  return bImg ? (
                    <img
                      src={bImg}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[#1A1A1A]">
                      <Gamepad2 className="h-4 w-4 text-neutral-500" />
                    </div>
                  );
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-white">
                  {primaryGame.title}
                </div>
                <div className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full bg-[#333333]">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      primaryDownload.status === 'paused'
                        ? 'bg-neutral-500'
                        : primaryDownload.status === 'completed'
                          ? 'bg-white'
                          : 'bg-[#FF2436]'
                    }`}
                    style={{ width: `${Math.round(primaryDownload.progress)}%` }}
                  />
                </div>
                <div className="mt-1 flex items-center justify-between text-[10.5px] leading-none">
                  <span className="text-neutral-400">
                    {primaryDownload.status === 'downloading'
                      ? 'Downloading'
                      : primaryDownload.status === 'paused'
                        ? 'Paused'
                        : 'Completed'}
                  </span>
                  <span className="font-semibold text-white tabular-nums">
                    {Math.round(primaryDownload.progress)}%
                  </span>
                </div>
              </div>
            </button>
          ) : (
            <div className="rounded-xl bg-[#1F1F1F] px-3 py-2.5 text-center text-xs text-neutral-400">
              All downloads complete
            </div>
          )}
        </div>
      )}
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block lg:h-full">{sidebarBody}</div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full p-3">{sidebarBody}</div>
        </div>
      )}
    </>
  );
}
