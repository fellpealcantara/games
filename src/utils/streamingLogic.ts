import type {
  Episode,
  StreamingNavSection,
  StreamingTitle,
  StreamingTypeFilter,
  SubtitleCue,
  SubtitleLang,
  WatchProgress,
} from '../types/streaming';

export function formatMediaTime(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function getWatchProgressPercent(currentTime: number, duration: number): number {
  if (duration <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((currentTime / duration) * 100)));
}

export function getNextEpisode(
  title: StreamingTitle,
  currentEpisodeId?: string
): Episode | null {
  if (!title.episodes || title.episodes.length === 0 || !currentEpisodeId) {
    return null;
  }
  const idx = title.episodes.findIndex((ep) => ep.id === currentEpisodeId);
  if (idx === -1 || idx >= title.episodes.length - 1) {
    return null;
  }
  return title.episodes[idx + 1];
}

export function getPreviousEpisode(
  title: StreamingTitle,
  currentEpisodeId?: string
): Episode | null {
  if (!title.episodes || title.episodes.length === 0 || !currentEpisodeId) {
    return null;
  }
  const idx = title.episodes.findIndex((ep) => ep.id === currentEpisodeId);
  if (idx <= 0) {
    return null;
  }
  return title.episodes[idx - 1];
}

/**
 * Displays Netflix-style "Up Next" card during the final 12 seconds (or at end) when a next episode exists.
 */
export function shouldShowUpNextPrompt(
  currentTimeSeconds: number,
  durationSeconds: number,
  hasNextEpisode: boolean
): boolean {
  if (!hasNextEpisode || durationSeconds <= 0) return false;
  const remaining = durationSeconds - currentTimeSeconds;
  return remaining <= 12;
}

export function getActiveSubtitle(
  cues: SubtitleCue[] | undefined,
  currentTimeSeconds: number,
  lang: SubtitleLang
): string | null {
  if (lang === 'off' || !cues || cues.length === 0) return null;
  let active: SubtitleCue | null = null;
  for (const cue of cues) {
    if (cue.timeSec <= currentTimeSeconds && currentTimeSeconds - cue.timeSec <= 8) {
      active = cue;
    }
  }
  if (!active) return null;
  return lang === 'pt' ? active.pt : active.en;
}

export function upsertWatchProgress(
  list: WatchProgress[],
  next: WatchProgress
): WatchProgress[] {
  const filtered = list.filter((item) => item.titleId !== next.titleId);
  return [next, ...filtered].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function filterStreamingTitles(
  titles: StreamingTitle[],
  params: {
    query: string;
    typeFilter: StreamingTypeFilter;
    navSection: StreamingNavSection;
    myListIds: string[];
    watchProgress: WatchProgress[];
    downloadedIds: string[];
  }
): StreamingTitle[] {
  const q = params.query.trim().toLowerCase();

  let base = titles;

  if (params.navSection === 'coming-soon') {
    base = titles.filter((t) => t.isComingSoon);
  } else if (params.navSection === 'my-list') {
    base = titles.filter((t) => params.myListIds.includes(t.id));
  } else if (params.navSection === 'downloads') {
    base = titles.filter((t) => params.downloadedIds.includes(t.id));
  } else if (params.navSection === 'recent') {
    const progressOrder = new Map(
      params.watchProgress.map((p, idx) => [p.titleId, idx])
    );
    base = titles
      .filter((t) => progressOrder.has(t.id))
      .sort(
        (a, b) =>
          (progressOrder.get(a.id) ?? 999) - (progressOrder.get(b.id) ?? 999)
      );
  } else {
    base = titles.filter((t) => !t.isComingSoon);
  }

  return base.filter((title) => {
    if (params.typeFilter !== 'All' && title.type !== params.typeFilter) {
      return false;
    }
    if (q.length > 0) {
      const hay = [title.title, title.type, title.synopsis, ...title.genres]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
