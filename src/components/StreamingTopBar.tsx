import { useEffect, useRef, useState } from 'react';
import { Bell, Menu, Search, SlidersHorizontal, X } from 'lucide-react';
import type { StreamingTypeFilter } from '../types/streaming';
import type { UserProfile } from '../types/store';
import avatarWinotikk from '../assets/images/avatar_winotikk_1795288189423.jpg';

interface StreamingTopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  typeFilter: StreamingTypeFilter;
  onSelectTypeFilter: (filter: StreamingTypeFilter) => void;
  profile: UserProfile;
  onOpenProfile: () => void;
  onOpenMobileMenu: () => void;
}

const STREAM_TABS: StreamingTypeFilter[] = ['Movies', 'TV-Shows', 'Series', 'Animes'];
const FILTER_OPTIONS: StreamingTypeFilter[] = ['All', 'Movies', 'TV-Shows', 'Series', 'Animes'];

export function StreamingTopBar({
  searchQuery,
  onSearchChange,
  typeFilter,
  onSelectTypeFilter,
  profile,
  onOpenProfile,
  onOpenMobileMenu,
}: StreamingTopBarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const notifRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (notifOpen || filterOpen) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [notifOpen, filterOpen]);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: Mobile Menu + Identical Search Bar to Games TopBar */}
      <div className="flex flex-1 items-center gap-2.5 min-w-[220px] max-w-[360px]">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#141414] border border-white/[0.08] text-neutral-300 hover:bg-[#1E1E1E] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div ref={filterRef} className="relative flex-1">
          <div className="flex h-11 items-center rounded-2xl bg-[#141414] pl-3.5 pr-1.5 border border-white/[0.08] focus-within:border-[#E5192B] transition-colors">
            <Search
              className="h-4 w-4 shrink-0 text-[#7A7A80]"
              aria-hidden="true"
            />
            <label htmlFor="streaming-search-input" className="sr-only">
              Search movies, series, and animes
            </label>
            <input
              id="streaming-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for movies, series, animes"
              className="h-full w-full bg-transparent px-2.5 text-[13px] text-white placeholder-[#7A7A80] focus:outline-none"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear streaming search"
                className="mr-1 flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-expanded={filterOpen}
              aria-label="Filter streaming catalog"
              className={`relative flex h-8 w-10 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
                filterOpen || typeFilter !== 'All'
                  ? 'bg-[#E5192B] text-white'
                  : 'bg-[#222222] text-neutral-300 hover:bg-[#2C2C2C] hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {filterOpen && (
            <div
              role="dialog"
              aria-label="Streaming catalog filters"
              className="absolute left-0 top-full z-40 mt-2 w-[270px] rounded-2xl border border-white/10 bg-[#161616] p-4 shadow-2xl"
            >
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white">Filter by Category</h3>
                {typeFilter !== 'All' && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectTypeFilter('All');
                      setFilterOpen(false);
                    }}
                    className="text-xs font-medium text-[#FF2A3B] hover:text-[#FF4D5C]"
                  >
                    Reset
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTER_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onSelectTypeFilter(opt);
                      setFilterOpen(false);
                    }}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      typeFilter === opt
                        ? 'bg-[#E5192B] text-white'
                        : 'bg-[#222222] text-neutral-300 hover:bg-[#2C2C2C] hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Category Links + Notifications + Profile (Pixel-perfect matching user print) */}
      <div className="flex items-center gap-7 sm:gap-9 shrink-0">
        <nav aria-label="Streaming categories" className="hidden md:flex items-center gap-8 lg:gap-10">
          {STREAM_TABS.map((tab) => {
            const isActive = typeFilter === tab || (typeFilter === 'All' && tab === 'Movies');
            return (
              <button
                key={tab}
                type="button"
                onClick={() => onSelectTypeFilter(typeFilter === tab ? 'All' : tab)}
                aria-pressed={isActive}
                className={`text-[15px] font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D2FF] px-1 py-0.5 ${
                  isActive
                    ? 'text-[#00D2FF]'
                    : 'text-white hover:text-[#00D2FF]'
                }`}
              >
                {tab}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-3.5">
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setNotifOpen((prev) => !prev);
                setUnreadCount(0);
              }}
              aria-label="Streaming notifications"
              aria-expanded={notifOpen}
              className="relative flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#141416] border border-white/[0.04] text-white transition-colors hover:bg-[#1E1E22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D2FF]"
            >
              <div className="relative flex items-center justify-center">
                <Bell className="h-5 w-5 text-white" aria-hidden="true" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#EF4444]" />
                )}
              </div>
            </button>

            {notifOpen && (
              <div
                role="dialog"
                aria-label="Notifications"
                className="absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border border-white/10 bg-[#161616] p-4 shadow-2xl"
              >
                <div className="text-xs font-semibold text-white">Atualizações</div>
                <ul className="mt-3 space-y-2.5 text-xs">
                  <li className="rounded-xl bg-[#1F1F1F] p-2.5">
                    <div className="font-semibold text-white">Stranger Things · Temporada 5</div>
                    <p className="mt-0.5 text-neutral-400">Novos episódios disponíveis em 4K HDR.</p>
                  </li>
                  <li className="rounded-xl bg-[#1F1F1F] p-2.5">
                    <div className="font-semibold text-white">Deadpool & Wolverine</div>
                    <p className="mt-0.5 text-neutral-400">Disponível com áudio Dublado e Legendado.</p>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenProfile}
            aria-label={`View profile for ${profile.username}`}
            className="flex h-11 items-center gap-3 rounded-[16px] bg-[#141416] border border-white/[0.04] pl-2.5 pr-4 text-left transition-colors hover:bg-[#1E1E22] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00D2FF]"
          >
            <img
              src={profile.avatarImage || avatarWinotikk}
              alt={profile.username}
              referrerPolicy="no-referrer"
              className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10"
            />
            <div className="hidden sm:flex flex-col leading-tight">
              <span className="text-[13.5px] font-bold text-white tracking-tight whitespace-nowrap">
                {profile.username}
              </span>
              <span className="text-[11.5px] font-medium text-[#EF4444] whitespace-nowrap">
                View profile
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
