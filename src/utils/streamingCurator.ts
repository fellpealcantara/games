import type {
  StreamingCategory,
  StreamingTitle,
  StreamSection,
  StreamingTypeFilter,
  WatchProgress,
} from '../types/streaming';

/**
 * Normalizes title by stripping season/part suffixes to achieve 1 thumb per work.
 */
export function extractCanonicalSeriesName(rawTitle: string): string {
  let clean = rawTitle.trim();
  const seasonRegexes = [
    /\s*[-:]\s*(?:temporada|season|temp|t|part|parte)\s*\d+.*/i,
    /\s*\((?:temporada|season|temp|t|part|parte)\s*\d+.*\)/i,
    /\s*[-:]?\s*\d+[ºª°]?\s*(?:temporada|season|temp).*/i,
    /\s*[-:]\s*s\d{1,2}.*/i,
  ];
  for (const reg of seasonRegexes) {
    const replaced = clean.replace(reg, '').trim();
    if (replaced.length >= 2) {
      clean = replaced;
    }
  }
  return clean;
}

/**
 * Deduplicates series and animes so each franchise has only 1 primary poster.
 */
export function deduplicateSeriesAndAnimes(titles: StreamingTitle[]): StreamingTitle[] {
  const seenBaseNames = new Map<string, StreamingTitle>();
  const result: StreamingTitle[] = [];

  for (const title of titles) {
    const isSeriesOrAnime =
      title.type === 'Series' ||
      title.type === 'TV-Shows' ||
      title.type === 'Animes' ||
      Boolean(title.isSeries) ||
      /\b(temporada|season|temp)\b/i.test(title.title);

    if (!isSeriesOrAnime) {
      const key = `movie_${title.title.trim().toLowerCase()}`;
      if (!seenBaseNames.has(key)) {
        seenBaseNames.set(key, title);
        result.push(title);
      }
      continue;
    }

    const baseName = extractCanonicalSeriesName(title.title).toLowerCase();
    const key = `series_${baseName}`;

    if (!seenBaseNames.has(key)) {
      const cleanDisplayName = extractCanonicalSeriesName(title.title);
      const unifiedTitle: StreamingTitle = {
        ...title,
        title: cleanDisplayName.length >= 2 ? cleanDisplayName : title.title,
      };
      seenBaseNames.set(key, unifiedTitle);
      result.push(unifiedTitle);
    }
  }

  return result;
}

// ── Strict Franchise Anti-Contamination Filters ──

export function isMarvelWork(name: string): boolean {
  const low = name.toLowerCase();
  const kws = [
    'marvel', 'vingadores', 'avengers', 'capitão américa', 'captain america', 'homem de ferro', 'iron man',
    'thor', 'hulk', 'viúva negra', 'black widow', 'gavião arqueiro', 'hawkeye', 'pantera negra', 'black panther',
    'homem-formiga', 'ant-man', 'guardiões da galáxia', 'guardians of the galaxy', 'doutor estranho', 'doctor strange',
    'homem-aranha', 'spider-man', 'spiderman', 'deadpool', 'wolverine', 'loki', 'wandavision', 'what if',
    'falcão e o soldado', 'shang-chi', 'eternos', 'eternals', 'cavaleiro da lua', 'moon knight',
    'mulher-hulk', 'she-hulk', 'invasão secreta', 'secret invasion', 'as marvels', 'the marvels', 'eco', 'agatha'
  ];
  return kws.some((k) => low.includes(k));
}

export function isDcWork(name: string): boolean {
  const low = name.toLowerCase();
  const kws = [
    'dc', 'batman', 'superman', 'mulher-maravilha', 'wonder woman', 'liga da justiça', 'justice league',
    'aquaman', 'the flash', 'flash', 'shazam', 'esquadrão suicida', 'suicide squad', 'pacificador', 'peacemaker',
    'adão negro', 'black adam', 'besouro azul', 'blue beetle', 'coringa', 'joker', 'pinguim', 'penguin',
    'aves de rapina', 'birds of prey', 'homem de aço'
  ];
  return kws.some((k) => low.includes(k));
}

export function isDragonBallWork(name: string): boolean {
  const low = name.toLowerCase();
  return low.includes('dragon ball') || low.includes('dragonball');
}

export function isNarutoWork(name: string): boolean {
  const low = name.toLowerCase();
  if (low.includes('last of us')) return false;
  return low.includes('naruto') || low.includes('boruto');
}

