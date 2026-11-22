const fs = require('fs');
const CryptoJS = require('crypto-js');

const BASE_URL = 'https://filmbr.i2s1n.com';
const IMAGE_CDN = 'https://79b2d.9ljp.com';
const APP_ID = 'filmbr';
const PACKAGE_NAME = 'com.starshort.minishort';
const VERSION = '40000';
const SECRET_KEY = '47Q8tBqO4YqrMHf4';
const DEVICE_ID = '3f9a72b85e2ba4740a36bdd234b08a20';

const AES_KEY = CryptoJS.enc.Utf8.parse('0123456789123456');
const AES_IV = CryptoJS.enc.Utf8.parse('2015030120123456');

// Map of catalog genre tags to Portuguese labels
const CHINESE_TAG_MAP = {
  '动作': 'Ação', '冒险': 'Aventura', '喜剧': 'Comédia',
  '恐怖': 'Terror', '惊悚': 'Suspense', '科幻': 'Ficção Científica',
  '剧情': 'Drama', '爱情': 'Romance', '战争': 'Guerra',
  '犯罪': 'Crime', '奇幻': 'Fantasia', '动画': 'Animação',
  '家庭': 'Família', '音乐': 'Musical', '历史': 'Histórico',
  '纪录片': 'Documentário', '传记': 'Biografia', '西部': 'Faroeste',
  '悬疑': 'Mistério', '武侠': 'Artes Marciais', '古装': 'Período',
  '偶像': 'Romance', '都市': 'Urbano', '青春': 'Jovem',
  '戏曲': 'Musical', '浪漫': 'Romance', '儿童': 'Infantil',
  '情感': 'Drama', '警匪': 'Policial', '神话': 'Mitologia',
  '体育': 'Esporte', '短片': 'Curta', '真人秀': 'Reality Show',
  '综艺': 'Variedades', '恐怖惊悚': 'Terror/Suspense'
};

function translateTags(raw) {
  if (!raw) return [];
  const parts = raw.split(/[,/]/).map(t => t.trim()).filter(Boolean);
  return parts.map(t => CHINESE_TAG_MAP[t] || t).filter(t => !/[\u4e00-\u9fa5]/.test(t));
}

function resolveImageUrl(raw) {
  if (!raw) return `${IMAGE_CDN}/default.jpg`;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    if (raw.includes('.9ljp.com/')) {
      return raw.replace(/https?:\/\/[a-z0-9]+\.9ljp\.com\//i, `${IMAGE_CDN}/`);
    }
    return raw;
  }
  const cleanPath = raw.startsWith('/') ? raw : `/${raw}`;
  return `${IMAGE_CDN}${cleanPath}`;
}

function decryptAes(ciphertext) {
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertext.trim(), AES_KEY, {
      iv: AES_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const str = decrypted.toString(CryptoJS.enc.Utf8);
    return str || ciphertext;
  } catch {
    return ciphertext;
  }
}

async function fetchApi(endpoint, params = {}) {
  const curTime = Date.now().toString();
  const sign = CryptoJS.MD5(SECRET_KEY + DEVICE_ID + curTime).toString().toUpperCase();

  const bodyParams = new URLSearchParams(params);

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': 'okhttp/3.14.9',
      'app_id': APP_ID,
      'package_name': PACKAGE_NAME,
      'version': VERSION,
      'sys_platform': '2',
      'mob_mfr': 'samsung',
      'mobmodel': 'SM-G998B',
      'sysrelease': '13',
      'device_id': DEVICE_ID,
      'cur_time': curTime,
      'sign': sign,
      'channel_code': 'filmbr_1001',
      'androidid': DEVICE_ID,
      'is_vvv': '0',
      'is_language': 'pt',
      'is_display': 'GMT-03:00',
    },
    body: bodyParams.toString(),
  });

  const raw = await res.text();
  let jsonStr = raw;
  if (!raw.startsWith('{')) {
    jsonStr = decryptAes(raw);
  }
  return JSON.parse(jsonStr);
}

