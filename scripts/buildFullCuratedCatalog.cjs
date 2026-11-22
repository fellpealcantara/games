const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

const BASE_URL = 'https://filmbr.i2s1n.com';
const SECRET_KEY = '47Q8tBqO4YqrMHf4';
const APP_ID = 'filmbr';
const PACKAGE_NAME = 'com.starshort.minishort';
const VERSION = '40000';
const DEVICE_ID = '3f9a72b85e2ba4740a36bdd234b08a20';

const AES_KEY = CryptoJS.enc.Utf8.parse('0123456789123456');
const AES_IV = CryptoJS.enc.Utf8.parse('2015030120123456');

function buildSign(deviceId, curTime) {
  return CryptoJS.MD5(SECRET_KEY + deviceId + curTime).toString().toUpperCase();
}

function decryptAes(ciphertextBase64) {
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertextBase64.trim(), AES_KEY, {
      iv: AES_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return ciphertextBase64;
  }
}

async function searchLive(query) {
  const curTime = Date.now().toString();
  const sign = buildSign(DEVICE_ID, curTime);
  const formData = new URLSearchParams({ kw: query, keyword: query, pn: '1' });

  try {
    const res = await fetch(`${BASE_URL}/api/search/result`, {
      method: 'POST',
      headers: {
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
        'is_vvv': '0',
        'is_language': 'pt',
        'is_display': 'GMT-03:00',
        'channel_code': 'filmbr_1001',
        'androidid': DEVICE_ID,
        'User-Agent': 'okhttp/3.14.9',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData.toString()
    });

    const raw = await res.text();
    let json;
    try { json = JSON.parse(raw); } catch {
      try { json = JSON.parse(decryptAes(raw)); } catch { json = null; }
    }
    return (json && (json.result || json.data)) || [];
  } catch (e) {
    return [];
  }
}

// ── Canonical Series Name Extraction ──
function extractCanonicalSeriesName(rawTitle) {
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

// ── Validation Filters ──
function isMarvelWork(name) {
  const low = name.toLowerCase();
  const kws = [
    'marvel', 'vingadores', 'avengers', 'capitão américa', 'captain america', 'homem de ferro', 'iron man',
    'thor', 'hulk', 'viúva negra', 'black widow', 'gavião arqueiro', 'hawkeye', 'pantera negra', 'black panther',
    'homem-formiga', 'ant-man', 'guardiões da galáxia', 'guardians of the galaxy', 'doutor estranho', 'doctor strange',
    'homem-aranha', 'spider-man', 'spiderman', 'deadpool', 'wolverine', 'loki', 'wandavision', 'what if',
    'falcão e o soldado', 'shang-chi', 'eternos', 'eternals', 'cavaleiro da lua', 'moon knight',
    'mulher-hulk', 'she-hulk', 'invasão secreta', 'secret invasion', 'as marvels', 'the marvels', 'eco', 'agatha'
  ];
  return kws.some(k => low.includes(k));
}

function isDcWork(name) {
  const low = name.toLowerCase();
  const kws = [
    'dc', 'batman', 'superman', 'mulher-maravilha', 'wonder woman', 'liga da justiça', 'justice league',
    'aquaman', 'the flash', 'flash', 'shazam', 'esquadrão suicida', 'suicide squad', 'pacificador', 'peacemaker',
    'adão negro', 'black adam', 'besouro azul', 'blue beetle', 'coringa', 'joker', 'pinguim', 'penguin',
    'aves de rapina', 'birds of prey', 'homem de aço'
  ];
  return kws.some(k => low.includes(k));
}

function isDragonBallWork(name) {
  const low = name.toLowerCase();
  return low.includes('dragon ball') || low.includes('dragonball');
}

function isNarutoWork(name) {
  const low = name.toLowerCase();
  if (low.includes('last of us')) return false;
  return low.includes('naruto') || low.includes('boruto');
}

function isOnePieceWork(name) {
  const low = name.toLowerCase();
  return low.includes('one piece') || low.includes('onepiece');
}

function matchesSearchQuery(titleName, query) {
  const cleanTitle = extractCanonicalSeriesName(titleName).trim().toLowerCase();
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return false;
  if (cleanTitle === cleanQuery) return true;
  if (cleanTitle.startsWith(cleanQuery + ' ') || cleanTitle.startsWith(cleanQuery + ':') || cleanTitle.startsWith(cleanQuery + ' -')) return true;
  return cleanTitle.includes(cleanQuery);
}

// ── Raw to StreamingTitle Parser ──
function parseRawTitle(raw, originPlatform = '') {
  const id = `stream-${raw.vod_id}`;
  const rawName = (raw.vod_name || 'Sem Título').trim();
  const canonicalTitle = extractCanonicalSeriesName(rawName);
  const isSeries = Boolean(
    raw.type_id === 2 ||
    raw.type_id === 192 ||
    raw.type_id === 191 ||
    /temporada|season|episódio|temp\s*\d/i.test(rawName)
  );

  let category = 'Movies';
  if (raw.type_id === 191 || /anime/i.test(raw.vod_class || '')) {
    category = 'Animes';
  } else if (isSeries) {
    category = 'Series';
  }

  const rawPic = raw.vod_pic || raw.banner_pic || '';
  const imgUrl = rawPic.startsWith('http')
    ? rawPic
    : `https://79b2d.9ljp.com/${rawPic.replace(/^\//, '')}`;

  const rating = parseFloat(raw.vod_douban_score) || 7.5;
  const year = parseInt(raw.vod_year) || 2024;
  const genres = (raw.vod_class ? raw.vod_class.split(/[,/ ]+/).filter(Boolean) : [category]);

  return {
    id,
    title: canonicalTitle,
    type: category,
    year,
    maturity: '14+',
    rating,
    quality: '4K HDR',
    genres: genres.length > 0 ? genres : ['Ação'],
    synopsis: raw.vod_content || raw.vod_blurb || `${canonicalTitle} disponível em alta definição.`,
    heroImage: imgUrl,
    cardImage: imgUrl,
    durationLabel: isSeries ? 'Série · Múltiplas Temporadas' : 'Filme · 1h 55m',
    durationSeconds: isSeries ? 3200 : 6900,
    isSeries,
    streamUrl: raw.vod_play_url || '',
    originPlatform: originPlatform || undefined
  };
}

// ── Deduplicate ──
function deduplicateTitles(titles) {
  const map = new Map();
  for (const t of titles) {
    const key = `${t.type}_${t.title.toLowerCase().trim()}`;
    if (!map.has(key)) {
      map.set(key, t);
    }
  }
  return Array.from(map.values());
}

async function run() {
  console.log('Loading existing streaming catalog...');
  const dataPath = path.resolve(__dirname, '../src/data/streaming.ts');
  const fileContent = fs.readFileSync(dataPath, 'utf8');

  // Existing titles
  const start = fileContent.indexOf('export const STREAMING_CATALOG: StreamingTitle[] = ');
  const relevant = fileContent.slice(start);
  const end = relevant.indexOf('export const INITIAL_WATCH_PROGRESS');
  const arrayStr = relevant.slice('export const STREAMING_CATALOG: StreamingTitle[] = '.length, end).trim().replace(/;$/, '');
  const existingCatalog = JSON.parse(arrayStr);

  const existingMap = new Map();
  for (const t of existingCatalog) {
    existingMap.set(t.id, t);
    existingMap.set(t.title.toLowerCase().trim(), t);
  }

  console.log(`Current catalog size: ${existingCatalog.length} items`);

  // Target Searches
  const MARVEL_CHRONOLOGICAL = [
    "Capitão América: O Primeiro Vingador", "Capitã Marvel", "Homem de Ferro", "Homem de Ferro 2",
    "O Incrível Hulk", "Thor", "Os Vingadores", "Homem de Ferro 3", "Thor: O Mundo Sombrio",
    "Capitão América: O Soldado Invernal", "Guardiões da Galáxia", "Guardiões da Galáxia Vol. 2",
    "Vingadores: Era de Ultron", "Homem-Formiga", "Capitão América: Guerra Civil", "Viúva Negra",
    "Pantera Negra", "Homem-Aranha: De Volta ao Lar", "Doutor Estranho", "Thor: Ragnarok",
    "Homem-Formiga e a Vespa", "Vingadores: Guerra Infinita", "Vingadores: Ultimato", "Loki",
    "What If", "WandaVision", "Falcão e o Soldado Invernal", "Homem-Aranha: Longe de Casa",
    "Shang-Chi", "Eternos", "Homem-Aranha: Sem Volta", "Doutor Estranho no Multiverso da Loucura",
    "Gavião Arqueiro", "Cavaleiro da Lua", "Thor: Amor e Trovão", "Mulher-Hulk", "Pantera Negra: Wakanda",
    "Invasão Secreta", "Guardiões da Galáxia Vol. 3", "As Marvels", "Eco", "Deadpool & Wolverine", "Agatha Desde Sempre"
  ];

  const DC_CHRONOLOGICAL = [
    "Mulher-Maravilha", "Mulher-Maravilha 1984", "Homem de Aço", "Batman v Superman",
    "Esquadrão Suicida", "Liga da Justiça", "Aquaman", "Shazam", "Aves de Rapina",
    "O Esquadrão Suicida", "Pacificador", "Adão Negro", "Shazam! Fúria dos Deuses",
    "The Flash", "Besouro Azul", "Aquaman 2", "The Batman", "Pinguim", "Coringa", "Coringa: Delírio a Dois"
  ];

  const DRAGONBALL_CHRONOLOGICAL = [
    "Dragon Ball", "Dragon Ball Z", "Dragon Ball Z: A Batalha dos Deuses",
    "Dragon Ball Super", "Dragon Ball Super: Broly", "Dragon Ball Super: Super Hero",
    "Dragon Ball Daima", "Dragon Ball GT"
  ];

  const NARUTO_CHRONOLOGICAL = [
    "Naruto", "Naruto Shippuden", "The Last Naruto: O Filme",
    "Boruto: Naruto - O Filme", "Boruto: Naruto Next Generations"
  ];

  const ONEPIECE_CHRONOLOGICAL = [
    "One Piece", "One Piece Film: Strong World", "One Piece Film: Z",
    "One Piece Film: Gold", "One Piece: Stampede", "One Piece Film: Red"
  ];

  const PLATFORMS = {
    "Netflix Originais": ["Stranger Things", "Wandinha", "Round 6", "The Witcher", "Dark", "Black Mirror", "La Casa de Papel", "Cobra Kai", "Arcane", "One Piece", "Bridgerton", "Sandman", "Gambito da Rainha", "Rebel Moon", "O Irlandês", "Resgate", "Sex Education"],
    "Apple TV+ Originais": ["Ruptura", "Severance", "Ted Lasso", "Silo", "Fundação", "Para Toda a Humanidade", "The Morning Show", "Black Bird", "Slow Horses", "Matéria Escura", "Mestres do Ar", "Napoleão", "Assassinos da Lua das Flores"],
    "HBO Max Originais": ["A Casa do Dragão", "House of the Dragon", "The Last of Us", "Game of Thrones", "Euphoria", "Succession", "Chernobyl", "Pinguim", "Pacificador", "True Detective", "White Lotus"],
    "Paramount+ Originais": ["Yellowstone", "Halo", "Tulsa King", "1923", "1883", "Mayor of Kingstown", "Star Trek Strange New Worlds", "Knuckles", "Operação Lioness"],
    "Disney+ Originais": ["The Mandalorian", "Loki", "WandaVision", "Percy Jackson", "Ahsoka", "Andor", "O Urso", "Shogun", "Cavaleiro da Lua"],
    "Prime Video Originais": ["The Boys", "Os Anéis de Poder", "Fallout", "Invencível", "Reacher", "A Roda do Tempo", "Jack Ryan"]
  };

  const newCatalog = [...existingCatalog];

  async function queryAndCollect(searchTerms, filterFn, origin = '') {
    const collected = [];
    for (const term of searchTerms) {
      const q = term.split(':')[0].split('-')[0].trim();
      const results = await searchLive(q);
      for (const r of results) {
        if (!filterFn(r.vod_name)) continue;
        const parsed = parseRawTitle(r, origin);
        if (!matchesSearchQuery(parsed.title, q) && !matchesSearchQuery(r.vod_name, q)) continue;
        
        // Add to collected
        collected.push(parsed);
        // Add to newCatalog if unique
        if (!existingMap.has(parsed.id) && !existingMap.has(parsed.title.toLowerCase().trim())) {
          existingMap.set(parsed.id, parsed);
          existingMap.set(parsed.title.toLowerCase().trim(), parsed);
          newCatalog.push(parsed);
        }
      }
    }
    return deduplicateTitles(collected);
  }

  console.log('Fetching Marvel canonical titles...');
  const marvelItems = await queryAndCollect(MARVEL_CHRONOLOGICAL, isMarvelWork);
  console.log(`Marvel: ${marvelItems.length} titles`);

  console.log('Fetching DC canonical titles...');
  const dcItems = await queryAndCollect(DC_CHRONOLOGICAL, isDcWork);
  console.log(`DC: ${dcItems.length} titles`);

  console.log('Fetching Dragon Ball titles...');
  const dbItems = await queryAndCollect(DRAGONBALL_CHRONOLOGICAL, isDragonBallWork);
  console.log(`Dragon Ball: ${dbItems.length} titles`);

  console.log('Fetching Naruto titles...');
  const narutoItems = await queryAndCollect(NARUTO_CHRONOLOGICAL, isNarutoWork);
  console.log(`Naruto: ${narutoItems.length} titles`);

  console.log('Fetching One Piece titles...');
  const opItems = await queryAndCollect(ONEPIECE_CHRONOLOGICAL, isOnePieceWork);
  console.log(`One Piece: ${opItems.length} titles`);

  const platformSections = [];
  for (const [platformName, terms] of Object.entries(PLATFORMS)) {
    console.log(`Fetching ${platformName}...`);
    const pItems = await queryAndCollect(terms, () => true, platformName);
    console.log(`${platformName}: ${pItems.length} titles`);
    platformSections.push({
      id: `sec-${platformName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      title: platformName,
      subtitle: `Obras originais aclamadas de ${platformName.replace(' Originais', '')}`,
      category: 'streaming',
      isAiRecommended: true,
      aiReason: `Produções e obras exclusivas da plataforma ${platformName.replace(' Originais', '')}.`,
      items: pItems
    });
  }

  // Lançamentos 2026
  console.log('Fetching Lançamentos 2026...');
  const releasesRaw = await searchLive('2026');
  const releasesItems = deduplicateTitles(releasesRaw.map(r => parseRawTitle(r)));
  for (const r of releasesItems) {
    if (!existingMap.has(r.id) && !existingMap.has(r.title.toLowerCase().trim())) {
      existingMap.set(r.id, r);
      existingMap.set(r.title.toLowerCase().trim(), r);
      newCatalog.push(r);
    }
  }
  console.log(`Lançamentos 2026: ${releasesItems.length} titles`);

  // Obras Aclamadas (Top Ratings)
  const acclaimedItems = deduplicateTitles(
    newCatalog.filter(t => t.rating >= 8.0).slice(0, 24)
  );

  // Build Full Curated Sections in exact Flixfy hierarchy
  const finalSections = [
    {
      id: 'sec-lancamentos-2026',
      title: 'Lançamentos 2026',
      subtitle: 'Filmes, séries e animes lançados e em alta no ano de 2026',
      category: 'releases',
      isAiRecommended: true,
      aiReason: 'Todos os filmes, séries e animes lançados e em alta no ano de 2026.',
      items: releasesItems.length > 0 ? releasesItems : newCatalog.filter(t => t.year >= 2025).slice(0, 18)
    },
    {
      id: 'sec-recomendados-para-voce',
      title: 'Recomendados para Você',
      subtitle: 'Com base no catálogo e nas suas preferências de streaming',
      category: 'ai',
      isAiRecommended: true,
      aiReason: 'Com base nas suas preferências e gêneros favoritos.',
      items: newCatalog.slice(0, 18)
    },
    {
      id: 'sec-obras-aclamadas',
      title: 'Obras Aclamadas',
      subtitle: 'Produções com as maiores avaliações e aclamação da crítica',
      category: 'ai',
      isAiRecommended: true,
      aiReason: 'Obras com pontuação superior a 8.0 aclamadas pelo público.',
      items: acclaimedItems
    },
    {
      id: 'sec-universo-marvel',
      title: 'Universo Marvel (MCU)',
      subtitle: 'Ordem cronológica canônica completa de todos os filmes e séries',
      category: 'universe',
      isAiRecommended: true,
      aiReason: 'Ordem cronológica canônica completa de todos os filmes, séries e animações do MCU.',
      items: marvelItems
    },
    {
      id: 'sec-universo-dc',
      title: 'Universo DC',
      subtitle: 'Ordem cronológica do Universo DC com filmes e séries integradas',
      category: 'universe',
      isAiRecommended: true,
      aiReason: 'Ordem cronológica do Universo DC com filmes, séries e animações integradas.',
      items: dcItems
    },
    {
      id: 'sec-universo-dragonball',
      title: 'Universo Dragon Ball',
      subtitle: 'Ordem cronológica completa dos animes, especiais e filmes canônicos',
      category: 'universe',
      isAiRecommended: true,
      aiReason: 'Ordem cronológica completa dos animes, especiais e filmes canônicos de Dragon Ball.',
      items: dbItems
    },
    {
      id: 'sec-universo-naruto',
      title: 'Universo Naruto',
      subtitle: 'Ordem canônica da saga ninja de Naruto Clássico a Boruto',
      category: 'universe',
      isAiRecommended: true,
      aiReason: 'Ordem canônica da saga ninja de Naruto a Boruto.',
      items: narutoItems
    },
    {
      id: 'sec-universo-onepiece',
      title: 'Universo One Piece',
      subtitle: 'Ordem das sagas canônicas, filmes principais e série live-action',
      category: 'universe',
      isAiRecommended: true,
      aiReason: 'Ordem das sagas canônicas, filmes principais e série live-action de One Piece.',
      items: opItems
    },
    ...platformSections,
    {
      id: 'sec-mais-vistos',
      title: 'Mais Vistos da Semana',
      subtitle: 'Títulos mais assistidos pelos espectadores nesta semana',
      category: 'standard',
      isAiRecommended: false,
      items: newCatalog.slice(18, 36)
    },
    {
      id: 'sec-populares-da-semana',
      title: 'Populares da Semana',
      subtitle: 'Grandes sucessos do cinema e das séries em alta',
      category: 'standard',
      isAiRecommended: false,
      items: newCatalog.slice(36, 54)
    },
    {
      id: 'sec-novidades-por-categoria',
      title: 'Novidades por Categoria',
      subtitle: 'Novos títulos e produções recém adicionadas ao catálogo',
      category: 'standard',
      isAiRecommended: false,
      items: newCatalog.slice(54, 72)
    }
  ];

  console.log(`Total new catalog size: ${newCatalog.length} items`);
  console.log(`Total curated sections: ${finalSections.length} sections`);

  // Write to src/data/streaming.ts cleanly
  const sectionsJson = JSON.stringify(finalSections, null, 2);
  const catalogJson = JSON.stringify(newCatalog, null, 2);

  // Preserve initial settings and watchlist from file
  const watchProgressStart = fileContent.indexOf('export const INITIAL_WATCH_PROGRESS');
  const footerContent = fileContent.slice(watchProgressStart);

  const newFileContent = `import type {
  StreamingSettings,
  StreamingTitle,
  StreamSection,
  WatchProgress,
} from '../types/streaming';

export const HOT_SEARCH_KEYWORDS: string[] = [
  "Deadpool & Wolverine",
  "Stranger Things",
  "Vingadores",
  "The Boys",
  "Batman",
  "One Piece",
  "Yellowstone",
  "Ruptura",
  "Dragon Ball",
  "Naruto",
  "A Casa do Dragão",
  "The Last of Us",
  "Percy Jackson",
  "Arcanjo Renegado"
];

export const HERO_FEATURED_STREAMING_IDS: string[] = [
  "${newCatalog[0]?.id || 'stream-1644785443'}",
  "${marvelItems[0]?.id || 'stream-38571508'}",
  "${platformSections[0]?.items[0]?.id || 'stream-276623528'}",
  "${dcItems[0]?.id || 'stream-1337351760'}",
  "${releasesItems[0]?.id || 'stream-1687961294'}"
];

export const STREAM_HOME_SECTIONS: StreamSection[] = ${sectionsJson};

export const STREAMING_CATALOG: StreamingTitle[] = ${catalogJson};

${footerContent}`;

  fs.writeFileSync(dataPath, newFileContent, 'utf8');
  console.log('Successfully written updated streaming.ts with full curated sections and expanded catalog!');
}

run().catch(console.error);
