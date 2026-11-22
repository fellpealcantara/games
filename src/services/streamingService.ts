import CryptoJS from 'crypto-js';
import type { Episode, StreamingCategory, StreamingTitle } from '../types/streaming';

// Official streaming endpoints & protocols
const API_BASE_URL = 'https://filmbr.i2s1n.com';
export const OFFICIAL_IMAGE_CDN = 'https://79b2d.9ljp.com';

const APP_CLIENT_ID = 'filmbr';
const PACKAGE_IDENTIFIER = 'com.starshort.minishort';
const CLIENT_VERSION = '40000';
const SECRET_SIGN_KEY = '47Q8tBqO4YqrMHf4';
const AES_KEY_STRING = '0123456789123456';
const AES_IV_STRING = '2015030120123456';
const CLIENT_DEVICE_ID = '3f9a72b85e2ba4740a36bdd234b08a20';

const AES_KEY = CryptoJS.enc.Utf8.parse(AES_KEY_STRING);
const AES_IV = CryptoJS.enc.Utf8.parse(AES_IV_STRING);

// Stream Engine Constants (AES-256-GCM)
const STREAM_ENGINE_BASE = 'https://vidrock.net';
const STREAM_DECRYPT_KEY = new Uint8Array([
  0x7f, 0x3e, 0x9c, 0x2a,
  0x8b, 0x5d, 0x1f, 0x4e,
  0x6a, 0x9c, 0x3b, 0x7d,
  0x2e, 0x5f, 0x8a, 0x1c,
  0x4b, 0x6d, 0x9e, 0x2f,
  0x5a, 0x8c, 0x1b, 0x4d,
  0x7e, 0x9f, 0x2a, 0x5c,
  0x8b, 0x1d, 0x4e, 0x7f,
]);

let activeSessionToken: string = '';

export interface StreamingAudioOption {
  type: number;
  typeName: string;
}

export interface StreamingSeasonInfo {
  title: string;
  vodId: string;
  seasonNumber: number;
  isDefault?: boolean;
}

function buildHeaderSignature(deviceId: string, curTime: string): string {
  return CryptoJS.MD5(SECRET_SIGN_KEY + deviceId + curTime).toString().toUpperCase();
}

function decryptPayload(ciphertextBase64: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(ciphertextBase64.trim(), AES_KEY, {
      iv: AES_IV,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const str = decrypted.toString(CryptoJS.enc.Utf8);
    return str || ciphertextBase64;
  } catch {
    return ciphertextBase64;
  }
}

function parseServerResponse(rawText: string): any {
  try {
    return JSON.parse(rawText);
  } catch {
    try {
      const decrypted = decryptPayload(rawText);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }
}

/**
 * Resolves media artwork to the official CDN domain.
 */
export function resolveMediaImageUrl(raw: string | undefined): string {
  if (!raw) return `${OFFICIAL_IMAGE_CDN}/default.jpg`;
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    if (raw.includes('.9ljp.com/')) {
      return raw.replace(/https?:\/\/[a-z0-9]+\.9ljp\.com\//i, `${OFFICIAL_IMAGE_CDN}/`);
    }
    return raw;
  }
  const cleanPath = raw.startsWith('/') ? raw : `/${raw}`;
  return `${OFFICIAL_IMAGE_CDN}${cleanPath}`;
}

/**
 * Decrypts stream payload using Web Crypto API (AES-256-GCM).
 */
export async function decryptStreamPayload(payload: string): Promise<string | null> {
  try {
    const clean = payload.trim().replace(/-/g, '+').replace(/_/g, '/');
    const pad = clean.length % 4;
    const padded = pad > 0 ? clean + '='.repeat(4 - pad) : clean;
    const binStr = atob(padded);
    const bytes = new Uint8Array(binStr.length);
    for (let i = 0; i < binStr.length; i++) bytes[i] = binStr.charCodeAt(i);
    if (bytes.length < 28) return null;

    const nonce = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12, bytes.length - 16);
    const authTag = bytes.slice(bytes.length - 16);

    const cipherWithTag = new Uint8Array(ciphertext.length + authTag.length);
    cipherWithTag.set(ciphertext, 0);
    cipherWithTag.set(authTag, ciphertext.length);

    const key = await window.crypto.subtle.importKey(
      'raw',
      STREAM_DECRYPT_KEY,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce, tagLength: 128 },
      key,
      cipherWithTag
    );
    const url = new TextDecoder().decode(decryptedBuffer).trim();
    return url.startsWith('http://') || url.startsWith('https://') ? url : null;
  } catch {
    return null;
  }
}

/**
 * Resolves direct HLS (.m3u8) or MP4 stream for a movie or TV show episode.
 */
