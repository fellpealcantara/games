import type { DownloadItem, Game, StoreFilter } from '../types/store';

export function formatPrice(amount: number): string {
  if (amount <= 0) return 'Free';
  return `$${amount.toFixed(2)}`;
}

export function toggleIdInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function getCircularIndex(current: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return ((current + delta) % length + length) % length;
}

export function getCoverflowOffset(index: number, activeIndex: number, length: number): number {
  if (length <= 0) return 0;
  let diff = index - activeIndex;
  const half = Math.floor(length / 2);
  if (diff > half) diff -= length;
  if (diff < -half) diff += length;
  return diff;
}

export function filterAndSortGames(
  games: Game[],
  searchQuery: string,
  filter: StoreFilter
): Game[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filtered = games.filter((game) => {
    if (filter.category !== 'All') {
      const matchCategory = game.category === filter.category;
      const matchConsole =
        (filter.category === 'PS1' && game.console === 'PS1') ||
        (filter.category === 'Game Boy' &&
          (game.console === 'GBA' || game.console === 'GBC' || game.console === 'GB')) ||
        (filter.category === 'SNES' && game.console === 'SNES') ||
        (filter.category === 'CS 1.6' && game.console === 'CS16');

      if (!matchCategory && !matchConsole) {
        return false;
      }
    }

    if (filter.onlyDiscounts && game.discountPercent <= 0) {
      return false;
    }

    if (filter.maxPrice < 100 && game.price > filter.maxPrice) {
      return false;
    }

    if (normalizedQuery.length > 0) {
      const haystack = [
        game.title,
        game.category,
        game.console ?? '',
        game.developer,
        game.shortTagline,
        ...game.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }
    return true;
  });

  const sorted = [...filtered];
  switch (filter.sortBy) {
    case 'name':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'rating':
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case 'size':
      sorted.sort((a, b) => b.sizeGb - a.sizeGb);
      break;
    case 'discount':
      sorted.sort((a, b) => b.discountPercent - a.discountPercent);
      break;
    case 'price-asc':
      sorted.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      sorted.sort((a, b) => b.price - a.price);
      break;
    case 'featured':
    default:
      break;
  }

  return sorted;
}

export function getDiscountedGames(games: Game[]): Game[] {
  return games.filter((g) => g.discountPercent > 0);
}

export function paginateItems<T>(
  items: T[],
  page: number,
  pageSize: number
): { items: T[]; totalPages: number; currentPage: number } {
  if (items.length === 0 || pageSize <= 0) {
    return { items: [], totalPages: 1, currentPage: 0 };
  }
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));
  const start = currentPage * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalPages,
    currentPage,
  };
}

export function advanceDownloadProgress(
  items: DownloadItem[],
  stepPercent = 5
): DownloadItem[] {
  return items.map((item) => {
    if (item.status !== 'downloading') return item;
    const nextProg = Math.min(100, item.progress + stepPercent);
    return {
      ...item,
      progress: nextProg,
      status: nextProg >= 100 ? 'completed' : 'downloading',
    };
  });
}

export function calculateCartTotals(
  cartIds: string[],
  games: Game[]
): {
  count: number;
  subtotal: number;
  originalTotal: number;
  totalSavings: number;
  discountTotal: number;
  total: number;
  items: Game[];
} {
  const gamesById = new Map(games.map((g) => [g.id, g]));
  const items = cartIds
    .map((id) => gamesById.get(id))
    .filter((g): g is Game => Boolean(g));

  const originalTotal = items.reduce((sum, g) => sum + (g.originalPrice ?? g.price ?? 0), 0);
  const subtotal = items.reduce((sum, g) => sum + (g.price ?? 0), 0);
  const totalSavings = Math.max(0, originalTotal - subtotal);

  return {
    count: items.length,
    subtotal: Number(subtotal.toFixed(2)),
    originalTotal: Number(originalTotal.toFixed(2)),
    totalSavings: Number(totalSavings.toFixed(2)),
    discountTotal: Number(totalSavings.toFixed(2)),
    total: Number(subtotal.toFixed(2)),
    items,
  };
}

export function toggleDownloadPause(
  items: DownloadItem[],
  gameId: string
): DownloadItem[] {
  return items.map((item) => {
    if (item.gameId !== gameId) return item;
    if (item.status === 'downloading') return { ...item, status: 'paused' };
    if (item.status === 'paused') return { ...item, status: 'downloading' };
    return item;
  });
}
