import { useEffect, useRef, useState } from 'react';
import {
  Heart,
  Menu,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import type { GameCategory, SortOption, StoreFilter, UserProfile } from '../types/store';

interface TopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filter: StoreFilter;
  onFilterChange: (next: StoreFilter) => void;
  onResetFilters: () => void;
  wishlistCount: number;
  cartCount: number;
  profile: UserProfile;
  onOpenWishlist: () => void;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  onOpenMobileMenu: () => void;
}

const CATEGORIES: GameCategory[] = [
  'All',
  'Action',
  'RPG',
  'Open World',
  'MOBA',
  'Adventure',
  'Shooter',
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'discount', label: 'Biggest Discount' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
];

export function TopBar({
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  onResetFilters,
  wishlistCount,
  cartCount,
  profile,
  onOpenWishlist,
  onOpenCart,
  onOpenProfile,
  onOpenMobileMenu,
}: TopBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const hasActiveFilter =
    filter.category !== 'All' ||
    filter.onlyDiscounts ||
    filter.maxPrice < 100 ||
    filter.sortBy !== 'featured';

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    if (filterOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [filterOpen]);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      {/* Left: Mobile Menu + Search Input with Integrated Filter Button */}
      <div className="flex flex-1 items-center gap-2.5 min-w-[220px] max-w-[360px]">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#141414] border border-white/[0.08] text-neutral-300 hover:bg-[#1E1E1E] hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div ref={popoverRef} className="relative flex-1">
          <div className="flex h-11 items-center rounded-2xl bg-[#141414] pl-3.5 pr-1.5 border border-white/[0.08] focus-within:border-[#E5192B] transition-colors">
            <Search
              className="h-4 w-4 shrink-0 text-[#7A7A80]"
              aria-hidden="true"
            />
            <label htmlFor="store-search-input" className="sr-only">
              Search for games
            </label>
            <input
              id="store-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search for games"
              className="h-full w-full bg-transparent px-2.5 text-[13px] text-white placeholder-[#7A7A80] focus:outline-none"
            />
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                aria-label="Clear search"
                className="mr-1 flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setFilterOpen((prev) => !prev)}
              aria-expanded={filterOpen}
              aria-label="Filter games"
              className={`relative flex h-8 w-10 shrink-0 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B] ${
                filterOpen || hasActiveFilter
                  ? 'bg-[#E5192B] text-white'
                  : 'bg-[#222222] text-neutral-300 hover:bg-[#2C2C2C] hover:text-white'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Interactive Filter Popover */}
          {filterOpen && (
            <div
              role="dialog"
              aria-label="Game catalog filters"
              className="absolute left-0 top-full z-40 mt-2 w-[310px] rounded-2xl border border-white/10 bg-[#161616] p-4 shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white">Filter & Sort</h3>
                <button
                  type="button"
                  onClick={onResetFilters}
                  className="text-xs font-medium text-[#FF2A3B] hover:text-[#FF4D5C]"
                >
                  Reset
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <div className="mb-1.5 text-[11px] font-medium text-neutral-400">Category</div>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => onFilterChange({ ...filter, category: cat })}
                        className={`rounded-lg px-2.5 py-1 text-[11.5px] font-medium transition-colors whitespace-nowrap ${
                          filter.category === cat
                            ? 'bg-[#E5192B] text-white'
                            : 'bg-[#222222] text-neutral-300 hover:bg-[#2C2C2C] hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="sort-select"
                    className="mb-1.5 block text-[11px] font-medium text-neutral-400"
                  >
                    Sort by
                  </label>
                  <select
                    id="sort-select"
                    value={filter.sortBy}
                    onChange={(e) =>
                      onFilterChange({ ...filter, sortBy: e.target.value as SortOption })
                    }
                    className="w-full rounded-lg border border-white/10 bg-[#0D0D0D] px-3 py-2 text-xs text-white focus:border-[#E5192B] focus:outline-none"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <label htmlFor="max-price-range" className="font-medium text-neutral-400">
                      Max price
                    </label>
                    <span className="font-semibold text-white tabular-nums">
                      ${filter.maxPrice}
                    </span>
                  </div>
                  <input
                    id="max-price-range"
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={filter.maxPrice}
                    onChange={(e) =>
                      onFilterChange({ ...filter, maxPrice: Number(e.target.value) })
                    }
                    className="w-full accent-[#E5192B]"
                  />
                </div>

                <label className="flex cursor-pointer items-center justify-between rounded-xl bg-[#202020] px-3 py-2">
                  <span className="text-xs font-medium text-neutral-200">
                    Discounted games only
                  </span>
                  <input
                    type="checkbox"
                    checked={filter.onlyDiscounts}
                    onChange={(e) =>
                      onFilterChange({ ...filter, onlyDiscounts: e.target.checked })
                    }
                    className="h-4 w-4 rounded accent-[#E5192B]"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Wishlist, Shopping Cart with solid bright red badge, and Winotikk Profile */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onOpenWishlist}
          aria-label={`Open wishlist (${wishlistCount} saved)`}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#141414] border border-white/[0.08] text-neutral-300 transition-colors hover:bg-[#1E1E1E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
        >
          <Heart className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={onOpenCart}
          aria-label={`Open shopping cart (${cartCount} items)`}
          className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-[#141414] border border-white/[0.08] text-neutral-300 transition-colors hover:bg-[#1E1E1E] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
        >
          <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
          {cartCount > 0 && (
            <span
              data-testid="cart-badge"
              className="absolute right-1.5 top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#E5192B] px-1 text-[10px] font-bold leading-none text-white tabular-nums"
            >
              {cartCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={`View profile for ${profile.username}`}
          className="flex h-11 items-center gap-2.5 rounded-2xl bg-[#141414] border border-white/[0.08] pl-2.5 pr-4 text-left transition-colors hover:bg-[#1E1E1E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5192B]"
        >
          <img
            src={profile.avatarImage}
            alt={profile.username}
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-full object-cover ring-1 ring-white/15"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-[13px] font-bold text-white whitespace-nowrap">
              {profile.username}
            </span>
            <span className="text-[11px] font-semibold text-[#FF2A3B] whitespace-nowrap">
              View profile
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}