export async function resolveStreamViaEngine(
  mediaId: number,
  isTv: boolean,
  season: number = 1,
  episode: number = 1
): Promise<string | null> {
  if (!mediaId || mediaId <= 0) return null;

  const apiUrl = isTv
    ? `${STREAM_ENGINE_BASE}/api/tv/${mediaId}/${season}/${episode}`
    : `${STREAM_ENGINE_BASE}/api/movie/${mediaId}`;

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const candidateUrls: string[] = [];

    const priorityKeys = ['Atlas', 'Astra', 'Orion', 'Nova', 'Luna', 'Lyra', 'Solara'];
    for (const key of priorityKeys) {
      const sourceObj = data[key];
      if (sourceObj && typeof sourceObj.url === 'string') {
        const dec = await decryptStreamPayload(sourceObj.url);
        if (dec) candidateUrls.push(dec);
      }
    }

    for (const key of Object.keys(data)) {
      if (!priorityKeys.includes(key)) {
        const sourceObj = data[key];
        if (sourceObj && typeof sourceObj.url === 'string') {
          const dec = await decryptStreamPayload(sourceObj.url);
          if (dec) candidateUrls.push(dec);
        }
      }
    }

    const chosen = candidateUrls.find((u) => u.includes('.m3u8')) || candidateUrls[0] || null;
    return chosen;
  } catch {
    return null;
  }
}

/**
 * Initializes session token with streaming backend.
 */
export async function initStreamingSession(): Promise<string> {
  if (activeSessionToken) return activeSessionToken;
  try {
    const curTime = Date.now().toString();
    const sign = buildHeaderSignature(CLIENT_DEVICE_ID, curTime);

    const res = await fetch(`${API_BASE_URL}/api/public/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'okhttp/3.14.9',
        'app_id': APP_CLIENT_ID,
        'package_name': PACKAGE_IDENTIFIER,
        'version': CLIENT_VERSION,
        'sys_platform': '2',
        'mob_mfr': 'samsung',
        'mobmodel': 'SM-G998B',
        'sysrelease': '13',
        'device_id': CLIENT_DEVICE_ID,
        'cur_time': curTime,
        'sign': sign,
        'channel_code': 'filmbr_1001',
        'androidid': CLIENT_DEVICE_ID,
        'is_vvv': '0',
        'is_language': 'pt',
        'is_display': 'GMT-03:00',
      },
      body: 'is_install=0',
    });

    if (res.ok) {
      const rawText = await res.text();
      const data = parseServerResponse(rawText);
      const token = data?.result?.user_info?.token || data?.result?.token || '';
      if (token) {
        activeSessionToken = token;
        return token;
      }
    }
  } catch (e) {
    console.error('Session error:', e);
  }
  return '';
}

/**
 * Searches the live streaming catalog (exact process as requested).
 */
export async function searchStreamingCatalog(query: string): Promise<StreamingTitle[]> {
  if (!query || query.trim().length === 0) return [];
  const token = await initStreamingSession();
  try {
    const curTime = Date.now().toString();
    const sign = buildHeaderSignature(CLIENT_DEVICE_ID, curTime);

    const bodyParams = new URLSearchParams({
      keyword: query.trim(),
      kw: query.trim(),
      pn: '1',
    });
    if (token) bodyParams.append('token', token);

    const res = await fetch(`${API_BASE_URL}/api/search/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'okhttp/3.14.9',
        'app_id': APP_CLIENT_ID,
        'package_name': PACKAGE_IDENTIFIER,
        'version': CLIENT_VERSION,
        'sys_platform': '2',
        'mob_mfr': 'samsung',
        'mobmodel': 'SM-G998B',
        'sysrelease': '13',
        'device_id': CLIENT_DEVICE_ID,
        'cur_time': curTime,
        'sign': sign,
        'channel_code': 'filmbr_1001',
        'androidid': CLIENT_DEVICE_ID,
        'is_vvv': '0',
        'is_language': 'pt',
        'is_display': 'GMT-03:00',
      },
      body: bodyParams.toString(),
    });

    if (res.ok) {
      const rawText = await res.text();
      const data = parseServerResponse(rawText) || {};
      const list = data.result || data.data?.list || [];
      if (Array.isArray(list)) {
        return list.map((item: any) => {
          const isSeries = item.type_pid === 192 || (item.vod_total && item.vod_total > 1);
          const title = item.vod_name || item.name || 'Título sem nome';
          const pic = resolveMediaImageUrl(item.vod_pic || item.pic);
          const year = parseInt(item.vod_year, 10) || 2026;
          const rating = parseFloat(item.vod_douban_score || '8.5');
          const id = `stream-${item.id || item.vod_id}`;

          return {
            id,
            title,
            type: isSeries ? 'Series' : 'Movies',
            year,
            maturity: '14+',
            rating,
            quality: '4K HDR',
            genres: [isSeries ? 'Series' : 'Movies'],
            synopsis:
              item.vod_blurb ||
              item.vod_content ||
              `Direção: ${item.vod_director || 'Oficial'}. Elenco: ${item.vod_actor || 'Oficial'}.`,
            heroImage: pic,
            cardImage: pic,
            durationLabel: isSeries ? `${item.vod_total || 10} Eps` : '2h 00m',
            durationSeconds: 7200,
            isSeries,
            seasonsCount: isSeries ? (item.vod_total || 1) : 1,
            seasons: isSeries
              ? [
                  {
                    title: 'Temporada 1',
                    vodId: String(item.id || item.vod_id),
                    seasonNumber: 1,
                    isDefault: true,
                  },
                ]
              : [],
            episodes: isSeries
              ? Array.from({ length: Math.min(item.vod_total || 8, 24) }, (_, i) => ({
                  id: `${id}-s1-e${i + 1}`,
                  season: 1,
                  number: i + 1,
                  title: `Episódio ${i + 1}`,
                  durationSeconds: 2700,
                  durationLabel: '45m',
                  synopsis: `Episódio ${i + 1} em qualidade 4K HDR.`,
                  thumbnail: pic,
                  subtitles: [],
                }))
              : [],
          };
        });
      }
    }
  } catch (e) {
    console.error('Search error:', e);
  }
  return [];
}

