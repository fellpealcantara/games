import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Download,
  Film,
  Play,
  Plus,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import type { StreamingTitle, WatchProgress } from '../types/streaming';
import { getWatchProgressPercent } from '../utils/streamingLogic';
import { resolveMediaImageUrl } from '../services/streamingService';

interface StreamingDetailModalProps {
  title: StreamingTitle | null;
  progress?: WatchProgress;
  isInMyList: boolean;
  isLiked: boolean;
  isDownloaded: boolean;
  onClose: () => void;
  onPlay: (title: StreamingTitle, episodeId?: string) => void;
  onToggleMyList: (titleId: string) => void;
  onToggleLike: (titleId: string) => void;
  onToggleDownload: (titleId: string) => void;
  relatedTitles?: StreamingTitle[];
  onSelectRelatedTitle?: (title: StreamingTitle) => void;
}

export function StreamingDetailModal({
  title,
  progress,
  isInMyList,
  isLiked,
  isDownloaded,
  onClose,
  onPlay,
  onToggleMyList,
  onToggleLike,
  onToggleDownload,
  relatedTitles = [],
  onSelectRelatedTitle,
}: StreamingDetailModalProps) {
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [selectedAudio, setSelectedAudio] = useState<'dublado' | 'legendado'>('dublado');

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

  useEffect(() => {
    if (seasons.length > 0) {
      setSelectedSeason(seasons[0]);
    } else {
      setSelectedSeason(1);
    }
  }, [title?.id, seasons]);

  if (!title) return null;

  const activeSeason = seasons.includes(selectedSeason) ? selectedSeason : (seasons[0] ?? 1);

  // Episodes for active season
  const seasonEpisodes = useMemo(() => {
    if (!isSeries) return [];
    const eps = (title.episodes ?? []).filter((ep) => ep.season === activeSeason);
    if (eps.length > 0) return eps;

    // Fallback: generate season episodes if none matched
    const count = 8;
    return Array.from({ length: count }, (_, i) => ({
      id: `${title.id}-s${activeSeason}-e${i + 1}`,
      season: activeSeason,
      number: i + 1,
      title: `Episódio ${i + 1}`,
      durationSeconds: 2700,
      durationLabel: '45m',
      synopsis: `Episódio ${i + 1} da Temporada ${activeSeason} em transmissão oficial Ultra HD 4K HDR.`,
      thumbnail: title.cardImage,
      subtitles: [],
    }));
  }, [title, isSeries, activeSeason]);

  const resumeEpisode = progress?.episodeId
    ? title.episodes?.find((e) => e.id === progress.episodeId)
    : seasonEpisodes[0];

  const heroBannerUrl = resolveMediaImageUrl(title.heroImage || title.cardImage);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stream-detail-title"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[24px] border border-white/10 bg-[#121212] shadow-2xl store-scroll"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hero Banner */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden">
          <img
            src={heroBannerUrl}
            alt={title.title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/50 to-black/30" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#111111]/85 text-white hover:bg-[#242424] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="absolute bottom-5 left-6 right-6">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
              <span className="font-semibold text-[#FF2A3B]">
                {isSeries ? 'Série' : 'Filme'}
              </span>
              <span aria-hidden="true">·</span>
              <span>{title.year}</span>
              <span aria-hidden="true">·</span>
              <span className="rounded bg-[#242424] px-1.5 py-0.5 text-[10.5px] font-semibold text-white">
                {title.maturity}
              </span>
              <span aria-hidden="true">·</span>
              <span>{title.durationLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 font-semibold text-white tabular-nums">
                <Star className="h-3.5 w-3.5 fill-[#FF2A3B] text-[#FF2A3B]" />
                {title.rating.toFixed(1)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="rounded border border-[#FF2A3B]/40 bg-[#FF2A3B]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#FF2A3B]">
                {title.quality}
              </span>
            </div>

            <h2
              id="stream-detail-title"
              className="mt-1.5 text-2xl sm:text-3xl font-bold text-white tracking-tight"
            >
              {title.title}
            </h2>

            {/* Action Row */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onPlay(title, isSeries ? resumeEpisode?.id : undefined)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-[#E5192B] px-6 text-xs font-bold text-white transition-colors hover:bg-[#FF2436]"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>
                  {isSeries
                    ? resumeEpisode
                      ? `Assistir T${resumeEpisode.season}:E${resumeEpisode.number}`
                      : `Assistir Temporada ${activeSeason}`
                    : 'Assistir Filme'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => onToggleMyList(title.id)}
                aria-label={isInMyList ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-colors ${
                  isInMyList
                    ? 'border-[#E5192B] bg-[#E5192B] text-white'
                    : 'border-white/30 bg-[#1A1A1A] text-white hover:border-white'
                }`}
              >
                {isInMyList ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                <span>{isInMyList ? 'Na Minha Lista' : 'Minha Lista'}</span>
              </button>

              <button
                type="button"
                onClick={() => onToggleLike(title.id)}
                aria-label={isLiked ? 'Descurtir título' : 'Curtir título'}
                className={`flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${
                  isLiked
                    ? 'border-[#E5192B] bg-[#E5192B] text-white'
                    : 'border-white/30 bg-[#1A1A1A] text-white hover:border-white'
                }`}
              >
                <ThumbsUp className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => onToggleDownload(title.id)}
                aria-label={isDownloaded ? 'Remover download' : 'Baixar para assistir offline'}
                className={`inline-flex h-10 items-center gap-1.5 rounded-full border px-4 text-xs font-semibold transition-colors ${
                  isDownloaded
                    ? 'border-white/40 bg-[#262626] text-white'
                    : 'border-white/30 bg-[#1A1A1A] text-neutral-200 hover:border-white hover:text-white'
                }`}
              >
                <Download className="h-3.5 w-3.5" />
                <span>{isDownloaded ? 'Baixado' : 'Baixar'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="space-y-6 p-6">
          <div className="grid gap-4 md:grid-cols-[1.7fr_1fr]">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Sinopse</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-300">{title.synopsis}</p>
            </div>

            <div className="space-y-2 rounded-2xl bg-[#161616] p-4 border border-white/[0.06] text-xs text-neutral-400">
              <div>
                <span className="text-neutral-500 font-medium">Gêneros: </span>
                <span className="text-neutral-200">{title.genres.join(', ')}</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Qualidade: </span>
                <span className="text-neutral-200">{title.quality} · HLS 1080p</span>
              </div>
              <div>
                <span className="text-neutral-500 font-medium">Transmissão: </span>
                <span className="text-neutral-200">Oficial Ultra HD · Dolby Audio</span>
              </div>
            </div>
          </div>

          {/* Audio Dublado / Legendado Selection Bar */}
          <div className="flex items-center gap-3 border-t border-white/[0.08] pt-4">
            <span className="text-xs font-semibold text-neutral-400">Opções de Áudio:</span>
            <div className="inline-flex rounded-xl bg-[#1A1A1A] p-1 border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedAudio('dublado')}
                className={`rounded-lg px-3.5 py-1 text-xs font-bold transition-colors ${
                  selectedAudio === 'dublado'
                    ? 'bg-[#E5192B] text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Dublado
              </button>
              <button
                type="button"
                onClick={() => setSelectedAudio('legendado')}
                className={`rounded-lg px-3.5 py-1 text-xs font-bold transition-colors ${
                  selectedAudio === 'legendado'
                    ? 'bg-[#E5192B] text-white'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                Legendado
              </button>
            </div>
          </div>

          {/* If it's a Series: Season & Episode Selector */}
          {isSeries && (
            <div className="border-t border-white/[0.08] pt-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Film className="h-4 w-4 text-[#FF2A3B]" />
                  <h3 className="text-base font-bold text-white">Temporadas & Episódios</h3>
                </div>

                {/* Season Tabs Selector */}
                {seasons.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                    {seasons.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSelectedSeason(s)}
                        className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-colors whitespace-nowrap ${
                          activeSeason === s
                            ? 'bg-[#E5192B] text-white shadow-md'
                            : 'bg-[#1C1C1C] text-neutral-300 hover:bg-[#282828] hover:text-white'
                        }`}
                      >
                        Temporada {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Episodes List for Active Season */}
              <div className="mb-2 text-xs font-semibold text-neutral-400">
                Episódios da Temporada {activeSeason} ({seasonEpisodes.length})
              </div>

              <ol className="space-y-2.5" aria-label={`Episódios da Temporada ${activeSeason}`}>
                {seasonEpisodes.map((ep) => {
                  const isCurrent = progress?.episodeId === ep.id;
                  const epPct =
                    isCurrent && progress
                      ? getWatchProgressPercent(
                          progress.currentTimeSeconds,
                          progress.durationSeconds
                        )
                      : 0;

                  const epThumbnail = resolveMediaImageUrl(ep.thumbnail || title.cardImage);

                  return (
                    <li key={ep.id}>
                      <button
                        type="button"
                        onClick={() => onPlay(title, ep.id)}
                        aria-label={`Assistir Episódio ${ep.number}: ${ep.title}`}
                        className={`group flex w-full flex-col sm:flex-row sm:items-center gap-4 rounded-2xl p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
                          isCurrent
                            ? 'bg-[#202020] ring-1 ring-[#E5192B]/60'
                            : 'bg-[#181818] hover:bg-[#222222]'
                        }`}
                      >
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="w-6 text-center text-sm font-bold text-neutral-400 tabular-nums">
                            {ep.number}
                          </span>
                          <div className="relative h-20 w-36 overflow-hidden rounded-xl bg-[#0D0D0D]">
                            <img
                              src={epThumbnail}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-85 group-hover:opacity-100">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E5192B] text-white">
                                <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
                              </span>
                            </div>
                            {epPct > 0 && (
                              <div className="absolute inset-x-0 bottom-0 h-1 bg-[#2E2E2E]">
                                <div
                                  className="h-full bg-[#E5192B]"
                                  style={{ width: `${epPct}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate text-sm font-semibold text-white group-hover:text-[#FF2A3B]">
                              {ep.title}
                            </span>
                            <span className="shrink-0 text-xs font-medium text-neutral-400 tabular-nums">
                              {ep.durationLabel}
                            </span>
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-400">
                            {ep.synopsis}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* If it's a Movie: Related Titles Recommendations */}
          {!isSeries && relatedTitles.length > 0 && (
            <div className="border-t border-white/[0.08] pt-5">
              <h3 className="mb-3 text-sm font-bold text-white">Títulos Relacionados</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {relatedTitles.slice(0, 4).map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectRelatedTitle?.(rel)}
                    className="group flex flex-col text-left focus:outline-none"
                  >
                    <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#1A1A1A] border border-white/[0.06]">
                      <img
                        src={resolveMediaImageUrl(rel.cardImage)}
                        alt={rel.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E5192B] text-white">
                          <Play className="ml-0.5 h-4 w-4 fill-white" />
                        </span>
                      </div>
                    </div>
                    <span className="mt-1.5 truncate text-xs font-semibold text-white group-hover:text-[#FF2A3B]">
                      {rel.title}
                    </span>
                    <span className="text-[11px] text-neutral-400">{rel.year}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
