import { HelpCircle, Keyboard, Settings, X } from 'lucide-react';
import type { StreamingSettings, SubtitleLang } from '../types/streaming';

interface StreamingSettingsHelpModalProps {
  mode: 'settings' | 'help' | null;
  settings: StreamingSettings;
  onUpdateSettings: (next: StreamingSettings) => void;
  onClose: () => void;
}

export function StreamingSettingsHelpModal({
  mode,
  settings,
  onUpdateSettings,
  onClose,
}: StreamingSettingsHelpModalProps) {
  if (!mode) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="stream-utility-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[22px] border border-white/10 bg-[#141414] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-2.5">
            {mode === 'settings' ? (
              <Settings className="h-5 w-5 text-[#FF2A3B]" aria-hidden="true" />
            ) : (
              <HelpCircle className="h-5 w-5 text-[#FF2A3B]" aria-hidden="true" />
            )}
            <h2 id="stream-utility-title" className="text-base font-bold text-white">
              {mode === 'settings' ? 'Streaming Settings' : 'Streaming Help & Shortcuts'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {mode === 'settings' ? (
          <div className="mt-5 space-y-5">
            {/* Autoplay Next Episode */}
            <div className="flex items-center justify-between gap-4 rounded-xl bg-[#1C1C1C] p-3.5">
              <div>
                <div className="text-sm font-semibold text-white">Autoplay next episode</div>
                <p className="mt-0.5 text-xs text-neutral-400">
                  Automatically start the next episode when the Up Next countdown finishes.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.autoplayNextEpisode}
                aria-label="Toggle autoplay next episode"
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    autoplayNextEpisode: !settings.autoplayNextEpisode,
                  })
                }
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  settings.autoplayNextEpisode ? 'bg-[#E5192B]' : 'bg-[#333333]'
                }`}
              >
                <span
                  className={`block h-4.5 w-4.5 rounded-full bg-white transition-transform ${
                    settings.autoplayNextEpisode ? 'translate-x-5.5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Default Subtitles */}
            <div className="space-y-2">
              <label
                htmlFor="default-subtitles-select"
                className="block text-xs font-semibold text-neutral-300"
              >
                Default subtitles
              </label>
              <select
                id="default-subtitles-select"
                value={settings.defaultSubtitles}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    defaultSubtitles: e.target.value as SubtitleLang,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] px-3.5 py-2.5 text-sm text-white focus:border-[#E5192B] focus:outline-none"
              >
                <option value="pt">Português (BR)</option>
                <option value="en">English</option>
                <option value="off">Off</option>
              </select>
            </div>

            {/* Preferred Video Quality */}
            <div className="space-y-2">
              <label
                htmlFor="video-quality-select"
                className="block text-xs font-semibold text-neutral-300"
              >
                Preferred video quality
              </label>
              <select
                id="video-quality-select"
                value={settings.preferredQuality}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    preferredQuality: e.target.value as StreamingSettings['preferredQuality'],
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-[#1C1C1C] px-3.5 py-2.5 text-sm text-white focus:border-[#E5192B] focus:outline-none"
              >
                <option value="4K HDR">4K Ultra HD + HDR</option>
                <option value="1080p">1080p Full HD</option>
                <option value="Auto">Auto (Adaptive)</option>
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#E5192B] px-5 py-2 text-xs font-bold text-white hover:bg-[#FF2436]"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="rounded-xl bg-[#1C1C1C] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-[#FF2A3B]">
                <Keyboard className="h-4 w-4" aria-hidden="true" />
                <span>PLAYER KEYBOARD SHORTCUTS</span>
              </div>
              <dl className="mt-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-300">Play / Pause</dt>
                  <dd className="rounded bg-[#2A2A2A] px-2 py-0.5 font-mono text-white">Space</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-300">Rewind / Forward 10s</dt>
                  <dd className="rounded bg-[#2A2A2A] px-2 py-0.5 font-mono text-white">← / →</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-300">Mute / Unmute</dt>
                  <dd className="rounded bg-[#2A2A2A] px-2 py-0.5 font-mono text-white">M</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-neutral-300">Close Player / Drawer</dt>
                  <dd className="rounded bg-[#2A2A2A] px-2 py-0.5 font-mono text-white">Esc</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-2 text-xs leading-relaxed text-neutral-300">
              <p>
                <strong className="text-white">Series & Animes:</strong> Click any show card or the{' '}
                <strong className="text-white">Episodes</strong> button to switch seasons and pick
                any episode directly.
              </p>
              <p>
                <strong className="text-white">Next Episode Prompt:</strong> In the final 12 seconds
                of an episode, the Up Next card lets you jump right into the next episode or stay
                to watch credits.
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-[#E5192B] px-5 py-2 text-xs font-bold text-white hover:bg-[#FF2436]"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