/**
 * Loads sections from streaming channels (193=Home, 190=Filmes, 192=Series, 191=Animes).
 */
export async function getStreamingChannelTitles(channelId: number = 193): Promise<StreamingTitle[]> {
  const token = await initStreamingSession();
  try {
    const curTime = Date.now().toString();
    const sign = buildHeaderSignature(CLIENT_DEVICE_ID, curTime);

    const bodyParams = new URLSearchParams({
      channel_id: String(channelId),
      pn: '1',
    });
    if (token) bodyParams.append('token', token);

    const res = await fetch(`${API_BASE_URL}/api/channel/get_info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'okhttp/3.14.9',
        'app_id': APP_CLIENT_ID,
        'package_name': PACKAGE_IDENTIFIER,
        'version': CLIENT_VERSION,
        'sys_platform': '2',
        'mob_mfr': 'samsung',
        'mobmodel': 'SM-G998B',
        'sysrelease': '13',
        'device_id': CLIENT_DEVICE_ID,
        'cur_time': curTime,
        'sign': sign,
        'channel_code': 'filmbr_1001',
        'androidid': CLIENT_DEVICE_ID,
        'is_vvv': '0',
        'is_language': 'pt',
        'is_display': 'GMT-03:00',
      },
      body: bodyParams.toString(),
    });

    if (res.ok) {
      const rawText = await res.text();
      const data = parseServerResponse(rawText) || {};
      const modules = data.result || [];
      const titles: StreamingTitle[] = [];

      if (Array.isArray(modules)) {
        for (const mod of modules) {
          const blocks = mod.block_list || [];
          for (const b of blocks) {
            const info = b.vod_info;
            if (!info || !info.vod_name) continue;

            const isSeries =
              channelId === 192 ||
              channelId === 191 ||
              (info.vod_total && info.vod_total > 1) ||
              info.vod_name.toLowerCase().includes('temporada');

            const category: StreamingCategory =
              channelId === 191
                ? 'Animes'
                : isSeries
                  ? 'Series'
                  : 'Movies';

            const id = `stream-${info.id || b.data_id || b.id}`;
            const pic = resolveMediaImageUrl(info.vod_pic || b.banner_pic);
            const banner = resolveMediaImageUrl(b.banner_pic || info.vod_pic_slide || info.vod_pic);
            const year = parseInt(info.vod_year, 10) || 2026;
            const score = parseFloat(info.vod_douban_score || '8.5');
            const totalEps = info.vod_total || (isSeries ? 8 : 1);

            titles.push({
              id,
              title: info.vod_name,
              type: category,
              year,
              maturity: '14+',
              rating: score,
              quality: '4K HDR',
              genres: info.vod_tag ? info.vod_tag.split(',').slice(0, 3) : [category],
              synopsis:
                info.vod_content ||
                info.vod_blurb ||
                `Com ${info.vod_actor || 'Elenco Oficial'}. Direção de ${info.vod_director || 'Oficial'}.`,
              heroImage: banner,
              cardImage: pic,
              durationLabel: isSeries ? `${totalEps} Eps` : '2h 10m',
              durationSeconds: 7200,
              isHeroFeatured: mod.module_name === 'banner',
              isTrending: true,
              seasonsCount: isSeries ? Math.max(1, Math.min(totalEps, 10)) : 1,
              isSeries,
              seasons: isSeries
                ? [
                    {
                      title: 'Temporada 1',
                      vodId: String(info.id || b.data_id || b.id),
                      seasonNumber: 1,
                      isDefault: true,
                    },
                  ]
                : [],
              episodes: isSeries
                ? Array.from({ length: Math.min(totalEps, 24) }, (_, i) => ({
                    id: `${id}-s1-e${i + 1}`,
                    season: 1,
                    number: i + 1,
                    title: `Episódio ${i + 1}`,
                    durationSeconds: 2700,
                    durationLabel: '45m',
                    synopsis: `Episódio ${i + 1} em qualidade 4K HDR.`,
                    thumbnail: pic,
                    subtitles: [],
                  }))
                : [],
            });
          }
        }
      }

      return titles;
    }
  } catch (e) {
    console.error('Channel error:', e);
  }
  return [];
}
