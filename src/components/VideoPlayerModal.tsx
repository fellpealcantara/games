import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Gauge,
  ListVideo,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  SkipForward,
  Subtitles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type {
  StreamingSettings,
  StreamingTitle,
  SubtitleLang,
} from '../types/streaming';
import {
  formatMediaTime,
  getActiveSubtitle,
  getNextEpisode,
  shouldShowUpNextPrompt,
} from '../utils/streamingLogic';
import { resolveStreamViaEngine } from '../services/streamingService';

interface VideoPlayerModalProps {
  title: StreamingTitle | null;
  episodeId?: string;
  initialTimeSeconds?: number;
  settings: StreamingSettings;
  onClose: () => void;
  onSelectEpisode: (episodeId: string) => void;
  onProgressUpdate: (
    titleId: string,
    episodeId: string | undefined,
    currentTimeSeconds: number,
    durationSeconds: number
  ) => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2] as const;
const UP_NEXT_AUTOPLAY_SECONDS = 8;

const RELIABLE_BACKUP_STREAMS: string[] = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
];

export function VideoPlayerModal({
  title,
  episodeId,
  initialTimeSeconds = 0,
  settings,
  onClose,
  onSelectEpisode,
  onProgressUpdate,
}: VideoPlayerModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const isSeries = Boolean(title?.isSeries);

  const seasons = useMemo(() => {
    if (!title || !isSeries) return [];
    if (title.seasons && title.seasons.length > 0) {
      return title.seasons.map((s) => s.seasonNumber);
    }
    if (title.episodes && title.episodes.length > 0) {
      const set = Array.from(new Set(title.episodes.map((e) => e.season))).sort((a, b) => a - b);
      return set.length > 0 ? set : [1];
    }
    const count = title.seasonsCount && title.seasonsCount > 0 ? title.seasonsCount : 1;
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [title, isSeries]);

  const activeEpisode = useMemo(() => {
    if (!isSeries || !title?.episodes || title.episodes.length === 0) return undefined;
    if (episodeId) {
      return title.episodes.find((ep) => ep.id === episodeId) ?? title.episodes[0];
    }
    return title.episodes[0];
  }, [title, episodeId, isSeries]);

  const nextEpisode = useMemo(() => {
    if (!title || !isSeries || !activeEpisode) return null;
    return getNextEpisode(title, activeEpisode.id);
  }, [title, isSeries, activeEpisode]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(85);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [subtitleLang, setSubtitleLang] = useState<SubtitleLang>(settings.defaultSubtitles);
  const [episodesOpen, setEpisodesOpen] = useState(false);
  const [drawerSeason, setDrawerSeason] = useState<number>(activeEpisode?.season ?? 1);
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false);
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  const [audioMenuOpen, setAudioMenuOpen] = useState(false);
  const [selectedAudio, setSelectedAudio] = useState<'dublado' | 'legendado'>('dublado');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [dismissedUpNextFor, setDismissedUpNextFor] = useState<string | null>(null);
  const [upNextCountdown, setUpNextCountdown] = useState<number>(UP_NEXT_AUTOPLAY_SECONDS);
  const [isLoadingStream, setIsLoadingStream] = useState(true);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [activeStreamUrl, setActiveStreamUrl] = useState<string>('');

  const currentTimeRef = useRef(currentTime);
  currentTimeRef.current = currentTime;
  const hideControlsTimerRef = useRef<number | null>(null);

  // Sync default subtitle preference if changed in settings
  useEffect(() => {
    setSubtitleLang(settings.defaultSubtitles);
  }, [settings.defaultSubtitles]);

  const syncProgress = useCallback(
    (timeSec: number) => {
      if (!title) return;
      const totalDur = duration > 0 ? duration : (activeEpisode?.durationSeconds ?? title.durationSeconds ?? 7200);
      onProgressUpdate(title.id, activeEpisode?.id, timeSec, totalDur);
    },
    [title, activeEpisode, duration, onProgressUpdate]
  );

  // Resolves stream URL for active item
  useEffect(() => {
    if (!title) return;

    let isCancelled = false;
    setIsLoadingStream(true);
    setStreamError(null);

    async function loadStream() {
      const candidate = activeEpisode?.streamUrl || title?.streamUrl;
      if (candidate && !activeEpisode?.isP2p) {
        if (!isCancelled) {
          setActiveStreamUrl(candidate);
          setIsLoadingStream(false);
        }
        return;
      }

      try {
        const isTv = Boolean(title?.isSeries || (title?.episodes && title.episodes.length > 1));
        const seasonNum = activeEpisode?.season ?? 1;
        const episodeNum = activeEpisode?.number ?? 1;

        const mediaId = title?.tmdbId || 550;
        const titleIdStr = title?.id || 'default';
        const seed = Math.abs(titleIdStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
        const guaranteedBackup = RELIABLE_BACKUP_STREAMS[seed % RELIABLE_BACKUP_STREAMS.length];

        // 2.5s timeout race to prevent slow 15s freeze
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
        const resolved = await Promise.race([
          resolveStreamViaEngine(mediaId, isTv, seasonNum, episodeNum),
          timeoutPromise,
        ]);

        if (!isCancelled) {
          if (resolved && !resolved.includes('vercetti.org')) {
            setActiveStreamUrl(resolved);
          } else if (candidate && candidate.startsWith('http')) {
            setActiveStreamUrl(candidate);
          } else {
            setActiveStreamUrl(guaranteedBackup);
          }
          setIsLoadingStream(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Stream load error:', err);
          const titleIdStr = title?.id || 'default';
          const seed = Math.abs(titleIdStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
          const guaranteedBackup = RELIABLE_BACKUP_STREAMS[seed % RELIABLE_BACKUP_STREAMS.length];
          setActiveStreamUrl(guaranteedBackup);
          setIsLoadingStream(false);
        }
      }
    }

    loadStream();

    return () => {
      isCancelled = true;
    };
  }, [title, activeEpisode]);

  // Attach activeStreamUrl to video tag via hls.js or native HTML5 video with auto-fallback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeStreamUrl) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    let isFallbackApplied = false;
    let networkRetryCount = 0;
    let fallbackTimeout: number | null = null;

    const switchToFallback = () => {
      if (isFallbackApplied || !video) return;
      isFallbackApplied = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      const titleIdStr = title?.id || 'default';
      const seed = Math.abs(titleIdStr.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0));
      const backup = RELIABLE_BACKUP_STREAMS[seed % RELIABLE_BACKUP_STREAMS.length];
      video.src = backup;
      video.load();
      if (initialTimeSeconds > 0) {
        video.currentTime = initialTimeSeconds;
      }
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoadingStream(false);
          setStreamError(null);
        })
        .catch(() => {
          setIsLoadingStream(false);
        });
    };

    // Watchdog: If video has not loaded metadata within 4.5 seconds, auto-switch to fallback
    fallbackTimeout = window.setTimeout(() => {
      if (video.readyState < 2 && !isFallbackApplied) {
        console.warn('Transmissão primária demorou para responder. Conectando servidor reserva...');
        switchToFallback();
      }
    }, 4500);

    const isHls = activeStreamUrl.includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        fragLoadingTimeOut: 4000,
        manifestLoadingTimeOut: 4000,
      });
      hlsRef.current = hls;

      hls.loadSource(activeStreamUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setIsLoadingStream(false);
        setStreamError(null);
        if (initialTimeSeconds > 0 && video) {
          video.currentTime = initialTimeSeconds;
        }
        video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
            networkRetryCount += 1;
            if (networkRetryCount <= 1) {
              hls.startLoad();
            } else {
              switchToFallback();
            }
          } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
            hls.recoverMediaError();
          } else {
            switchToFallback();
          }
        }
      });
    } else {
      video.src = activeStreamUrl;
      if (initialTimeSeconds > 0) {
        video.currentTime = initialTimeSeconds;
      }
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setIsLoadingStream(false);
        })
        .catch(() => {
          setIsPlaying(false);
        });
    }

    const handleVideoError = () => {
      if (!isFallbackApplied) {
        switchToFallback();
      }
    };

    video.addEventListener('error', handleVideoError);

    return () => {
      if (fallbackTimeout) window.clearTimeout(fallbackTimeout);
      video.removeEventListener('error', handleVideoError);
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [activeStreamUrl, initialTimeSeconds, title?.id]);

  // Video HTML5 event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      if (nextEpisode && settings.autoplayNextEpisode) {
        handlePlayNextEpisode();
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  });

  // Keep volume & playback rate synced to video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
      videoRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Periodic watch progress persistence every 3 seconds while playing
  useEffect(() => {
    if (!title || !isPlaying) return;
    const saver = window.setInterval(() => {
      syncProgress(currentTimeRef.current);
    }, 3000);
    return () => window.clearInterval(saver);
  }, [title, isPlaying, syncProgress]);

  const upNextVisible = Boolean(
    title &&
      nextEpisode &&
      duration > 0 &&
      shouldShowUpNextPrompt(currentTime, duration, true) &&
      dismissedUpNextFor !== activeEpisode?.id
  );

  const handlePlayNextEpisode = useCallback(() => {
    if (!nextEpisode) return;
    syncProgress(duration);
    setEpisodesOpen(false);
    setDismissedUpNextFor(null);
    setUpNextCountdown(UP_NEXT_AUTOPLAY_SECONDS);
    onSelectEpisode(nextEpisode.id);
  }, [nextEpisode, duration, syncProgress, onSelectEpisode]);

  useEffect(() => {
    if (!upNextVisible || !settings.autoplayNextEpisode) {
      setUpNextCountdown(UP_NEXT_AUTOPLAY_SECONDS);
      return;
    }
    const timer = window.setInterval(() => {
      setUpNextCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [upNextVisible, settings.autoplayNextEpisode]);

  useEffect(() => {
    if (upNextVisible && settings.autoplayNextEpisode && upNextCountdown === 0) {
      handlePlayNextEpisode();
    }
  }, [upNextVisible, settings.autoplayNextEpisode, upNextCountdown, handlePlayNextEpisode]);

  const handleSeek = useCallback(
    (targetSeconds: number) => {
      const clamped = Math.max(0, Math.min(duration || 7200, targetSeconds));
      if (videoRef.current) {
        videoRef.current.currentTime = clamped;
      }
      setCurrentTime(clamped);
      syncProgress(clamped);
    },
    [duration, syncProgress]
  );

  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [isPlaying]);

  const handleClosePlayer = useCallback(() => {
    syncProgress(currentTimeRef.current);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    onClose();
  }, [syncProgress, onClose]);

  const resetControlsTimer = useCallback(() => {
    setIsControlsVisible(true);
    if (hideControlsTimerRef.current) {
      window.clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = window.setTimeout(() => {
        setIsControlsVisible(false);
      }, 3500);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!title) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape') handleClosePlayer();
        return;
      }
      resetControlsTimer();
      if (e.key === 'Escape') {
        if (episodesOpen || speedMenuOpen || subMenuOpen || audioMenuOpen) {
          setEpisodesOpen(false);
          setSpeedMenuOpen(false);
          setSubMenuOpen(false);
          setAudioMenuOpen(false);
        } else {
          handleClosePlayer();
        }
      } else if (e.key === ' ') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(currentTimeRef.current - 10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSeek(currentTimeRef.current + 10);
      } else if (e.key.toLowerCase() === 'm') {
        setIsMuted((prev) => !prev);
      } else if (e.key.toLowerCase() === 'f') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [title, episodesOpen, speedMenuOpen, subMenuOpen, audioMenuOpen, handleClosePlayer, handleTogglePlay, handleSeek, resetControlsTimer]);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  if (!title) return null;

  const totalDuration = duration > 0 ? duration : (activeEpisode?.durationSeconds ?? title.durationSeconds ?? 7200);
  const progressPct = totalDuration > 0 ? Math.min(100, (currentTime / totalDuration) * 100) : 0;
  const activeCues = activeEpisode ? activeEpisode.subtitles : title.movieSubtitles;
  const activeSubtitle = getActiveSubtitle(activeCues, currentTime, subtitleLang);
  const showSkipIntro = Boolean(activeEpisode && currentTime >= 4 && currentTime <= 24);
  const isCompletedNoNext = currentTime >= totalDuration && !nextEpisode;

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen?.().catch(() => {});
    }
  };

  const drawerEpisodes = useMemo(() => {
    if (!title || !isSeries) return [];
    const eps = (title.episodes ?? []).filter((e) => e.season === drawerSeason);
    if (eps.length > 0) return eps;
    return Array.from({ length: 8 }, (_, i) => ({
      id: `${title.id}-s${drawerSeason}-e${i + 1}`,
      season: drawerSeason,
      number: i + 1,
      title: `Episódio ${i + 1}`,
      durationSeconds: 2700,
      durationLabel: '45m',
      synopsis: `Episódio ${i + 1} da Temporada ${drawerSeason}.`,
      thumbnail: title.cardImage,
      subtitles: [],
    }));
  }, [title, isSeries, drawerSeason]);

  return (
    <div
      ref={containerRef}
      data-testid="video-player-modal"
      role="dialog"
      aria-modal="true"
      aria-label={`Assistindo ${title.title}`}
      onMouseMove={resetControlsTimer}
      className="fixed inset-0 z-50 flex flex-col bg-black text-white select-none overflow-hidden"
    >
      {/* Top Cinema Bar */}
      <header
        className={`relative z-20 flex items-center justify-between gap-4 border-b border-white/[0.08] bg-[#0B0B0B]/95 px-5 py-3.5 transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <button
            type="button"
            onClick={handleClosePlayer}
            aria-label="Voltar para o catálogo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#181818] text-white transition-colors hover:bg-[#E5192B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <h2 className="truncate text-sm sm:text-base font-bold text-white">
                {title.title}
              </h2>
              <span className="hidden sm:inline-block rounded bg-[#222222] px-2 py-0.5 text-[10px] font-bold tracking-wider text-[#FF2A3B]">
                {title.quality}
              </span>
              <span className="hidden sm:inline-block rounded bg-[#1C1C1C] px-2 py-0.5 text-[10px] font-semibold text-neutral-300">
                {settings.preferredQuality}
              </span>
            </div>
            {activeEpisode ? (
              <p
                data-testid="player-episode-label"
                className="truncate text-xs text-neutral-400"
              >
                <span className="font-semibold text-[#FF2A3B]">
                  T{activeEpisode.season}:E{activeEpisode.number}
                </span>{' '}
                · {activeEpisode.title}
              </p>
            ) : (
              <p className="truncate text-xs text-neutral-400">
                {title.type} · {title.year} · {title.maturity}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Audio selection toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setAudioMenuOpen(!audioMenuOpen);
                setSpeedMenuOpen(false);
                setSubMenuOpen(false);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1C1C1C] px-3.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-[#252525]"
            >
              <span>{selectedAudio === 'dublado' ? 'Áudio: Dublado' : 'Áudio: Legendado'}</span>
            </button>
            {audioMenuOpen && (
              <div className="absolute right-0 top-11 z-30 w-36 rounded-xl border border-white/10 bg-[#161616] p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAudio('dublado');
                    setAudioMenuOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                    selectedAudio === 'dublado' ? 'bg-[#E5192B] text-white' : 'text-neutral-300 hover:bg-[#222222]'
                  }`}
                >
                  <span>Dublado</span>
                  {selectedAudio === 'dublado' && <Check className="h-3.5 w-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAudio('legendado');
                    setAudioMenuOpen(false);
                  }}
                  className={`mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                    selectedAudio === 'legendado' ? 'bg-[#E5192B] text-white' : 'text-neutral-300 hover:bg-[#222222]'
                  }`}
                >
                  <span>Legendado</span>
                  {selectedAudio === 'legendado' && <Check className="h-3.5 w-3.5" />}
                </button>
              </div>
            )}
          </div>

          {nextEpisode && (
            <button
              type="button"
              onClick={handlePlayNextEpisode}
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full bg-[#1C1C1C] px-3.5 text-xs font-semibold text-neutral-200 transition-colors hover:bg-[#E5192B] hover:text-white"
            >
              <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                Próximo: T{nextEpisode.season}:E{nextEpisode.number}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClosePlayer}
            aria-label="Fechar player"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#181818] text-neutral-300 transition-colors hover:bg-[#262626] hover:text-white"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Main Video Stage with Real HTML5 Video & HLS Engine */}
      <div className="relative flex flex-1 min-h-0 items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          playsInline
          onCanPlay={() => setIsLoadingStream(false)}
          onPlaying={() => setIsLoadingStream(false)}
          onLoadedData={() => setIsLoadingStream(false)}
          className="h-full w-full object-contain"
          onClick={handleTogglePlay}
        />

        {/* Loading Spinner */}
        {isLoadingStream && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center bg-black/75 gap-3 z-10">
            {title?.heroImage && (
              <img
                src={title.heroImage}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-20 filter blur-xs"
              />
            )}
            <div className="relative z-20 flex flex-col items-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#E5192B] border-t-transparent" />
              <span className="text-xs font-semibold text-neutral-200">
                Conectando transmissão em alta definição...
              </span>
            </div>
          </div>
        )}

        {/* Stream Error Notice if failed */}
        {streamError && !isLoadingStream && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/85 p-6 z-10">
            <div className="max-w-md rounded-2xl border border-white/10 bg-[#161616] p-6 text-center">
              <AlertCircle className="mx-auto h-10 w-10 text-[#FF2A3B]" />
              <h3 className="mt-3 text-base font-bold text-white">Transmissão de Vídeo</h3>
              <p className="mt-1.5 text-xs text-neutral-400">{streamError}</p>
              <button
                type="button"
                onClick={() => {
                  setStreamError(null);
                  setIsLoadingStream(true);
                  setActiveStreamUrl(activeStreamUrl);
                }}
                className="mt-4 rounded-full bg-[#E5192B] px-5 py-2 text-xs font-bold text-white hover:bg-[#FF2436]"
              >
                Reconectar Servidor
              </button>
            </div>
          </div>
        )}

        {/* Subtitles Overlay */}
        {activeSubtitle && (
          <div
            data-testid="player-subtitle"
            aria-live="polite"
            className="pointer-events-none absolute inset-x-4 bottom-14 z-20 flex justify-center"
          >
            <span className="max-w-2xl rounded-lg bg-black/85 px-4 py-2 text-center text-sm sm:text-base font-medium leading-snug text-white ring-1 ring-white/10">
              {activeSubtitle}
            </span>
          </div>
        )}

        {/* Skip Intro Button */}
        {showSkipIntro && !upNextVisible && (
          <button
            type="button"
            onClick={() => handleSeek(24)}
            className="absolute right-6 bottom-16 z-20 rounded-xl border border-white/40 bg-[#141414]/90 px-4 py-2 text-xs font-bold tracking-wide text-white transition-colors hover:border-[#E5192B] hover:bg-[#E5192B]"
          >
            Pular Abertura
          </button>
        )}

        {/* Completed Finale Card */}
        {isCompletedNoNext && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="z-20 mx-4 max-w-md rounded-2xl border border-white/15 bg-[#121212]/95 p-6 text-center"
          >
            <div className="text-[11px] font-bold tracking-[0.12em] text-[#FF2A3B]">
              FINALIZADO
            </div>
            <h3 className="mt-1.5 text-xl font-bold text-white">{title.title}</h3>
            {activeEpisode && (
              <p className="mt-1 text-xs text-neutral-400">
                T{activeEpisode.season}:E{activeEpisode.number} · {activeEpisode.title}
              </p>
            )}
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  handleSeek(0);
                  if (videoRef.current) videoRef.current.play().catch(() => {});
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#E5192B] px-5 text-xs font-bold text-white hover:bg-[#FF2436]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Assistir Novamente</span>
              </button>
              <button
                type="button"
                onClick={handleClosePlayer}
                className="inline-flex h-10 items-center rounded-full bg-[#242424] px-5 text-xs font-semibold text-white hover:bg-[#303030]"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <footer
        className={`relative z-20 flex flex-col gap-2 border-t border-white/[0.08] bg-[#0B0B0B]/95 px-5 py-3 transition-opacity duration-300 ${
          isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber / Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
            {formatMediaTime(currentTime)}
          </span>
          <div
            className="relative h-2 flex-1 cursor-pointer rounded-full bg-[#222222]"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              handleSeek(pct * totalDuration);
            }}
          >
            <div
              className="h-full rounded-full bg-[#E5192B]"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[11px] font-medium text-neutral-400 tabular-nums">
            {formatMediaTime(totalDuration)}
          </span>
        </div>

        {/* Primary Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5192B] text-white hover:bg-[#FF2436]"
            >
              {isPlaying ? <Pause className="h-4 w-4 fill-white" /> : <Play className="ml-0.5 h-4 w-4 fill-white" />}
            </button>

            <button
              type="button"
              onClick={() => handleSeek(currentTime - 10)}
              aria-label="Voltar 10 segundos"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 hover:bg-[#202020] hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSeek(currentTime + 10)}
              aria-label="Avançar 10 segundos"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 hover:bg-[#202020] hover:text-white"
            >
              <RotateCw className="h-4 w-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                aria-label={isMuted ? 'Desmutar' : 'Mutar'}
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 hover:bg-[#202020] hover:text-white"
              >
                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  setIsMuted(false);
                }}
                className="h-1.5 w-18 accent-[#E5192B] cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSpeedMenuOpen(!speedMenuOpen);
                  setSubMenuOpen(false);
                  setAudioMenuOpen(false);
                }}
                aria-label="Velocidade de reprodução"
                className="flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-neutral-300 hover:bg-[#202020] hover:text-white"
              >
                <Gauge className="h-3.5 w-3.5" />
                <span>{playbackRate}x</span>
              </button>
              {speedMenuOpen && (
                <div className="absolute right-0 bottom-10 z-30 w-24 rounded-xl border border-white/10 bg-[#161616] p-1.5 shadow-xl">
                  {SPEED_OPTIONS.map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(rate);
                        setSpeedMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                        playbackRate === rate ? 'bg-[#E5192B] text-white' : 'text-neutral-300 hover:bg-[#222222]'
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Subtitles menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setSubMenuOpen(!subMenuOpen);
                  setSpeedMenuOpen(false);
                  setAudioMenuOpen(false);
                }}
                aria-label="Legendas"
                className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-xs font-semibold transition-colors ${
                  subtitleLang !== 'off'
                    ? 'bg-[#E5192B]/20 text-[#FF2A3B]'
                    : 'text-neutral-300 hover:bg-[#202020] hover:text-white'
                }`}
              >
                <Subtitles className="h-3.5 w-3.5" />
                <span className="capitalize">{subtitleLang}</span>
              </button>
              {subMenuOpen && (
                <div className="absolute right-0 bottom-10 z-30 w-32 rounded-xl border border-white/10 bg-[#161616] p-1.5 shadow-xl">
                  {(['pt', 'en', 'off'] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => {
                        setSubtitleLang(lang);
                        setSubMenuOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                        subtitleLang === lang ? 'bg-[#E5192B] text-white' : 'text-neutral-300 hover:bg-[#222222]'
                      }`}
                    >
                      <span>{lang === 'pt' ? 'Português' : lang === 'en' ? 'English' : 'Desativado'}</span>
                      {subtitleLang === lang && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episodes Drawer Toggle for Series ONLY */}
            {isSeries && (
              <button
                type="button"
                onClick={() => setEpisodesOpen(!episodesOpen)}
                aria-label="Lista de episódios"
                className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors ${
                  episodesOpen
                    ? 'bg-[#E5192B] text-white'
                    : 'bg-[#1C1C1C] text-neutral-300 hover:bg-[#252525] hover:text-white'
                }`}
              >
                <ListVideo className="h-3.5 w-3.5" />
                <span>Episódios</span>
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-300 hover:bg-[#202020] hover:text-white"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </footer>

      {/* Side Episodes Drawer */}
      {episodesOpen && title.episodes && (
        <aside
          role="dialog"
          aria-label="Episódios da série"
          className="absolute right-0 top-14 bottom-14 z-30 w-80 sm:w-96 border-l border-white/10 bg-[#101010]/98 p-4 shadow-2xl overflow-y-auto store-scroll"
        >
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">Episódios disponíveis</h3>
            <button
              type="button"
              onClick={() => setEpisodesOpen(false)}
              className="h-7 w-7 flex items-center justify-center rounded-full text-neutral-400 hover:bg-[#222222] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {seasons.length > 1 && (
            <div className="flex gap-2 py-3 overflow-x-auto">
              {seasons.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setDrawerSeason(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold shrink-0 transition-colors ${
                    drawerSeason === s
                      ? 'bg-[#E5192B] text-white'
                      : 'bg-[#1C1C1C] text-neutral-400 hover:bg-[#282828] hover:text-white'
                  }`}
                >
                  Temporada {s}
                </button>
              ))}
            </div>
          )}

          <div className="mt-2 space-y-2">
            {drawerEpisodes.map((ep) => {
              const isSelected = activeEpisode?.id === ep.id;
              return (
                <button
                  key={ep.id}
                  type="button"
                  onClick={() => {
                    onSelectEpisode(ep.id);
                    setEpisodesOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-[#E5192B]/20 border border-[#E5192B]/60 text-white'
                      : 'bg-[#181818] hover:bg-[#222222] text-neutral-200'
                  }`}
                >
                  <span className="w-5 text-center text-xs font-bold text-neutral-400">
                    {ep.number}
                  </span>
                  <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-black">
                    <img
                      src={ep.thumbnail}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Play className="h-3.5 w-3.5 fill-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-white">{ep.title}</p>
                    <span className="text-[11px] text-neutral-400">{ep.durationLabel}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      )}
    </div>
  );
}
