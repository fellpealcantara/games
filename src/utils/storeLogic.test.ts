import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceDownloadProgress,
  calculateCartTotals,
  filterAndSortGames,
  formatPrice,
  getCircularIndex,
  getCoverflowOffset,
  getDiscountedGames,
  paginateItems,
  toggleDownloadPause,
  toggleIdInList,
} from './storeLogic.ts';
import type { DownloadItem, Game, StoreFilter } from '../types/store.ts';

const sampleGames: Game[] = [
  {
    id: 'god-of-war',
    title: 'God of War',
    edition: 'BASIC GAME',
    category: 'Action',
    tags: ['Norse', 'Story'],
    description: 'Journey through the Norse realms.',
    shortTagline: 'Norse action adventure',
    originalPrice: 59.99,
    price: 9.99,
    discountPercent: 75,
    rating: 4.9,
    releaseYear: 2022,
    developer: 'Santa Monica Studio',
    sizeGb: 70,
    accentColor: '#3B82F6',
    trailerDuration: '2:15',
    trailerChapters: ['Intro'],
    minSpecs: { cpu: 'i5', gpu: 'GTX 1060', ram: '8 GB', storage: '70 GB' },
  },
  {
    id: 'cyberpunk-2077',
    title: 'Cyberpunk 2077',
    edition: 'BASIC GAME',
    category: 'RPG',
    tags: ['Sci-Fi', 'Open World'],
    description: 'Open world Night City RPG.',
    shortTagline: 'Futuristic mercenary RPG',
    originalPrice: 29.99,
    price: 14.99,
    discountPercent: 50,
    rating: 4.7,
    releaseYear: 2020,
    developer: 'CD PROJEKT RED',
    sizeGb: 74,
    accentColor: '#FACC15',
    trailerDuration: '2:40',
    trailerChapters: ['Intro'],
    minSpecs: { cpu: 'i7', gpu: 'RTX 2060', ram: '12 GB', storage: '74 GB' },
  },
  {
    id: 'league-of-legends',
    title: 'League of Legends',
    edition: 'PRE-ORDER',
    category: 'MOBA',
    tags: ['5v5', 'Competitive'],
    description: 'Become a legend.',
    shortTagline: '5v5 competitive arena',
    originalPrice: 24.99,
    price: 24.99,
    discountPercent: 0,
    rating: 4.8,
    releaseYear: 2026,
    developer: 'Riot Games',
    sizeGb: 22,
    accentColor: '#10B981',
    trailerDuration: '1:50',
    trailerChapters: ['Intro'],
    minSpecs: { cpu: 'i3', gpu: 'GTX 750', ram: '4 GB', storage: '22 GB' },
  },
];

const defaultFilter: StoreFilter = {
  category: 'All',
  onlyDiscounts: false,
  maxPrice: 100,
  sortBy: 'featured',
};

test('formatPrice formats currency and free items', () => {
  assert.equal(formatPrice(9.99), '$9.99');
  assert.equal(formatPrice(0), 'Free');
});

test('toggleIdInList adds and removes IDs cleanly', () => {
  assert.deepEqual(toggleIdInList(['a', 'b'], 'c'), ['a', 'b', 'c']);
  assert.deepEqual(toggleIdInList(['a', 'b'], 'a'), ['b']);
});

test('coverflow indexing wraps circularly across 5 slides', () => {
  assert.equal(getCircularIndex(0, -1, 5), 4);
  assert.equal(getCircularIndex(4, 1, 5), 0);
  assert.equal(getCoverflowOffset(4, 0, 5), -1);
  assert.equal(getCoverflowOffset(0, 4, 5), 1);
  assert.equal(getCoverflowOffset(2, 0, 5), 2);
});

test('filterAndSortGames filters by query, category, discounts, and sorts by price', () => {
  const queryHit = filterAndSortGames(sampleGames, 'norse', defaultFilter);
  assert.equal(queryHit.length, 1);
  assert.equal(queryHit[0].id, 'god-of-war');

  const discounted = filterAndSortGames(sampleGames, '', {
    ...defaultFilter,
    onlyDiscounts: true,
    sortBy: 'price-asc',
  });
  assert.deepEqual(
    discounted.map((g) => g.id),
    ['god-of-war', 'cyberpunk-2077']
  );
});

test('getDiscountedGames and paginateItems slice pages safely', () => {
  const discounted = getDiscountedGames(sampleGames);
  assert.equal(discounted.length, 2);
  const page = paginateItems(sampleGames, 1, 2);
  assert.equal(page.totalPages, 2);
  assert.equal(page.currentPage, 1);
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].id, 'league-of-legends');
});

test('calculateCartTotals computes subtotal and savings accurately', () => {
  const totals = calculateCartTotals(['god-of-war', 'cyberpunk-2077'], sampleGames);
  assert.equal(totals.count, 2);
  assert.equal(totals.subtotal, 24.98);
  assert.equal(totals.originalTotal, 89.98);
  assert.equal(totals.totalSavings, 65.0);
});

test('download progress advances and pause toggles cleanly', () => {
  const initial: DownloadItem[] = [
    { gameId: 'cyberpunk-2077', progress: 98, status: 'downloading', speedMbps: 64.2, totalGb: 74 },
  ];
  const paused = toggleDownloadPause(initial, 'cyberpunk-2077');
  assert.equal(paused[0].status, 'paused');
  assert.equal(advanceDownloadProgress(paused, 5)[0].progress, 98);

  const resumed = toggleDownloadPause(paused, 'cyberpunk-2077');
  assert.equal(resumed[0].status, 'downloading');
  const completed = advanceDownloadProgress(resumed, 5);
  assert.equal(completed[0].progress, 100);
  assert.equal(completed[0].status, 'completed');
});
