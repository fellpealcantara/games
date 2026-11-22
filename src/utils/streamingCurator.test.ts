import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractCanonicalSeriesName,
  deduplicateSeriesAndAnimes,
  isMarvelWork,
  isDcWork,
  isDragonBallWork,
  isNarutoWork,
  isOnePieceWork,
  buildDynamicHomeSections,
} from './streamingCurator';
import type { StreamingTitle, StreamSection, WatchProgress } from '../types/streaming';

test('extractCanonicalSeriesName removes season and part suffixes cleanly', () => {
  assert.equal(extractCanonicalSeriesName('Stranger Things - Temporada 4'), 'Stranger Things');
  assert.equal(extractCanonicalSeriesName('Arcanjo Renegado - Temporada 5'), 'Arcanjo Renegado');
  assert.equal(extractCanonicalSeriesName('One Piece (Season 24)'), 'One Piece');
  assert.equal(extractCanonicalSeriesName('Loki - Temporada 2'), 'Loki');
  assert.equal(extractCanonicalSeriesName('Deadpool & Wolverine'), 'Deadpool & Wolverine');
});

test('deduplicateSeriesAndAnimes keeps only 1 thumb per series', () => {
  const titles: StreamingTitle[] = [
    {
      id: 'st-1',
      title: 'Stranger Things - Temporada 1',
      type: 'Series',
      year: 2016,
      maturity: '16+',
      rating: 8.7,
      quality: '4K HDR',
      genres: ['Ficção Científica', 'Suspense'],
      synopsis: 'Temp 1',
      heroImage: 'st1.jpg',
      cardImage: 'st1.jpg',
      durationLabel: '1 Temp',
      durationSeconds: 3000,
      isSeries: true,
    },
    {
      id: 'st-4',
      title: 'Stranger Things - Temporada 4',
      type: 'Series',
      year: 2022,
      maturity: '16+',
      rating: 8.7,
      quality: '4K HDR',
      genres: ['Ficção Científica', 'Suspense'],
      synopsis: 'Temp 4',
      heroImage: 'st4.jpg',
      cardImage: 'st4.jpg',
      durationLabel: '4 Temps',
      durationSeconds: 3000,
      isSeries: true,
    },
    {
      id: 'mv-1',
      title: 'Deadpool & Wolverine',
      type: 'Movies',
      year: 2024,
      maturity: '18+',
      rating: 8.1,
      quality: '4K HDR',
      genres: ['Ação', 'Comédia'],
      synopsis: 'Filme',
      heroImage: 'dp.jpg',
      cardImage: 'dp.jpg',
      durationLabel: '2h 07m',
      durationSeconds: 7600,
    },
  ];

  const deduped = deduplicateSeriesAndAnimes(titles);
  assert.equal(deduped.length, 2);
  const titlesList = deduped.map((t) => t.title);
  assert.ok(titlesList.includes('Stranger Things'));
  assert.ok(titlesList.includes('Deadpool & Wolverine'));
});

test('Franchise strict validation filters prevent cross-contamination', () => {
  // Marvel
  assert.equal(isMarvelWork('Deadpool & Wolverine'), true);
  assert.equal(isMarvelWork('Vingadores: Ultimato'), true);
  assert.equal(isMarvelWork('The Batman'), false);

  // DC
  assert.equal(isDcWork('The Batman'), true);
  assert.equal(isDcWork('Pacificador'), true);
  assert.equal(isDcWork('Homem de Ferro'), false);

  // Dragon Ball
  assert.equal(isDragonBallWork('Dragon Ball Super: Broly'), true);
  assert.equal(isDragonBallWork('Naruto Shippuden'), false);

  // Naruto: Must strictly reject "The Last of Us"
  assert.equal(isNarutoWork('Naruto Shippuden'), true);
  assert.equal(isNarutoWork('Boruto: Naruto Next Generations'), true);
  assert.equal(isNarutoWork('The Last of Us'), false);

  // One Piece
  assert.equal(isOnePieceWork('One Piece Film: Red'), true);
  assert.equal(isOnePieceWork('Dragon Ball Daima'), false);
});

test('buildDynamicHomeSections generates correct hierarchy without emojis', () => {
  const sampleCatalog: StreamingTitle[] = [
    {
      id: 't-1',
      title: 'Stranger Things',
      type: 'Series',
      year: 2024,
      maturity: '16+',
      rating: 8.7,
      quality: '4K HDR',
      genres: ['Ficção Científica'],
      synopsis: 'Série',
      heroImage: 'img.jpg',
      cardImage: 'img.jpg',
      durationLabel: '4 Temps',
      durationSeconds: 3000,
    },
    {
      id: 't-2',
      title: 'Deadpool & Wolverine',
      type: 'Movies',
      year: 2024,
      maturity: '18+',
      rating: 8.1,
      quality: '4K HDR',
      genres: ['Ação'],
      synopsis: 'Filme',
      heroImage: 'img.jpg',
      cardImage: 'img.jpg',
      durationLabel: '2h',
      durationSeconds: 7200,
    },
  ];

  const baseSections: StreamSection[] = [
    {
      id: 'sec-lancamentos-2026',
      title: 'Lançamentos 2026',
      category: 'releases',
      items: [sampleCatalog[1]],
    },
  ];

  const watchProgress: WatchProgress[] = [
    {
      titleId: 't-1',
      currentTimeSeconds: 1200,
      durationSeconds: 3000,
      updatedAt: Date.now(),
    },
  ];

  const myListIds = ['t-2'];

  const sections = buildDynamicHomeSections({
    baseSections,
    catalog: sampleCatalog,
    watchProgress,
    myListIds,
    typeFilter: 'All',
  });

  // 1st section should be Continuar Assistindo
  assert.equal(sections[0].title, 'Continuar Assistindo');
  assert.equal(sections[0].category, 'continue');

  // 2nd section should be Minha Lista
  assert.equal(sections[1].title, 'Minha Lista');
  assert.equal(sections[1].category, 'watchlist');

  // Ensure zero emojis in any section title
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
  for (const s of sections) {
    assert.equal(emojiRegex.test(s.title), false, `Section title contains emoji: ${s.title}`);
  }
});
