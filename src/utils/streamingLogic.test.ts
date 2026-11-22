import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterStreamingTitles,
  formatMediaTime,
  getActiveSubtitle,
  getNextEpisode,
  getPreviousEpisode,
  getWatchProgressPercent,
  shouldShowUpNextPrompt,
  upsertWatchProgress,
} from './streamingLogic.ts';
import type { StreamingTitle, WatchProgress } from '../types/streaming.ts';

const sampleSeries: StreamingTitle = {
  id: 'the-witcher',
  title: 'The Witcher',
  type: 'Series',
  year: 2023,
  maturity: '18+',
  rating: 4.8,
  quality: '4K HDR',
  genres: ['Fantasy', 'Action'],
  synopsis: 'Geralt hunts monsters.',
  heroImage: '/img.jpg',
  cardImage: '/img.jpg',
  durationLabel: '2 Seasons',
  durationSeconds: 3000,
  episodes: [
    {
      id: 'w-s1e1',
      season: 1,
      number: 1,
      title: "The End's Beginning",
      durationSeconds: 180,
      durationLabel: '58m',
      synopsis: 'Ep 1',
      thumbnail: '/img.jpg',
      subtitles: [
        { timeSec: 2, en: 'Evil is evil.', pt: 'O mal é o mal.' },
      ],
    },
    {
      id: 'w-s1e2',
      season: 1,
      number: 2,
      title: 'Four Marks',
      durationSeconds: 180,
      durationLabel: '56m',
      synopsis: 'Ep 2',
      thumbnail: '/img.jpg',
      subtitles: [],
    },
  ],
};

const sampleMovie: StreamingTitle = {
  id: 'the-batman',
  title: 'The Batman',
  type: 'Movies',
  year: 2022,
  maturity: '16+',
  rating: 4.9,
  quality: '4K HDR',
  genres: ['Crime', 'Noir'],
  synopsis: 'Gotham detective thriller.',
  heroImage: '/img2.jpg',
  cardImage: '/img2.jpg',
  durationLabel: '2h 56m',
  durationSeconds: 300,
};

test('formatMediaTime formats minutes and hours properly', () => {
  assert.equal(formatMediaTime(65), '01:05');
  assert.equal(formatMediaTime(3661), '1:01:01');
});

test('getNextEpisode and getPreviousEpisode navigate episode sequence safely', () => {
  const next = getNextEpisode(sampleSeries, 'w-s1e1');
  assert.equal(next?.id, 'w-s1e2');
  assert.equal(getNextEpisode(sampleSeries, 'w-s1e2'), null);
  assert.equal(getPreviousEpisode(sampleSeries, 'w-s1e1'), null);
  assert.equal(getPreviousEpisode(sampleSeries, 'w-s1e2')?.id, 'w-s1e1');
});

test('shouldShowUpNextPrompt triggers in final 12 seconds when next episode exists', () => {
  assert.equal(shouldShowUpNextPrompt(160, 180, true), false);
  assert.equal(shouldShowUpNextPrompt(168, 180, true), true);
  assert.equal(shouldShowUpNextPrompt(180, 180, false), false);
});

test('getActiveSubtitle returns localized cue within window and null when off', () => {
  const cues = sampleSeries.episodes![0].subtitles;
  assert.equal(getActiveSubtitle(cues, 4, 'pt'), 'O mal é o mal.');
  assert.equal(getActiveSubtitle(cues, 4, 'en'), 'Evil is evil.');
  assert.equal(getActiveSubtitle(cues, 4, 'off'), null);
  assert.equal(getActiveSubtitle(cues, 20, 'pt'), null);
});

test('getWatchProgressPercent and upsertWatchProgress track watch history cleanly', () => {
  assert.equal(getWatchProgressPercent(90, 180), 50);
  const initial: WatchProgress[] = [
    { titleId: 'the-batman', currentTimeSeconds: 50, durationSeconds: 300, updatedAt: 10 },
  ];
  const updated = upsertWatchProgress(initial, {
    titleId: 'the-witcher',
    episodeId: 'w-s1e1',
    currentTimeSeconds: 120,
    durationSeconds: 180,
    updatedAt: 20,
  });
  assert.equal(updated.length, 2);
  assert.equal(updated[0].titleId, 'the-witcher');
});

test('filterStreamingTitles filters by category, search query, and my list', () => {
  const catalog = [sampleSeries, sampleMovie];
  const onlyMovies = filterStreamingTitles(catalog, {
    query: '',
    typeFilter: 'Movies',
    navSection: 'home',
    myListIds: [],
    watchProgress: [],
    downloadedIds: [],
  });
  assert.deepEqual(onlyMovies.map((t) => t.id), ['the-batman']);

  const myList = filterStreamingTitles(catalog, {
    query: '',
    typeFilter: 'All',
    navSection: 'my-list',
    myListIds: ['the-witcher'],
    watchProgress: [],
    downloadedIds: [],
  });
  assert.deepEqual(myList.map((t) => t.id), ['the-witcher']);
});