export function isOnePieceWork(name: string): boolean {
  const low = name.toLowerCase();
  return low.includes('one piece') || low.includes('onepiece');
}

export function matchesSearchQuery(titleName: string, query: string): boolean {
  const cleanTitle = extractCanonicalSeriesName(titleName).trim().toLowerCase();
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return false;
  if (cleanTitle === cleanQuery) return true;
  if (
    cleanTitle.startsWith(cleanQuery + ' ') ||
    cleanTitle.startsWith(cleanQuery + ':') ||
    cleanTitle.startsWith(cleanQuery + ' -')
  ) {
    return true;
  }
  return cleanTitle.includes(cleanQuery);
}

// ── User Preference Analysis & Intelligent Curation ──

export interface UserStreamingProfileAnalysis {
  topType: StreamingCategory;
  topGenres: string[];
  favoriteKeywords: string[];
  lastWatchedTitle: StreamingTitle | null;
  lastSavedTitle: StreamingTitle | null;
}

export function analyzeStreamingPreferences(
  catalog: StreamingTitle[],
  watchProgress: WatchProgress[],
  myListIds: string[]
): UserStreamingProfileAnalysis {
  const titleMap = new Map(catalog.map((t) => [t.id, t]));

  const watchedTitles = watchProgress
    .map((p) => titleMap.get(p.titleId))
    .filter((t): t is StreamingTitle => Boolean(t));

  const savedTitles = myListIds
    .map((id) => titleMap.get(id))
    .filter((t): t is StreamingTitle => Boolean(t));

  const typeCounts: Record<StreamingCategory, number> = {
    Movies: 0,
    Series: 0,
    'TV-Shows': 0,
    Animes: 0,
  };

  const genreCounts: Record<string, number> = {};

  for (const t of watchedTitles) {
    typeCounts[t.type] = (typeCounts[t.type] || 0) + 3;
    for (const g of t.genres) {
      genreCounts[g] = (genreCounts[g] || 0) + 3;
    }
  }

  for (const t of savedTitles) {
    typeCounts[t.type] = (typeCounts[t.type] || 0) + 2;
    for (const g of t.genres) {
      genreCounts[g] = (genreCounts[g] || 0) + 2;
    }
  }

  let topType: StreamingCategory = 'Movies';
  let maxTypeCount = -1;
  for (const [type, count] of Object.entries(typeCounts) as [StreamingCategory, number][]) {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      topType = type;
    }
  }

  const sortedGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g);

  const topGenres = sortedGenres.length > 0 ? sortedGenres.slice(0, 4) : ['Ação', 'Ficção Científica', 'Drama'];

  const allRelevantNames = [
    ...watchedTitles.slice(0, 4).map((t) => extractCanonicalSeriesName(t.title)),
    ...savedTitles.slice(0, 4).map((t) => extractCanonicalSeriesName(t.title)),
  ];

  const favoriteKeywords = Array.from(new Set(allRelevantNames)).filter((k) => k.length >= 3);

  return {
    topType,
    topGenres,
    favoriteKeywords,
    lastWatchedTitle: watchedTitles[0] ?? null,
    lastSavedTitle: savedTitles[0] ?? null,
  };
}

/**
 * Builds the complete hierarchy of curated sections:
 * 1. Continuar Assistindo (when watch progress exists)
 * 2. Minha Lista (when list is non-empty)
 * 3. Lançamentos 2026
 * 4. Inteligência: Recomendados para Você
 * 5. Porque você salvou [Título] (if watchlist exists)
 * 6. Porque você assistiu [Título] (if watch history exists)
 * 7. Obras Aclamadas
 * 8. Universos Canônicos (Marvel, DC, Dragon Ball, Naruto, One Piece)
 * 9. Originais por Plataforma (Netflix, Apple TV+, HBO Max, Paramount+, Disney+, Prime Video)
 * 10. Catálogo Temático (Mais Vistos, Populares, Novidades)
 */
