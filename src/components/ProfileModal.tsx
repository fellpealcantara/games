import { useState, type FormEvent } from 'react';
import { Award, Clock, Gamepad2, Heart, X } from 'lucide-react';
import type { UserProfile } from '../types/store';

interface ProfileModalProps {
  open: boolean;
  profile: UserProfile;
  ownedCount: number;
  wishlistCount: number;
  onClose: () => void;
  onSaveProfile: (updates: Pick<UserProfile, 'username' | 'statusText'>) => void;
}

export function ProfileModal({
  open,
  profile,
  ownedCount,
  wishlistCount,
  onClose,
  onSaveProfile,
}: ProfileModalProps) {
  const [username, setUsername] = useState(profile.username);
  const [statusText, setStatusText] = useState(profile.statusText);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = username.trim();
    if (trimmed.length < 2) {
      setError('Display name must be at least 2 characters.');
      return;
    }
    setError('');
    onSaveProfile({ username: trimmed, statusText: statusText.trim() || 'Online' });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-[24px] border border-white/10 bg-[#121212] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <img
              src={profile.avatarImage}
              alt={profile.username}
              referrerPolicy="no-referrer"
              className="h-16 w-16 rounded-2xl object-cover ring-2 ring-[#E5192B]"
            />
            <div>
              <h2 id="profile-modal-title" className="text-lg font-bold text-white">
                {profile.username}
              </h2>
              <p className="text-xs text-[#FF2A3B]">{profile.statusText}</p>
              <p className="mt-1 text-[11px] text-neutral-400 tabular-nums">
                Level {profile.level} · Member since {profile.memberSince}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close profile modal"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Account Metrics */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl bg-[#1A1A1A] p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Gamepad2 className="h-3.5 w-3.5 text-[#FF2A3B]" /> Owned
            </div>
            <div className="mt-1 text-lg font-bold text-white tabular-nums">{ownedCount}</div>
          </div>
          <div className="rounded-xl bg-[#1A1A1A] p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-[#FF2A3B]" /> Hours
            </div>
            <div className="mt-1 text-lg font-bold text-white tabular-nums">
              {profile.hoursPlayed}
            </div>
          </div>
          <div className="rounded-xl bg-[#1A1A1A] p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Award className="h-3.5 w-3.5 text-[#FF2A3B]" /> Trophies
            </div>
            <div className="mt-1 text-lg font-bold text-white tabular-nums">
              {profile.achievementsUnlocked}
            </div>
          </div>
          <div className="rounded-xl bg-[#1A1A1A] p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <Heart className="h-3.5 w-3.5 text-[#FF2A3B]" /> Wishlist
            </div>
            <div className="mt-1 text-lg font-bold text-white tabular-nums">
              {wishlistCount}
            </div>
          </div>
        </div>

        {/* Editable Profile Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="profile-username-input"
              className="block text-xs font-medium text-neutral-300"
            >
              Display Name
            </label>
            <input
              id="profile-username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#E5192B] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="profile-status-input"
              className="block text-xs font-medium text-neutral-300"
            >
              Status Message
            </label>
            <input
              id="profile-status-input"
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0A0A0A] px-3.5 py-2.5 text-sm text-white focus:border-[#E5192B] focus:outline-none"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-[#FF2A3B]">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#202020] px-4 py-2.5 text-xs font-semibold text-neutral-200 hover:bg-[#2C2C2C]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#E5192B] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#FF2436]"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
