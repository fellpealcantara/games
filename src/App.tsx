import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import {
  GAMES_CATALOG,
  HERO_FEATURED_IDS,
  INITIAL_CART_IDS,
  INITIAL_DOWNLOADS,
  INITIAL_FAST_LAUNCH_IDS,
  INITIAL_LIBRARY_IDS,
  INITIAL_USER_PROFILE,
  INITIAL_WISHLIST_IDS,
} from './data/games';
import {
  INITIAL_MY_LIST_IDS,
  INITIAL_STREAM_DOWNLOAD_IDS,
  INITIAL_STREAMING_SETTINGS,
  INITIAL_WATCH_PROGRESS,
  STREAMING_CATALOG,
} from './data/streaming';
import type { DownloadItem, Game, NavSection, StoreFilter, UserProfile } from './types/store';
import type {
  AppMode,
  StreamingNavSection,
  StreamingSettings,
  StreamingTitle,
  StreamingTypeFilter,
  WatchProgress,
} from './types/streaming';
import {
  advanceDownloadProgress,
  filterAndSortGames,
  getDiscountedGames,
  paginateItems,
  toggleDownloadPause,
  toggleIdInList,
} from './utils/storeLogic';
import { filterStreamingTitles, upsertWatchProgress } from './utils/streamingLogic';
import { searchStreamingCatalog } from './services/streamingService';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { HeroCarousel } from './components/HeroCarousel';
import { GameCard } from './components/GameCard';
import { CategoriesView } from './components/CategoriesView';
import { LibraryView } from './components/LibraryView';
import { GameDetailModal } from './components/GameDetailModal';
import { TrailerModal } from './components/TrailerModal';
import { CartDrawer } from './components/CartDrawer';
import { WishlistDrawer } from './components/WishlistDrawer';
import { ProfileModal } from './components/ProfileModal';
import { EmulatorModal } from './components/EmulatorModal';
import { StreamingTopBar } from './components/StreamingTopBar';
import { StreamingHomeView } from './components/StreamingHomeView';
import { StreamingDetailModal } from './components/StreamingDetailModal';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { StreamingSettingsHelpModal } from './components/StreamingSettingsHelpModal';

const DEFAULT_FILTER: StoreFilter = {
  category: 'All',
  onlyDiscounts: false,
  maxPrice: 100,
  sortBy: 'featured',
};

const STORAGE_KEY = 'play_gamestore_state_v1';
const STREAMING_STORAGE_KEY = 'play_streaming_state_v1';

interface PersistedState {
  cartIds: string[];
  wishlistIds: string[];
  libraryIds: string[];
  fastLaunchIds: string[];
  profile: UserProfile;
}

interface PersistedStreamingState {
  appMode: AppMode;
  watchProgress: WatchProgress[];
  myListIds: string[];
  likedIds: string[];
  streamDownloadIds: string[];
  streamingSettings: StreamingSettings;
}

interface ActivePlayerSession {
  title: StreamingTitle;
  episodeId?: string;
  startTime: number;
}

function loadInitialState(): PersistedState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      return {
        cartIds: Array.isArray(parsed.cartIds) ? parsed.cartIds : INITIAL_CART_IDS,
        wishlistIds: Array.isArray(parsed.wishlistIds)
          ? parsed.wishlistIds
          : INITIAL_WISHLIST_IDS,
        libraryIds: Array.isArray(parsed.libraryIds) ? parsed.libraryIds : INITIAL_LIBRARY_IDS,
        fastLaunchIds: Array.isArray(parsed.fastLaunchIds)
          ? parsed.fastLaunchIds
          : INITIAL_FAST_LAUNCH_IDS,
        profile: parsed.profile ? { ...INITIAL_USER_PROFILE, ...parsed.profile } : INITIAL_USER_PROFILE,
      };
    }
  } catch {
    // Fallback to initial seeded state
  }
  return {
    cartIds: INITIAL_CART_IDS,
    wishlistIds: INITIAL_WISHLIST_IDS,
    libraryIds: INITIAL_LIBRARY_IDS,
    fastLaunchIds: INITIAL_FAST_LAUNCH_IDS,
    profile: INITIAL_USER_PROFILE,
  };
}

