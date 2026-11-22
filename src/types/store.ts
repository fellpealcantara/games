export type NavSection = 'home' | 'categories' | 'library';

export type RetroConsole = 'PS1' | 'SNES' | 'GBA' | 'GBC' | 'GB' | 'CS16';

export type GameCategory =
  | 'All'
  | 'PS1'
  | 'Game Boy'
  | 'SNES'
  | 'CS 1.6'
  | 'Action'
  | 'RPG'
  | 'Open World'
  | 'MOBA'
  | 'Adventure'
  | 'Shooter';

export type SortOption =
  | 'featured'
  | 'name'
  | 'rating'
  | 'size'
  | 'discount'
  | 'price-asc'
  | 'price-desc';

export type GameEditionLabel =
  | 'BASIC GAME'
  | 'ORIGINAL CD'
  | 'REMASTER'
  | 'WEB EDITION'
  | 'PRE-ORDER';

export interface Game {
  id: string;
  title: string;
  console?: RetroConsole;
  romFilename?: string;
  romUrl?: string;
  driveDownloadUrl?: string;
  libretroBoxartUrl?: string;
  emulatorCore?: 'psx' | 'mgba' | 'snes' | 'cs16';
  displayLogo?: {
    topLine: string;
    bottomLine?: string;
    style: 'epic' | 'cyber' | 'brutalist' | 'fantasy' | 'western' | 'horizon';
  };
  edition: GameEditionLabel;
  category: Exclude<GameCategory, 'All'>;
  tags: string[];
  description: string;
  shortTagline: string;
  originalPrice: number;
  price: number;
  discountPercent: number;
  rating: number;
  releaseYear: number;
  developer: string;
  sizeGb: number;
  coverImage?: string;
  accentColor: string;
  isHeroFeatured?: boolean;
  isPreOrder?: boolean;
  isDiscountSpotlight?: boolean;
  trailerDuration: string;
  trailerChapters: string[];
  minSpecs: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
  };
}

export interface DownloadItem {
  gameId: string;
  progress: number;
  status: 'downloading' | 'paused' | 'queued' | 'completed';
  speedMbps: number;
  totalGb: number;
}

export interface StoreFilter {
  category: GameCategory;
  onlyDiscounts: boolean;
  maxPrice: number;
  sortBy: SortOption;
}

export interface UserProfile {
  username: string;
  email?: string;
  statusText: string;
  level: number;
  avatarImage: string;
  hoursPlayed: number;
  achievementsUnlocked: number;
  memberSince: string;
}

export interface PlaySession {
  gameId: string;
  startedAt: number;
  elapsedSeconds: number;
}
