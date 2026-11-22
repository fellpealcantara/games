export type AppMode = 'games' | 'streaming';

export type StreamingNavSection =
  | 'home'
  | 'discover'
  | 'coming-soon'
  | 'my-list'
  | 'recent'
  | 'downloads';

export type StreamingCategory = 'Movies' | 'TV-Shows' | 'Series' | 'Animes';

export type StreamingTypeFilter = 'All' | StreamingCategory;

export type SubtitleLang = 'pt' | 'en' | 'off';

export interface SubtitleCue {
  timeSec: number;
  en: string;
  pt: string;
}

export interface StreamingAudioOption {
  type: number;
  typeName: string;
}

export interface StreamingSeason {
  title: string;
  vodId: string;
  seasonNumber: number;
  isDefault?: boolean;
}

export interface Episode {
  id: string;
  season: number;
  number: number;
  title: string;
  durationSeconds: number;
  durationLabel: string;
  synopsis: string;
  thumbnail: string;
  subtitles: SubtitleCue[];
  streamUrl?: string;
  downUrl?: string;
  isP2p?: boolean;
  audioType?: number;
}

export interface StreamingTitle {
  id: string;
  title: string;
  type: StreamingCategory;
  year: number;
  maturity: string;
  rating: number;
  quality: '4K HDR' | 'Full HD';
  genres: string[];
  synopsis: string;
  heroImage: string;
  cardImage: string;
  durationLabel: string;
  durationSeconds: number;
  isHeroFeatured?: boolean;
  isTrending?: boolean;
  isComingSoon?: boolean;
  releaseNote?: string;
  seasonsCount?: number;
  episodes?: Episode[];
  movieSubtitles?: SubtitleCue[];
  streamUrl?: string;
  audioOptions?: StreamingAudioOption[];
  seasons?: StreamingSeason[];
  isSeries?: boolean;
  tmdbId?: number;
  originPlatform?: string;
  chronologicalOrder?: number;
}

export interface WatchProgress {
  titleId: string;
  episodeId?: string;
  currentTimeSeconds: number;
  durationSeconds: number;
  updatedAt: number;
}

export interface StreamingSettings {
  autoplayNextEpisode: boolean;
  defaultSubtitles: SubtitleLang;
  preferredQuality: '4K HDR' | '1080p' | 'Auto';
}

export interface StreamSection {
  id: string;
  title: string;
  subtitle?: string;
  category?: 'continue' | 'watchlist' | 'releases' | 'ai' | 'universe' | 'streaming' | 'standard';
  isAiRecommended?: boolean;
  aiReason?: string;
  items: StreamingTitle[];
}