export function buildDynamicHomeSections(params: {
  baseSections: StreamSection[];
  catalog: StreamingTitle[];
  watchProgress: WatchProgress[];
  myListIds: string[];
  typeFilter: StreamingTypeFilter;
}): StreamSection[] {
  const { baseSections, catalog, watchProgress, myListIds, typeFilter } = params;
  const titleMap = new Map(catalog.map((t) => [t.id, t]));

  const sections: StreamSection[] = [];

  // ── 1. Continuar Assistindo ──
  if (watchProgress.length > 0) {
    const continueItems = watchProgress
      .map((p) => titleMap.get(p.titleId))
      .filter((t): t is StreamingTitle => Boolean(t));

    const dedupedContinue = deduplicateSeriesAndAnimes(continueItems);
    if (dedupedContinue.length > 0) {
      sections.push({
        id: 'sec-continuar-assistindo',
        title: 'Continuar Assistindo',
        subtitle: 'Retome de onde você parou',
        category: 'continue',
        items: dedupedContinue,
      });
    }
  }

  // ── 2. Minha Lista ──
  if (myListIds.length > 0) {
    const listItems = myListIds
      .map((id) => titleMap.get(id))
      .filter((t): t is StreamingTitle => Boolean(t));

    const dedupedList = deduplicateSeriesAndAnimes(listItems);
    if (dedupedList.length > 0) {
      sections.push({
        id: 'sec-minha-lista',
        title: 'Minha Lista',
        subtitle: 'Títulos salvos por você para assistir mais tarde',
        category: 'watchlist',
        items: dedupedList,
      });
    }
  }

  // ── 3. Análise de Perfil e Recomendações Dinâmicas ──
  const profile = analyzeStreamingPreferences(catalog, watchProgress, myListIds);

  // Seção: Porque você salvou [Título]
  if (profile.lastSavedTitle) {
    const savedName = profile.lastSavedTitle.title;
    const relatedToSaved = catalog
      .filter(
        (t) =>
          t.id !== profile.lastSavedTitle?.id &&
          (t.genres.some((g) => profile.lastSavedTitle?.genres.includes(g)) ||
            t.type === profile.lastSavedTitle?.type)
      )
      .slice(0, 16);

    if (relatedToSaved.length >= 4) {
      sections.push({
        id: 'sec-porque-voce-salvou',
        title: `Porque você salvou ${savedName}`,
        subtitle: `Títulos semelhantes a ${savedName} da sua lista`,
        category: 'ai',
        isAiRecommended: true,
        aiReason: `Títulos recomendados com base na sua escolha de ${savedName}.`,
        items: deduplicateSeriesAndAnimes(relatedToSaved),
      });
    }
  }

  // Seção: Porque você assistiu [Título]
  if (profile.lastWatchedTitle) {
    const watchedName = profile.lastWatchedTitle.title;
    const relatedToWatched = catalog
      .filter(
        (t) =>
          t.id !== profile.lastWatchedTitle?.id &&
          (t.genres.some((g) => profile.lastWatchedTitle?.genres.includes(g)) ||
            t.type === profile.lastWatchedTitle?.type)
      )
      .slice(0, 16);

    if (relatedToWatched.length >= 4) {
      sections.push({
        id: 'sec-porque-voce-assistiu',
        title: `Porque você assistiu ${watchedName}`,
        subtitle: `Títulos com estilo semelhante a ${watchedName}`,
        category: 'ai',
        isAiRecommended: true,
        aiReason: `Baseado no seu histórico recente de reprodução de ${watchedName}.`,
        items: deduplicateSeriesAndAnimes(relatedToWatched),
      });
    }
  }

  // ── 4. Seções Curadas Estáticas / de Catálogo (Lançamentos 2026, Universos, Streamings e Catálogo Temático) ──
  for (const sec of baseSections) {
    if (sec.id === 'sec-continuar-assistindo' || sec.id === 'sec-minha-lista') {
      continue;
    }

    const dedupedItems = deduplicateSeriesAndAnimes(sec.items);
    if (dedupedItems.length > 0) {
      sections.push({
        ...sec,
        items: dedupedItems,
      });
    }
  }

  // ── 5. Filtragem por Categoria (quando ativada pelo topo) ──
  if (typeFilter === 'All') {
    return sections;
  }

  return sections
    .map((sec) => {
      const filtered = sec.items.filter((item) => {
        if (typeFilter === 'Movies') return item.type === 'Movies';
        if (typeFilter === 'Series') return item.type === 'Series' || item.type === 'TV-Shows';
        if (typeFilter === 'TV-Shows') return item.type === 'TV-Shows' || item.type === 'Series';
        if (typeFilter === 'Animes') return item.type === 'Animes';
        return true;
      });
      return {
        ...sec,
        items: filtered,
      };
    })
    .filter((sec) => sec.items.length > 0);
}
