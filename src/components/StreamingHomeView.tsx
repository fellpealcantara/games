import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Film,
  Info,
  Play,
  Plus,
  Search,
  Star,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  StreamSection,
  StreamingNavSection,
  StreamingTitle,
  StreamingTypeFilter,
  WatchProgress,
} from '../types/streaming';
import { HOT_SEARCH_KEYWORDS, STREAM_HOME_SECTIONS } from '../data/streaming';
import { getWatchProgressPercent } from '../utils/streamingLogic';
import { resolveMediaImageUrl } from '../services/streamingService';

interface StreamingHomeViewProps {
  allTitles: StreamingTitle[];
  filteredTitles: StreamingTitle[];
  navSection: StreamingNavSection;
  typeFilter: StreamingTypeFilter;
  searchQuery: string;
  watchProgress: WatchProgress[];
  myListIds: string[];
  likedIds: string[];
  isSearching?: boolean;
  onPlayTitle: (title: StreamingTitle, episodeId?: string) => void;
  onSelectTitle: (title: StreamingTitle) => void;
  onToggleMyList: (titleId: string) => void;
  onToggleLike: (titleId: string) => void;
  onResetFilters: () => void;
  onSearchChange?: (val: string) => void;
}

const HERO_PREVIEW_CLIPS: string[] = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
];

type SectionMediaTypeFilter = 'Todos' | 'Filmes' | 'Séries' | 'Animes';