function loadInitialStreamingState(): PersistedStreamingState {
  try {
    const raw = window.localStorage.getItem(STREAMING_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedStreamingState>;
      return {
        appMode: parsed.appMode === 'streaming' ? 'streaming' : 'games',
        watchProgress: Array.isArray(parsed.watchProgress)
          ? parsed.watchProgress
          : INITIAL_WATCH_PROGRESS,
        myListIds: Array.isArray(parsed.myListIds) ? parsed.myListIds : INITIAL_MY_LIST_IDS,
        likedIds: Array.isArray(parsed.likedIds) ? parsed.likedIds : ['stream-1644785443'],
        streamDownloadIds: Array.isArray(parsed.streamDownloadIds)
          ? parsed.streamDownloadIds
          : INITIAL_STREAM_DOWNLOAD_IDS,
        streamingSettings: parsed.streamingSettings
          ? { ...INITIAL_STREAMING_SETTINGS, ...parsed.streamingSettings }
          : INITIAL_STREAMING_SETTINGS,
      };
    }
  } catch {
    // Fallback to seeded streaming state
  }
  return {
    appMode: 'games',
    watchProgress: INITIAL_WATCH_PROGRESS,
    myListIds: INITIAL_MY_LIST_IDS,
    likedIds: ['stream-1644785443'],
    streamDownloadIds: INITIAL_STREAM_DOWNLOAD_IDS,
    streamingSettings: INITIAL_STREAMING_SETTINGS,
  };
}