function parseVodItem(item, defaultCategory = 'Movies') {
  const id = `stream-${item.vod_id || item.id || item.data_id}`;
  const name = (item.vod_name || item.name || '').trim();
  const pic = resolveImageUrl(item.vod_pic || item.coverUrl);
  const banner = resolveImageUrl(item.banner_pic || item.vod_pic_slide || item.vod_pic);
  const year = parseInt(item.vod_year, 10) || 2026;
  const score = parseFloat(item.vod_douban_score || '8.2');

  const typePid = parseInt(item.type_pid, 10) || parseInt(item.type_id, 10) || 0;
  const hasTemporada = /temporada\s*\d+/i.test(name) || /season\s*\d+/i.test(name);
  const isSeries =
    typePid === 192 || // Series channel
    typePid === 191 || // Animes channel
    typePid === 212 || // Novelas channel
    typePid === 2 ||
    typePid === 4 ||
    hasTemporada ||
    name.toLowerCase().includes('série') ||
    defaultCategory === 'Series' ||
    defaultCategory === 'Animes';

  // 1. If MOVIE:
  if (!isSeries) {
    const tags = translateTags(item.vod_tag || item.tag);
    const genres = tags.length > 0 ? tags.slice(0, 4) : ['Filmes'];
    return {
      id,
      title: name,
      type: 'Movies',
      year,
      maturity: '14+',
      rating: score,
      quality: '4K HDR',
      genres,
      synopsis:
        item.vod_content ||
        item.vod_blurb ||
        `Produção cinematográfica em alta definição. Elenco: ${item.vod_actor || 'Oficial'}. Direção: ${item.vod_director || 'Oficial'}.`,
      heroImage: banner || pic,
      cardImage: pic,
      durationLabel: '2h 10m',
      durationSeconds: 7800,
      isHeroFeatured: false,
      isTrending: true,
      isSeries: false,
      seasonsCount: 1,
      seasons: [],
      episodes: [], // Strictly EMPTY for movies!
    };
  }

  // 2. If SERIES / ANIME:
  const category =
    typePid === 191 || defaultCategory === 'Animes' || name.toLowerCase().includes('anime')
      ? 'Animes'
      : 'Series';

  const tags = translateTags(item.vod_tag || item.tag);
  const genres = tags.length > 0 ? tags.slice(0, 4) : [category];

  // Determine number of seasons from title
  const seasonMatch = name.match(/temporada\s*(\d+)/i) || name.match(/season\s*(\d+)/i);
  const highestSeason = seasonMatch ? parseInt(seasonMatch[1], 10) : (category === 'Animes' ? 1 : 2);
  const numSeasons = Math.max(1, Math.min(highestSeason, 8));

  const rawVodTotal = parseInt(item.vod_total, 10);
  const epsPerSeason = !isNaN(rawVodTotal) && rawVodTotal > 1 ? Math.min(rawVodTotal, 24) : 8;

  const seasons = [];
  const episodes = [];

  for (let s = 1; s <= numSeasons; s++) {
    seasons.push({
      title: `Temporada ${s}`,
      vodId: `${id}-season-${s}`,
      seasonNumber: s,
      isDefault: s === numSeasons,
    });

    const epsCount = s === numSeasons ? epsPerSeason : 8;
    for (let ep = 1; ep <= epsCount; ep++) {
      episodes.push({
        id: `${id}-s${s}-e${ep}`,
        season: s,
        number: ep,
        title: `Episódio ${ep}`,
        durationSeconds: 2700,
        durationLabel: '45m',
        synopsis: `Episódio ${ep} da Temporada ${s} em transmissão oficial Ultra HD 4K HDR.`,
        thumbnail: pic,
        subtitles: [],
      });
    }
  }

  return {
    id,
    title: name,
    type: category,
    year,
    maturity: '14+',
    rating: score,
    quality: '4K HDR',
    genres,
    synopsis:
      item.vod_content ||
      item.vod_blurb ||
      `Série em alta definição. Elenco: ${item.vod_actor || 'Oficial'}. Direção: ${item.vod_director || 'Oficial'}.`,
    heroImage: banner || pic,
    cardImage: pic,
    durationLabel: `${numSeasons} ${numSeasons === 1 ? 'Temporada' : 'Temporadas'} · ${episodes.length} Eps`,
    durationSeconds: 2700,
    isHeroFeatured: false,
    isTrending: true,
    isSeries: true,
    seasonsCount: numSeasons,
    seasons,
    episodes,
  };
}