export function StreamingHomeView({
  allTitles,
  filteredTitles,
  navSection,
  typeFilter,
  searchQuery,
  watchProgress,
  myListIds,
  likedIds,
  isSearching = false,
  onPlayTitle,
  onSelectTitle,
  onToggleMyList,
  onToggleLike,
  onResetFilters,
  onSearchChange,
}: StreamingHomeViewProps) {
  const heroTitles = allTitles.filter((t) => t.isHeroFeatured);
  const [heroIndex, setHeroIndex] = useState(0);
  const [isHeroMuted, setIsHeroMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);

  // Section Detail Screen State
  const [selectedSection, setSelectedSection] = useState<StreamSection | null>(null);
  const [sectionFilter, setSectionFilter] = useState<SectionMediaTypeFilter>('Todos');
  const [sectionInternalSearch, setSectionInternalSearch] = useState<string>('');

  const activeHero = heroTitles[heroIndex] ?? allTitles[0];
  const progressByTitleId = new Map(watchProgress.map((p) => [p.titleId, p]));

  // Auto-scroll hero carousel every 6 seconds
  useEffect(() => {
    if (isPaused || heroTitles.length <= 1) return;
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroTitles.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [heroTitles.length, isPaused]);

  const handlePrevHero = () => {
    setHeroIndex((prev) => (prev - 1 + heroTitles.length) % heroTitles.length);
  };

  const handleNextHero = () => {
    setHeroIndex((prev) => (prev + 1) % heroTitles.length);
  };

  // Video excerpt preview handling for active hero
  useEffect(() => {
    setVideoLoaded(false);
    const video = heroVideoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      if (video.duration && video.duration > 0) {
        video.currentTime = video.duration * 0.25;
        video.play().then(() => setVideoLoaded(true)).catch(() => {});
      }
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [activeHero?.id, heroIndex]);

  // Section Detail View
  if (selectedSection) {
    const rawItems = selectedSection.items;
    const moviesCount = rawItems.filter((i) => i.type === 'Movies').length;
    const seriesCount = rawItems.filter((i) => i.type === 'Series' || i.type === 'TV-Shows').length;
    const animesCount = rawItems.filter((i) => i.type === 'Animes').length;

    const filteredSectionItems = rawItems.filter((item) => {
      if (sectionFilter === 'Filmes' && item.type !== 'Movies') return false;
      if (
        sectionFilter === 'Séries' &&
        item.type !== 'Series' &&
        item.type !== 'TV-Shows'
      )
        return false;
      if (sectionFilter === 'Animes' && item.type !== 'Animes') return false;

      if (sectionInternalSearch.trim().length > 0) {
        const q = sectionInternalSearch.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.genres.some((g) => g.toLowerCase().includes(q))
        );
      }
      return true;
    });

    return (
      <section aria-label={selectedSection.title} className="space-y-6 pb-6 select-none">
        {/* Header with Back Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSelectedSection(null);
                setSectionInternalSearch('');
                setSectionFilter('Todos');
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A1A1A] text-neutral-300 hover:bg-[#262626] hover:text-white transition-colors"
              aria-label="Voltar para início"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Film className="h-5 w-5 text-[#FF2A3B]" />
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {selectedSection.title}
                </h1>
              </div>
              <p className="mt-0.5 text-xs text-neutral-400">
                {rawItems.length} {rawItems.length === 1 ? 'obra disponível' : 'obras no catálogo oficial'}
              </p>
            </div>
          </div>

          {/* Internal search within this section */}
          <div className="relative w-full sm:w-64">
            <div className="flex h-10 items-center rounded-xl bg-[#161616] pl-3 pr-2 ring-1 ring-white/[0.06] focus-within:ring-[#E5192B]">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={sectionInternalSearch}
                onChange={(e) => setSectionInternalSearch(e.target.value)}
                placeholder="Filtrar nesta seção..."
                className="h-full w-full bg-transparent px-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
              {sectionInternalSearch.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSectionInternalSearch('')}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Media type filter tabs with dynamic counts */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { label: 'Todos', count: rawItems.length },
              { label: 'Filmes', count: moviesCount },
              { label: 'Séries', count: seriesCount },
              { label: 'Animes', count: animesCount },
            ] as const
          ).map((tab) => {
            const isActive = sectionFilter === tab.label;
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setSectionFilter(tab.label)}
                className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#E5192B] text-white'
                    : 'bg-[#181818] text-neutral-300 hover:bg-[#222222] hover:text-white'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-bold ${
                    isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-neutral-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid of titles in section */}
        {filteredSectionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#141414] px-6 py-16 text-center">
            <p className="text-sm font-semibold text-white">Nenhum título nesta categoria</p>
            <p className="mt-1 text-xs text-neutral-400">
              Altere os filtros ou limpe o termo de busca.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
            {filteredSectionItems.map((title) => {
              const prog = progressByTitleId.get(title.id);
              const pct = prog
                ? getWatchProgressPercent(prog.currentTimeSeconds, prog.durationSeconds)
                : 0;
              const cardUrl = resolveMediaImageUrl(title.cardImage);

              return (
                <article key={title.id} className="group flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl bg-[#161616] border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => onSelectTitle(title)}
                      aria-label={`Abrir ${title.title}`}
                      className="block aspect-[2/3] w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
                    >
                      <img
                        src={cardUrl}
                        alt={title.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100 flex items-center justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5192B] text-white">
                          <Play className="ml-0.5 h-5 w-5 fill-white" />
                        </span>
                      </div>
                    </button>
                  </div>

                  {pct > 0 && (
                    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                      <div
                        className="h-full rounded-full bg-[#E5192B]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  <div className="mt-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectTitle(title)}
                      className="block w-full truncate text-left text-[13.5px] font-semibold text-white transition-colors hover:text-[#FF2A3B]"
                    >
                      {title.title}
                    </button>
                    <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                      {title.type} · {title.year} · {title.releaseNote ?? title.durationLabel}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  const isFilteredView =
    navSection !== 'home' || typeFilter !== 'All' || searchQuery.trim().length > 0;

  if (isFilteredView) {
    const headingMap: Record<StreamingNavSection, string> = {
      home: typeFilter === 'All' ? 'Resultados da Busca' : typeFilter,
      discover: 'Explorar Catálogo',
      'coming-soon': 'Em Breve',
      'my-list': 'Minha Lista',
      recent: 'Continuar Assistindo',
      downloads: 'Downloads Offline',
    };

    const heading =
      searchQuery.trim().length > 0
        ? `Resultados para "${searchQuery.trim()}"`
        : typeFilter !== 'All' && navSection === 'home'
          ? typeFilter
          : headingMap[navSection];

    return (
      <section aria-label={heading} className="space-y-6 pb-6 select-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold text-white">{heading}</h1>
              <p className="mt-1 text-xs text-neutral-400 tabular-nums">
                {filteredTitles.length}{' '}
                {filteredTitles.length === 1 ? 'título disponível' : 'títulos disponíveis'}
              </p>
            </div>
            {isSearching && (
              <span className="flex items-center gap-2 rounded-full border border-white/10 bg-[#161616] px-3 py-1 text-xs font-semibold text-neutral-300">
                <span className="h-2 w-2 rounded-full bg-[#E5192B] animate-pulse" />
                Buscando no catálogo oficial...
              </span>
            )}
          </div>

          {(typeFilter !== 'All' || searchQuery.trim().length > 0) && (
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-xl bg-[#1A1A1A] px-4 py-2 text-xs font-semibold text-[#FF2A3B] hover:bg-[#242424]"
            >
              Limpar Filtro
            </button>
          )}
        </div>

        {/* Hot Search Trending Keywords Row */}
        {HOT_SEARCH_KEYWORDS.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/[0.06] bg-[#141414] p-3">
            <span className="text-xs font-semibold text-neutral-400">Buscas em Alta:</span>
            {HOT_SEARCH_KEYWORDS.slice(0, 8).map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => onSearchChange?.(kw)}
                className="rounded-full bg-[#1F1F1F] px-3 py-1 text-xs font-medium text-neutral-300 hover:bg-[#2C2C2C] hover:text-white transition-colors"
              >
                {kw}
              </button>
            ))}
          </div>
        )}

        {filteredTitles.length === 0 && !isSearching ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#141414] px-6 py-16 text-center">
            <p className="text-sm font-semibold text-white">Nenhum título encontrado</p>
            <p className="mt-1 text-xs text-neutral-400">
              Tente buscar por outro termo ou selecione uma sugestão em alta acima.
            </p>
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 rounded-xl bg-[#E5192B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#FF2436]"
            >
              Voltar ao Início
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
            {filteredTitles.map((title) => {
              const prog = progressByTitleId.get(title.id);
              const pct = prog
                ? getWatchProgressPercent(prog.currentTimeSeconds, prog.durationSeconds)
                : 0;
              const cardUrl = resolveMediaImageUrl(title.cardImage);

              return (
                <article key={title.id} className="group flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl bg-[#161616] border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => onSelectTitle(title)}
                      aria-label={`Abrir ${title.title}`}
                      className="block aspect-[2/3] w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
                    >
                      <img
                        src={cardUrl}
                        alt={title.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100 flex items-center justify-center">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5192B] text-white">
                          <Play className="ml-0.5 h-5 w-5 fill-white" />
                        </span>
                      </div>
                    </button>
                  </div>

                  {pct > 0 && (
                    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                      <div
                        className="h-full rounded-full bg-[#E5192B]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  <div className="mt-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectTitle(title)}
                      className="block w-full truncate text-left text-[13.5px] font-semibold text-white transition-colors hover:text-[#FF2A3B]"
                    >
                      {title.title}
                    </button>
                    <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                      {title.type} · {title.year} · {title.releaseNote ?? title.durationLabel}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  }

  // Structured Sections
  const continueWatchingItems = watchProgress
    .map((prog) => {
      const title = allTitles.find((t) => t.id === prog.titleId);
      if (!title) return null;
      const episode = prog.episodeId
        ? title.episodes?.find((e) => e.id === prog.episodeId)
        : undefined;
      return { title, prog, episode };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 16);

  const isHeroInList = myListIds.includes(activeHero.id);
  const isHeroLiked = likedIds.includes(activeHero.id);
  const heroImgUrl = resolveMediaImageUrl(activeHero.heroImage);
  const heroVideoSrc = activeHero.streamUrl?.endsWith('.mp4')
    ? activeHero.streamUrl
    : HERO_PREVIEW_CLIPS[heroIndex % HERO_PREVIEW_CLIPS.length];

  return (
    <div className="space-y-8 pb-6 select-none">
      {/* Hero Carousel with Autoplay Muted Video Preview of the work */}
      <section
        data-testid="streaming-hero"
        aria-label="Destaque de streaming"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="group relative w-full h-[360px] sm:h-[420px] lg:h-[clamp(410px,34vw,510px)] overflow-hidden rounded-[22px] bg-[#141414] border border-white/[0.08]"
      >
        {/* Fallback Cover Artwork */}
        <img
          src={heroImgUrl}
          alt={activeHero.title}
          referrerPolicy="no-referrer"
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            videoLoaded ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Video Preview: Excerpt of the work playing muted in background */}
        <video
          ref={heroVideoRef}
          key={`${activeHero.id}-${heroIndex}`}
          src={heroVideoSrc}
          autoPlay
          muted={isHeroMuted}
          loop
          playsInline
          onCanPlay={() => setVideoLoaded(true)}
          onLoadedData={() => setVideoLoaded(true)}
          onPlaying={() => setVideoLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            videoLoaded ? 'opacity-100' : 'opacity-70'
          }`}
        />

        {/* Cinematic Matte Vignette Gradients */}
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

        {/* Sound toggle button */}
        <button
          type="button"
          onClick={() => setIsHeroMuted(!isHeroMuted)}
          aria-label={isHeroMuted ? 'Ativar Áudio do Trailer' : 'Silenciar'}
          className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white border border-white/15 backdrop-blur-sm transition-colors hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
        >
          {isHeroMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>

        {/* Bottom-Left Content Block */}
        <div className="absolute bottom-0 left-0 z-10 max-w-xl px-6 sm:px-9 pb-10 sm:pb-11">
          <div className="text-[11px] font-bold tracking-[0.09em] text-[#FF2A3B]">
            {activeHero.type.toUpperCase()} · {activeHero.year} · {activeHero.durationLabel} ·{' '}
            {activeHero.quality}
          </div>

          <h1 className="mt-1.5 text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.08] tracking-tight text-white">
            {activeHero.title}
          </h1>

          <p className="mt-3 max-w-md line-clamp-3 text-[13.5px] leading-relaxed text-neutral-200">
            {activeHero.synopsis}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onPlayTitle(activeHero, undefined)}
              className="inline-flex h-11 items-center gap-2.5 rounded-full bg-[#E5192B] px-7 text-[13px] font-bold text-white transition-colors hover:bg-[#FF2436] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-white" aria-hidden="true" />
              <span>Assistir Agora (00:00)</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleMyList(activeHero.id)}
              aria-label={
                isHeroInList
                  ? `Remover ${activeHero.title} da Minha Lista`
                  : `Adicionar ${activeHero.title} à Minha Lista`
              }
              aria-pressed={isHeroInList}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
                isHeroInList
                  ? 'border-[#E5192B] bg-black/65 text-[#FF2A3B]'
                  : 'border-white/50 bg-black/45 text-white hover:border-white hover:bg-white/15'
              }`}
            >
              {isHeroInList ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => onToggleLike(activeHero.id)}
              aria-label={isHeroLiked ? `Descurtir ${activeHero.title}` : `Curtir ${activeHero.title}`}
              aria-pressed={isHeroLiked}
              className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
                isHeroLiked
                  ? 'border-[#E5192B] bg-black/65 text-[#FF2A3B]'
                  : 'border-white/50 bg-black/45 text-white hover:border-white hover:bg-white/15'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onSelectTitle(activeHero)}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-white/35 bg-black/50 px-4 text-xs font-semibold text-white transition-colors hover:border-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] whitespace-nowrap"
            >
              <Info className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{activeHero.isSeries ? 'Episódios' : 'Detalhes'}</span>
            </button>
          </div>
        </div>

        {/* Left & Right Slide Navigation Arrows (hover) */}
        {heroTitles.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrevHero}
              aria-label="Obra anterior"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white/85 hover:text-white hover:bg-black/85 border border-white/15 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleNextHero}
              aria-label="Próxima obra"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white/85 hover:text-white hover:bg-black/85 border border-white/15 backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Carousel Slide Indicators */}
        <div
          role="tablist"
          aria-label="Slides de obras em destaque"
          className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2"
        >
          {heroTitles.map((item, idx) => {
            const active = idx === heroIndex;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Slide ${idx + 1}: ${item.title}`}
                onClick={() => setHeroIndex(idx)}
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

      {/* 1. Continue Watching Row */}
      {continueWatchingItems.length > 0 && (
        <section aria-label="Continuar Assistindo">
          <div className="mb-3.5 flex items-center justify-between">
            <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white">
              Continuar Assistindo
            </h2>
          </div>

          <div
            data-testid="continue-watching-grid"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12"
          >
            {continueWatchingItems.map(({ title, prog, episode }) => {
              const pct = getWatchProgressPercent(
                prog.currentTimeSeconds,
                prog.durationSeconds
              );
              const cardUrl = resolveMediaImageUrl(title.cardImage);

              return (
                <article key={title.id} className="group flex flex-col">
                  <div className="relative overflow-hidden rounded-2xl bg-[#161616] border border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => onPlayTitle(title, prog.episodeId)}
                      aria-label={`Continuar ${title.title}`}
                      className="block aspect-[2/3] w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
                    >
                      <img
                        src={cardUrl}
                        alt={title.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/45 transition-colors flex flex-col justify-between p-3">
                        <div className="flex justify-end">
                          <span className="rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-neutral-100 tabular-nums">
                            {episode ? `S${episode.season}:E${episode.number}` : title.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-center opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#E5192B] text-white">
                            <Play className="ml-0.5 h-5 w-5 fill-white" />
                          </span>
                        </div>
                        <div className="h-4" aria-hidden="true" />
                      </div>
                    </button>
                  </div>

                  {pct > 0 && (
                    <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-[#2A2A2A]">
                      <div
                        className="h-full rounded-full bg-[#E5192B]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  )}

                  <div className="mt-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => onSelectTitle(title)}
                      className="block w-full truncate text-left text-[13.5px] font-semibold text-white transition-colors hover:text-[#FF2A3B]"
                    >
                      {title.title}
                    </button>
                    <div className="mt-0.5 truncate text-[11px] text-neutral-400">
                      {episode ? `S${episode.season}:E${episode.number} · ${episode.title}` : `${title.type} · ${title.durationLabel}`}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Official Structured Sections (Directly from Channel modules) */}
      {STREAM_HOME_SECTIONS.map((section, idx) => {
        const displayItems = section.items.slice(0, 18);

        return (
          <section key={`${section.title}-${idx}`} aria-label={section.title} className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedSection(section)}
                className="group flex items-center gap-2 text-left focus:outline-none"
              >
                <Film className="h-4 w-4 text-[#FF2A3B]" aria-hidden="true" />
                <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-white group-hover:text-[#FF2A3B] transition-colors">
                  {section.title}
                </h2>
                <ChevronRight className="h-4 w-4 text-neutral-500 group-hover:text-white transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedSection(section)}
                className="text-xs font-semibold text-[#FF2A3B] hover:text-[#FF4D5C] transition-colors"
              >
                Ver todos ({section.items.length})
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
              {displayItems.map((title) => {
                const cardUrl = resolveMediaImageUrl(title.cardImage);
                return (
                  <article key={title.id} className="group flex flex-col select-none">
                    <div className="relative overflow-hidden rounded-2xl bg-[#161616] border border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => onSelectTitle(title)}
                        aria-label={`Abrir ${title.title}`}
                        className="block aspect-[2/3] w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
                      >
                        <img
                          src={cardUrl}
                          alt={title.title}
                          referrerPolicy="no-referrer"
                          loading="lazy"
                          className="h-full w-full object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-black/45 opacity-0 transition-opacity duration-150 group-hover:opacity-100 flex items-center justify-center">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E5192B] text-white">
                            <Play className="ml-0.5 h-5 w-5 fill-white" />
                          </span>
                        </div>
                      </button>
                    </div>

                    <div className="mt-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onSelectTitle(title)}
                        className="block w-full truncate text-left text-[13.5px] font-semibold text-white transition-colors hover:text-[#FF2A3B]"
                      >
                        {title.title}
                      </button>
                      <p className="mt-0.5 truncate text-[11px] text-neutral-400">
                        {title.type} · {title.year} · {title.maturity}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