export default function App() {
  const initial = useMemo(() => loadInitialState(), []);
  const initialStream = useMemo(() => loadInitialStreamingState(), []);

  // Platform Mode Switch (Games <-> Streaming) with URL query support
  const [appMode, setAppMode] = useState<AppMode>(() => {
    try {
      const urlParam = new URLSearchParams(window.location.search).get('mode');
      if (urlParam === 'streaming' || urlParam === 'games') return urlParam;
    } catch {
      // ignore
    }
    return initialStream.appMode;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Games State
  const [activeNav, setActiveNav] = useState<NavSection>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<StoreFilter>(DEFAULT_FILTER);
  const [viewAllDiscounts, setViewAllDiscounts] = useState(false);
  const [discountPage, setDiscountPage] = useState(0);
  const [heroIndex, setHeroIndex] = useState(0);

  const [cartIds, setCartIds] = useState<string[]>(initial.cartIds);
  const [wishlistIds, setWishlistIds] = useState<string[]>(initial.wishlistIds);
  const [libraryIds, setLibraryIds] = useState<string[]>(initial.libraryIds);
  const [fastLaunchIds, setFastLaunchIds] = useState<string[]>(initial.fastLaunchIds);
  const [downloads, setDownloads] = useState<DownloadItem[]>(INITIAL_DOWNLOADS);
  const [profile, setProfile] = useState<UserProfile>(initial.profile);

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [trailerGame, setTrailerGame] = useState<Game | null>(null);
  const [launchingGame, setLaunchingGame] = useState<Game | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Streaming State
  const [streamingNav, setStreamingNav] = useState<StreamingNavSection>('home');
  const [streamingTypeFilter, setStreamingTypeFilter] = useState<StreamingTypeFilter>('All');
  const [streamingSearch, setStreamingSearch] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get('q') || '';
    } catch {
      return '';
    }
  });
  const [watchProgress, setWatchProgress] = useState<WatchProgress[]>(initialStream.watchProgress);
  const [myListIds, setMyListIds] = useState<string[]>(initialStream.myListIds);
  const [likedIds, setLikedIds] = useState<string[]>(initialStream.likedIds);
  const [streamDownloadIds, setStreamDownloadIds] = useState<string[]>(
    initialStream.streamDownloadIds
  );
  const [streamingSettings, setStreamingSettings] = useState<StreamingSettings>(
    initialStream.streamingSettings
  );
  const [selectedStreamTitle, setSelectedStreamTitle] = useState<StreamingTitle | null>(() => {
    try {
      const titleParam = new URLSearchParams(window.location.search).get('title');
      if (titleParam) {
        return STREAMING_CATALOG.find((t) => t.id === titleParam) ?? null;
      }
    } catch {}
    return null;
  });
  const [activePlayer, setActivePlayer] = useState<ActivePlayerSession | null>(() => {
    try {
      const playParam = new URLSearchParams(window.location.search).get('play');
      if (playParam) {
        const title = STREAMING_CATALOG.find((t) => t.id === playParam);
        if (title) {
          const epParam = new URLSearchParams(window.location.search).get('ep');
          return {
            title,
            episodeId: epParam || title.episodes?.[0]?.id,
            startTime: 0,
          };
        }
      }
    } catch {}
    return null;
  });
  const [streamUtilityModal, setStreamUtilityModal] = useState<'settings' | 'help' | null>(null);
  const [streamingSearchResults, setStreamingSearchResults] = useState<StreamingTitle[]>([]);
  const [isSearchingStreaming, setIsSearchingStreaming] = useState(false);

  // Live search debounced
  useEffect(() => {
    const q = streamingSearch.trim();
    if (!q) {
      setStreamingSearchResults([]);
      setIsSearchingStreaming(false);
      return;
    }

    setIsSearchingStreaming(true);
    const timer = window.setTimeout(async () => {
      try {
        const liveResults = await searchStreamingCatalog(q);
        setStreamingSearchResults(liveResults);
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setIsSearchingStreaming(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [streamingSearch]);

  // Persist Games collections to localStorage
  useEffect(() => {
    try {
      const payload: PersistedState = {
        cartIds,
        wishlistIds,
        libraryIds,
        fastLaunchIds,
        profile,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [cartIds, wishlistIds, libraryIds, fastLaunchIds, profile]);

  // Persist Streaming collections & mode to localStorage
  useEffect(() => {
    try {
      const payload: PersistedStreamingState = {
        appMode,
        watchProgress,
        myListIds,
        likedIds,
        streamDownloadIds,
        streamingSettings,
      };
      window.localStorage.setItem(STREAMING_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors
    }
  }, [appMode, watchProgress, myListIds, likedIds, streamDownloadIds, streamingSettings]);

  // Subtle live download ticker for Games
  useEffect(() => {
    const hasActive = downloads.some((d) => d.status === 'downloading');
    if (!hasActive) return;
    const timer = window.setInterval(() => {
      setDownloads((prev) => advanceDownloadProgress(prev, 0.2));
    }, 3500);
    return () => window.clearInterval(timer);
  }, [downloads]);

  const gamesById = useMemo(
    () => new Map(GAMES_CATALOG.map((game) => [game.id, game])),
    []
  );

  const heroGames = useMemo(
    () =>
      HERO_FEATURED_IDS.map((id) => gamesById.get(id)).filter(
        (g): g is Game => Boolean(g)
      ),
    [gamesById]
  );

  const fastLaunchGames = useMemo(
    () =>
      fastLaunchIds
        .map((id) => gamesById.get(id))
        .filter((g): g is Game => Boolean(g)),
    [fastLaunchIds, gamesById]
  );

  const libraryGames = useMemo(
    () =>
      libraryIds
        .map((id) => gamesById.get(id))
        .filter((g): g is Game => Boolean(g)),
    [libraryIds, gamesById]
  );

  const allDiscountedGames = useMemo(() => getDiscountedGames(GAMES_CATALOG), []);

  const popularGames = useMemo(
    () => GAMES_CATALOG.filter((g) => g.isHeroFeatured || g.isDiscountSpotlight),
    []
  );

  const ps1Games = useMemo(
    () => GAMES_CATALOG.filter((g) => g.console === 'PS1'),
    []
  );

  const snesGames = useMemo(
    () => GAMES_CATALOG.filter((g) => g.console === 'SNES'),
    []
  );

  const gameboyGames = useMemo(
    () =>
      GAMES_CATALOG.filter(
        (g) => g.console === 'GBA' || g.console === 'GBC' || g.console === 'GB'
      ),
    []
  );

  const paginatedDiscounts = useMemo(
    () => paginateItems(allDiscountedGames, discountPage, 4),
    [allDiscountedGames, discountPage]
  );

  const hasActiveSearchOrFilter =
    searchQuery.trim().length > 0 ||
    filter.category !== 'All' ||
    filter.onlyDiscounts ||
    filter.maxPrice < 100 ||
    filter.sortBy !== 'featured';

  const filteredCatalog = useMemo(
    () => filterAndSortGames(GAMES_CATALOG, searchQuery, filter),
    [searchQuery, filter]
  );

  const filteredStreamingTitles = useMemo(() => {
    const localFiltered = filterStreamingTitles(STREAMING_CATALOG, {
      query: streamingSearch,
      typeFilter: streamingTypeFilter,
      navSection: streamingNav,
      myListIds,
      watchProgress,
      downloadedIds: streamDownloadIds,
    });

    if (streamingSearch.trim().length > 0 && streamingSearchResults.length > 0) {
      const localIds = new Set(localFiltered.map((t) => t.id));
      const newItems = streamingSearchResults.filter((t) => !localIds.has(t.id));
      return [...localFiltered, ...newItems];
    }

    return localFiltered;
  }, [
    streamingSearch,
    streamingSearchResults,
    streamingTypeFilter,
    streamingNav,
    myListIds,
    watchProgress,
    streamDownloadIds,
  ]);

  // Games Handlers
  const handleToggleCart = (gameId: string) => {
    setCartIds((prev) => toggleIdInList(prev, gameId));
  };

  const handleToggleWishlist = (gameId: string) => {
    setWishlistIds((prev) => toggleIdInList(prev, gameId));
  };

  const handleHeroPrimaryAction = (game: Game) => {
    setLaunchingGame(game);
  };

  const handleCheckout = () => {
    const purchased = [...cartIds];
    setLibraryIds((prev) => Array.from(new Set([...prev, ...purchased])));
    setCartIds([]);

    const firstNewId = purchased.find((id) => !downloads.some((d) => d.gameId === id));
    if (firstNewId) {
      const game = gamesById.get(firstNewId);
      if (game) {
        setDownloads((prev) => [
          {
            gameId: game.id,
            progress: 12,
            status: 'downloading',
            speedMbps: 72.5,
            totalGb: game.sizeGb,
          },
          ...prev,
        ]);
      }
    }
  };

  const handleStartDownload = (game: Game) => {
    setDownloads((prev) => {
      const existing = prev.find((d) => d.gameId === game.id);
      if (existing) {
        return prev.map((d) =>
          d.gameId === game.id
            ? {
                ...d,
                progress: d.status === 'completed' ? 5 : d.progress,
                status: 'downloading',
                speedMbps: 71.2,
              }
            : d
        );
      }
      return [
        {
          gameId: game.id,
          progress: 5,
          status: 'downloading',
          speedMbps: 71.2,
          totalGb: game.sizeGb,
        },
        ...prev,
      ];
    });
  };

  const handleToggleDownloadPause = (gameId: string) => {
    setDownloads((prev) => toggleDownloadPause(prev, gameId));
  };

  const handleRemoveDownload = (gameId: string) => {
    setDownloads((prev) => prev.filter((d) => d.gameId !== gameId));
  };

  const handleToggleFastLaunch = (gameId: string) => {
    setFastLaunchIds((prev) => toggleIdInList(prev, gameId));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilter(DEFAULT_FILTER);
    setViewAllDiscounts(false);
  };

  const handleSelectNav = (section: NavSection) => {
    setActiveNav(section);
    setViewAllDiscounts(false);
    if (section === 'home') {
      setSearchQuery('');
      setFilter(DEFAULT_FILTER);
    }
  };

  // Streaming Handlers
  const handleSelectStreamingNav = (section: StreamingNavSection) => {
    setStreamingNav(section);
    if (section === 'home') {
      setStreamingTypeFilter('All');
      setStreamingSearch('');
    }
  };

  const handleResetStreamingFilters = () => {
    setStreamingNav('home');
    setStreamingTypeFilter('All');
    setStreamingSearch('');
  };

  const handleToggleMyList = (titleId: string) => {
    setMyListIds((prev) => toggleIdInList(prev, titleId));
  };

  const handleToggleLike = (titleId: string) => {
    setLikedIds((prev) => toggleIdInList(prev, titleId));
  };

  const handleToggleStreamDownload = (titleId: string) => {
    setStreamDownloadIds((prev) => toggleIdInList(prev, titleId));
  };

  const handlePlayStreamingTitle = useCallback(
    (title: StreamingTitle, explicitEpisodeId?: string) => {
      const saved = watchProgress.find((p) => p.titleId === title.id);
      const resolvedEpisodeId =
        explicitEpisodeId ?? saved?.episodeId ?? title.episodes?.[0]?.id;

      // Resume timestamp only if playing the same episode (or movie) and not practically finished
      const isSameEpisode =
        saved &&
        (resolvedEpisodeId ? saved.episodeId === resolvedEpisodeId : !saved.episodeId);
      const resumeSeconds =
        isSameEpisode && saved.currentTimeSeconds < saved.durationSeconds - 5
          ? saved.currentTimeSeconds
          : 0;

      setSelectedStreamTitle(null);
      setActivePlayer({
        title,
        episodeId: resolvedEpisodeId,
        startTime: resumeSeconds,
      });
    },
    [watchProgress]
  );

  const handlePlayerSelectEpisode = useCallback((nextEpisodeId: string) => {
    setActivePlayer((prev) =>
      prev
        ? {
            ...prev,
            episodeId: nextEpisodeId,
            startTime: 0,
          }
        : null
    );
  }, []);

  const handleWatchProgressUpdate = useCallback(
    (
      titleId: string,
      episodeId: string | undefined,
      currentTimeSeconds: number,
      durationSeconds: number
    ) => {
      setWatchProgress((prev) =>
        upsertWatchProgress(prev, {
          titleId,
          episodeId,
          currentTimeSeconds,
          durationSeconds,
          updatedAt: Date.now(),
        })
      );
    },
    []
  );

  const selectedDownload = selectedGame
    ? downloads.find((d) => d.gameId === selectedGame.id)
    : undefined;

  const selectedStreamProgress = selectedStreamTitle
    ? watchProgress.find((p) => p.titleId === selectedStreamTitle.id)
    : undefined;

  return (
    <div
      data-testid="gamestore-window"
      data-mode={appMode}
      className="flex h-screen min-h-screen w-full overflow-hidden bg-[#0A0A0A] text-white"
    >
      {/* Full-Viewport 2-Column Shell: Adaptive Sidebar + Main Content */}
      <div className="flex flex-1 min-h-0 gap-5 p-4 sm:p-5">
        <Sidebar
          appMode={appMode}
          onChangeAppMode={(mode) => {
            setAppMode(mode);
            setMobileSidebarOpen(false);
          }}
          activeNav={activeNav}
          onSelectNav={handleSelectNav}
          streamingNav={streamingNav}
          onSelectStreamingNav={handleSelectStreamingNav}
          onOpenStreamingSettings={() => setStreamUtilityModal('settings')}
          onOpenStreamingHelp={() => setStreamUtilityModal('help')}
          fastLaunchGames={fastLaunchGames}
          onFastLaunch={(game) => setLaunchingGame(game)}
          downloads={downloads}
          gamesById={gamesById}
          onToggleDownloadPause={handleToggleDownloadPause}
          onRemoveDownload={handleRemoveDownload}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {appMode === 'streaming' ? (
            <>
              <StreamingTopBar
                searchQuery={streamingSearch}
                onSearchChange={(val) => {
                  setStreamingSearch(val);
                  if (val.trim().length > 0 && streamingNav === 'coming-soon') {
                    setStreamingNav('home');
                  }
                }}
                typeFilter={streamingTypeFilter}
                onSelectTypeFilter={(nextFilter) => {
                  setStreamingTypeFilter(nextFilter);
                  if (streamingNav === 'coming-soon') {
                    setStreamingNav('home');
                  }
                }}
                profile={profile}
                onOpenProfile={() => setProfileOpen(true)}
                onOpenMobileMenu={() => setMobileSidebarOpen(true)}
              />

              <main className="mt-5 flex-1 overflow-y-auto pr-1 store-scroll">
                <StreamingHomeView
                  allTitles={STREAMING_CATALOG}
                  filteredTitles={filteredStreamingTitles}
                  navSection={streamingNav}
                  typeFilter={streamingTypeFilter}
                  searchQuery={streamingSearch}
                  watchProgress={watchProgress}
                  myListIds={myListIds}
                  likedIds={likedIds}
                  isSearching={isSearchingStreaming}
                  onPlayTitle={handlePlayStreamingTitle}
                  onSelectTitle={(title) => setSelectedStreamTitle(title)}
                  onToggleMyList={handleToggleMyList}
                  onToggleLike={handleToggleLike}
                  onResetFilters={handleResetStreamingFilters}
                  onSearchChange={setStreamingSearch}
                />
              </main>
            </>
          ) : (
            <>
              <TopBar
                searchQuery={searchQuery}
                onSearchChange={(val) => {
                  setSearchQuery(val);
                  if (val.trim().length > 0 && activeNav === 'library') {
                    setActiveNav('home');
                  }
                }}
                filter={filter}
                onFilterChange={setFilter}
                onResetFilters={handleResetFilters}
                wishlistCount={wishlistIds.length}
                cartCount={cartIds.length}
                profile={profile}
                onOpenWishlist={() => setWishlistOpen(true)}
                onOpenCart={() => setCartOpen(true)}
                onOpenProfile={() => setProfileOpen(true)}
                onOpenMobileMenu={() => setMobileSidebarOpen(true)}
              />

              <main className="mt-5 flex-1 overflow-y-auto pr-1 store-scroll">
                {activeNav === 'library' ? (
                  <LibraryView
                    libraryGames={libraryGames}
                    fastLaunchIds={fastLaunchIds}
                    downloads={downloads}
                    onPlayGame={(game) => setLaunchingGame(game)}
                    onStartDownload={handleStartDownload}
                    onToggleDownloadPause={handleToggleDownloadPause}
                    onToggleFastLaunch={handleToggleFastLaunch}
                    onSelectGame={(game) => setSelectedGame(game)}
                    onExploreStore={() => handleSelectNav('home')}
                  />
                ) : activeNav === 'categories' || hasActiveSearchOrFilter ? (
                  <CategoriesView
                    games={filteredCatalog}
                    filter={filter}
                    onFilterChange={setFilter}
                    cartIds={cartIds}
                    libraryIds={libraryIds}
                    onSelectGame={(game) => setSelectedGame(game)}
                    onPlayGame={(game) => setLaunchingGame(game)}
                    onQuickAddCart={handleToggleCart}
                    onResetFilters={handleResetFilters}
                  />
                ) : viewAllDiscounts ? (
                  <section aria-label="All discounted games" className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-bold text-white">
                          Games with discounts
                        </h1>
                        <p className="mt-0.5 text-xs text-neutral-400 tabular-nums">
                          Showing all {allDiscountedGames.length} discounted titles
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setViewAllDiscounts(false)}
                        className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-xs font-semibold text-[#FF2A3B] hover:bg-[#242424]"
                      >
                        Back to Home
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
                      {allDiscountedGames.map((game) => (
                        <GameCard
                          key={game.id}
                          game={game}
                          isInCart={cartIds.includes(game.id)}
                          isOwned={libraryIds.includes(game.id)}
                          onSelectGame={(g) => setSelectedGame(g)}
                          onPlayGame={(g) => setLaunchingGame(g)}
                          onQuickAddCart={handleToggleCart}
                        />
                      ))}
                    </div>
                  </section>
                ) : (
                  <div className="space-y-8 pb-6 select-none">
                    <HeroCarousel
                      games={heroGames}
                      activeIndex={heroIndex}
                      onSelectIndex={setHeroIndex}
                      wishlistIds={wishlistIds}
                      cartIds={cartIds}
                      libraryIds={libraryIds}
                      onToggleWishlist={handleToggleWishlist}
                      onPrimaryAction={handleHeroPrimaryAction}
                      onWatchTrailer={(game) => setTrailerGame(game)}
                      onSelectGame={(game) => setSelectedGame(game)}
                    />

                    {/* 1. Destaques da Galeria & Mais Jogados */}
                    <section aria-label="Destaques e Mais Jogados" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">
                            Destaques da Galeria & Mais Jogados
                          </h2>
                          <p className="text-xs text-neutral-400">
                            Títulos lendários prontos para selecionar ou jogar direto no emulador
                          </p>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">
                          {popularGames.length} títulos
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
                        {popularGames.map((game) => (
                          <GameCard
                            key={game.id}
                            game={game}
                            isInCart={cartIds.includes(game.id)}
                            isOwned={libraryIds.includes(game.id)}
                            onSelectGame={(g) => setSelectedGame(g)}
                            onPlayGame={(g) => setLaunchingGame(g)}
                            onQuickAddCart={handleToggleCart}
                          />
                        ))}
                      </div>
                    </section>

                    {/* 2. PlayStation 1 (PS1) Clássicos */}
                    <section aria-label="PlayStation 1 Clássicos" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">
                            PlayStation 1 (PS1) - Clássicos do R36S
                          </h2>
                          <p className="text-xs text-neutral-400">
                            Capas oficiais em alta resolução com suporte a save no Neon PostgreSQL
                          </p>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">
                          {ps1Games.length} títulos
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
                        {ps1Games.map((game) => (
                          <GameCard
                            key={game.id}
                            game={game}
                            isInCart={cartIds.includes(game.id)}
                            isOwned={libraryIds.includes(game.id)}
                            onSelectGame={(g) => setSelectedGame(g)}
                            onPlayGame={(g) => setLaunchingGame(g)}
                            onQuickAddCart={handleToggleCart}
                          />
                        ))}
                      </div>
                    </section>

                    {/* 3. Super Nintendo (SNES) */}
                    <section aria-label="Super Nintendo" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">
                            Super Nintendo (SNES)
                          </h2>
                          <p className="text-xs text-neutral-400">
                            Grandes aventuras inesquecíveis da era 16-bits
                          </p>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">
                          {snesGames.length} títulos
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
                        {snesGames.map((game) => (
                          <GameCard
                            key={game.id}
                            game={game}
                            isInCart={cartIds.includes(game.id)}
                            isOwned={libraryIds.includes(game.id)}
                            onSelectGame={(g) => setSelectedGame(g)}
                            onPlayGame={(g) => setLaunchingGame(g)}
                            onQuickAddCart={handleToggleCart}
                          />
                        ))}
                      </div>
                    </section>

                    {/* 4. Game Boy Advance & Color (GBA / GBC) */}
                    <section aria-label="Game Boy Advance e Color" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">
                            Game Boy Advance & Color (GBA / GBC)
                          </h2>
                          <p className="text-xs text-neutral-400">
                            Aventuras portáteis clássicas prontas para rodar no navegador
                          </p>
                        </div>
                        <span className="text-xs text-neutral-500 font-medium">
                          {gameboyGames.length} títulos
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
                        {gameboyGames.map((game) => (
                          <GameCard
                            key={game.id}
                            game={game}
                            isInCart={cartIds.includes(game.id)}
                            isOwned={libraryIds.includes(game.id)}
                            onSelectGame={(g) => setSelectedGame(g)}
                            onPlayGame={(g) => setLaunchingGame(g)}
                            onQuickAddCart={handleToggleCart}
                          />
                        ))}
                      </div>
                    </section>
                  </div>
                )}
              </main>
            </>
          )}
        </div>
      </div>

      {/* Games Modals & Drawers */}
      <GameDetailModal
        game={selectedGame}
        isOwned={selectedGame ? libraryIds.includes(selectedGame.id) : false}
        isInCart={selectedGame ? cartIds.includes(selectedGame.id) : false}
        isWishlisted={selectedGame ? wishlistIds.includes(selectedGame.id) : false}
        isDownloading={selectedDownload?.status === 'downloading'}
        onClose={() => setSelectedGame(null)}
        onToggleCart={handleToggleCart}
        onToggleWishlist={handleToggleWishlist}
        onPlayGame={(game) => {
          setSelectedGame(null);
          setLaunchingGame(game);
        }}
        onStartDownload={handleStartDownload}
        onWatchTrailer={(game) => {
          setSelectedGame(null);
          setTrailerGame(game);
        }}
      />

      <TrailerModal
        game={trailerGame}
        isInCart={trailerGame ? cartIds.includes(trailerGame.id) : false}
        isOwned={trailerGame ? libraryIds.includes(trailerGame.id) : false}
        onClose={() => setTrailerGame(null)}
        onPrimaryAction={handleHeroPrimaryAction}
      />

      <CartDrawer
        open={cartOpen}
        cartIds={cartIds}
        games={GAMES_CATALOG}
        onClose={() => setCartOpen(false)}
        onRemoveItem={handleToggleCart}
        onCheckout={handleCheckout}
        onGoToLibrary={() => handleSelectNav('library')}
      />

      <WishlistDrawer
        open={wishlistOpen}
        wishlistIds={wishlistIds}
        cartIds={cartIds}
        libraryIds={libraryIds}
        games={GAMES_CATALOG}
        onClose={() => setWishlistOpen(false)}
        onRemoveWishlist={handleToggleWishlist}
        onAddToCart={handleToggleCart}
        onSelectGame={(game) => setSelectedGame(game)}
      />

      <ProfileModal
        open={profileOpen}
        profile={profile}
        ownedCount={libraryIds.length}
        wishlistCount={wishlistIds.length}
        onClose={() => setProfileOpen(false)}
        onSaveProfile={(updates) =>
          setProfile((prev) => ({
            ...prev,
            username: updates.username,
            statusText: updates.statusText,
          }))
        }
      />

      <EmulatorModal
        game={launchingGame}
        onClose={() => setLaunchingGame(null)}
      />

      {/* Streaming Modals & Video Player */}
      <StreamingDetailModal
        title={selectedStreamTitle}
        progress={selectedStreamProgress}
        isInMyList={selectedStreamTitle ? myListIds.includes(selectedStreamTitle.id) : false}
        isLiked={selectedStreamTitle ? likedIds.includes(selectedStreamTitle.id) : false}
        isDownloaded={
          selectedStreamTitle ? streamDownloadIds.includes(selectedStreamTitle.id) : false
        }
        onClose={() => setSelectedStreamTitle(null)}
        onPlay={handlePlayStreamingTitle}
        onToggleMyList={handleToggleMyList}
        onToggleLike={handleToggleLike}
        onToggleDownload={handleToggleStreamDownload}
        relatedTitles={
          selectedStreamTitle && !selectedStreamTitle.isSeries
            ? STREAMING_CATALOG.filter(
                (t) => !t.isSeries && t.id !== selectedStreamTitle.id
              ).slice(0, 8)
            : []
        }
        onSelectRelatedTitle={(rel) => setSelectedStreamTitle(rel)}
      />

      <VideoPlayerModal
        title={activePlayer?.title ?? null}
        episodeId={activePlayer?.episodeId}
        initialTimeSeconds={activePlayer?.startTime ?? 0}
        settings={streamingSettings}
        onClose={() => setActivePlayer(null)}
        onSelectEpisode={handlePlayerSelectEpisode}
        onProgressUpdate={handleWatchProgressUpdate}
      />

      <StreamingSettingsHelpModal
        mode={streamUtilityModal}
        settings={streamingSettings}
        onUpdateSettings={setStreamingSettings}
        onClose={() => setStreamUtilityModal(null)}
      />
    </div>
  );
}