async function run() {
  console.log('Fetching Channel 193 (Home)...');
  const homeData = await fetchApi('/api/channel/get_info', { channel_id: '193', pn: '1' });

  console.log('Fetching Channel 190 (Filmes)...');
  const moviesData = await fetchApi('/api/channel/get_info', { channel_id: '190', pn: '1' });

  console.log('Fetching Channel 192 (Series)...');
  const seriesData = await fetchApi('/api/channel/get_info', { channel_id: '192', pn: '1' });

  console.log('Fetching Channel 191 (Animes)...');
  const animesData = await fetchApi('/api/channel/get_info', { channel_id: '191', pn: '1' });

  console.log('Fetching Hot Searches...');
  const hotData = await fetchApi('/api/search/hot_search');

  const hotKeywords = [];
  const rawList = hotData.result || hotData.data || [];
  if (Array.isArray(rawList)) {
    rawList.forEach((it) => {
      const kw = typeof it === 'string' ? it : it?.vod_name || it?.name || it?.title || it?.kw;
      if (kw && !hotKeywords.includes(kw.trim())) hotKeywords.push(kw.trim());
    });
  }

  const allTitlesMap = new Map();
  const heroIds = [];
  const homeSections = [];

  // Parse Home (Channel 193)
  for (const mod of homeData.result || []) {
    const modName = (mod.module_name || '').trim();
    if (!modName || modName.toLowerCase() === 'streaming') continue;

    if (modName.toLowerCase() === 'banner') {
      for (const block of mod.block_list || []) {
        if (block.vod_info && block.vod_info.vod_name) {
          const parsed = parseVodItem(block.vod_info, 'Movies');
          if (block.banner_pic) parsed.heroImage = resolveImageUrl(block.banner_pic);
          parsed.isHeroFeatured = true;
          allTitlesMap.set(parsed.id, parsed);
          heroIds.push(parsed.id);
        }
      }
      continue;
    }

    const sectionItems = [];
    for (const block of mod.block_list || []) {
      if (Array.isArray(block.vod_list)) {
        for (const item of block.vod_list) {
          if (!item.vod_name) continue;
          const parsed = parseVodItem(item);
          allTitlesMap.set(parsed.id, parsed);
          sectionItems.push(parsed);
        }
      }
      if (block.vod_info && block.vod_info.vod_name) {
        const parsed = parseVodItem(block.vod_info);
        allTitlesMap.set(parsed.id, parsed);
        sectionItems.push(parsed);
      }
    }

    if (sectionItems.length > 0) {
      homeSections.push({
        id: `sec-${modName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: modName,
        items: sectionItems,
      });
    }
  }

  // Parse Filmes (Channel 190)
  for (const mod of moviesData.result || []) {
    const modName = (mod.module_name || '').trim();
    if (!modName || modName.toLowerCase() === 'banner') continue;
    const sectionItems = [];
    for (const block of mod.block_list || []) {
      if (Array.isArray(block.vod_list)) {
        for (const item of block.vod_list) {
          if (!item.vod_name) continue;
          const parsed = parseVodItem(item, 'Movies');
          if (!allTitlesMap.has(parsed.id)) allTitlesMap.set(parsed.id, parsed);
          sectionItems.push(parsed);
        }
      }
    }
    if (sectionItems.length > 0 && homeSections.length < 18) {
      homeSections.push({
        id: `sec-${modName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: modName,
        items: sectionItems,
      });
    }
  }

  // Parse Series (Channel 192)
  for (const mod of seriesData.result || []) {
    const modName = (mod.module_name || '').trim();
    if (!modName || modName.toLowerCase() === 'banner') continue;
    const sectionItems = [];
    for (const block of mod.block_list || []) {
      if (Array.isArray(block.vod_list)) {
        for (const item of block.vod_list) {
          if (!item.vod_name) continue;
          const parsed = parseVodItem(item, 'Series');
          if (!allTitlesMap.has(parsed.id)) allTitlesMap.set(parsed.id, parsed);
          sectionItems.push(parsed);
        }
      }
    }
    if (sectionItems.length > 0 && homeSections.length < 22) {
      homeSections.push({
        id: `sec-${modName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: modName,
        items: sectionItems,
      });
    }
  }

  // Parse Animes (Channel 191)
  for (const mod of animesData.result || []) {
    const modName = (mod.module_name || '').trim();
    if (!modName || modName.toLowerCase() === 'banner') continue;
    const sectionItems = [];
    for (const block of mod.block_list || []) {
      if (Array.isArray(block.vod_list)) {
        for (const item of block.vod_list) {
          if (!item.vod_name) continue;
          const parsed = parseVodItem(item, 'Animes');
          if (!allTitlesMap.has(parsed.id)) allTitlesMap.set(parsed.id, parsed);
          sectionItems.push(parsed);
        }
      }
    }
    if (sectionItems.length > 0 && homeSections.length < 25) {
      homeSections.push({
        id: `sec-${modName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        title: modName,
        items: sectionItems,
      });
    }
  }

  const allTitlesArray = Array.from(allTitlesMap.values());
  console.log(`Parsed total ${allTitlesArray.length} titles and ${homeSections.length} sections!`);
  console.log(`Hero count: ${heroIds.length}`);
  console.log(`Hot keywords count: ${hotKeywords.length}`);

  // Build TS code
  const code = `import type {
  StreamingSettings,
  StreamingTitle,
  StreamSection,
  WatchProgress,
} from '../types/streaming';

export const HOT_SEARCH_KEYWORDS: string[] = ${JSON.stringify(hotKeywords, null, 2)};

export const HERO_FEATURED_STREAMING_IDS: string[] = ${JSON.stringify(heroIds.slice(0, 5), null, 2)};

export const STREAM_HOME_SECTIONS: StreamSection[] = ${JSON.stringify(homeSections, null, 2)};

export const STREAMING_CATALOG: StreamingTitle[] = ${JSON.stringify(allTitlesArray, null, 2)};

export const INITIAL_WATCH_PROGRESS: WatchProgress[] = [
  {
    titleId: '${heroIds[0] || allTitlesArray[0]?.id || "stream-1"}',
    currentTimeSeconds: 60,
    durationSeconds: 120,
    updatedAt: Date.now() - 3600000,
  },
  {
    titleId: '${allTitlesArray[1]?.id || "stream-2"}',
    currentTimeSeconds: 45,
    durationSeconds: 120,
    updatedAt: Date.now() - 7200000,
  },
  {
    titleId: '${allTitlesArray[2]?.id || "stream-3"}',
    currentTimeSeconds: 85,
    durationSeconds: 120,
    updatedAt: Date.now() - 86400000,
  },
];

export const INITIAL_MY_LIST_IDS: string[] = [
  '${heroIds[0] || allTitlesArray[0]?.id}',
  '${allTitlesArray[1]?.id}',
  '${allTitlesArray[2]?.id}',
];

export const INITIAL_STREAM_DOWNLOAD_IDS: string[] = [
  '${heroIds[0] || allTitlesArray[0]?.id}',
];

export const INITIAL_STREAMING_SETTINGS: StreamingSettings = {
  autoplayNextEpisode: true,
  defaultSubtitles: 'pt',
  preferredQuality: '1080p',
};
`;

  fs.writeFileSync('src/data/streaming.ts', code, 'utf8');
  console.log('Successfully written src/data/streaming.ts!');
}

run().catch(console.error);
