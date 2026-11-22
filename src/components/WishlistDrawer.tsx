import { Check, Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Game } from '../types/store';
import { formatPrice } from '../utils/storeLogic';
import { GameCoverArt } from './GameCoverArt';

interface WishlistDrawerProps {
  open: boolean;
  wishlistIds: string[];
  cartIds: string[];
  libraryIds: string[];
  games: Game[];
  onClose: () => void;
  onRemoveWishlist: (gameId: string) => void;
  onAddToCart: (gameId: string) => void;
  onSelectGame: (game: Game) => void;
}

export function WishlistDrawer({
  open,
  wishlistIds,
  cartIds,
  libraryIds,
  games,
  onClose,
  onRemoveWishlist,
  onAddToCart,
  onSelectGame,
}: WishlistDrawerProps) {
  if (!open) return null;

  const gameMap = new Map(games.map((g) => [g.id, g]));
  const items = wishlistIds
    .map((id) => gameMap.get(id))
    .filter((g): g is Game => Boolean(g));

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Wishlist"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#121212] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <Heart className="h-5 w-5 fill-[#FF2436] text-[#FF2436]" aria-hidden="true" />
            <h2 className="text-base font-bold text-white">
              Wishlist ({items.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wishlist"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 store-scroll">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Heart className="h-10 w-10 text-neutral-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-white">No saved games yet</p>
              <p className="mt-1 text-xs text-neutral-400">
                Click the heart icon on any game to save it for later.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((game) => {
                const isOwned = libraryIds.includes(game.id);
                const isInCart = cartIds.includes(game.id);

                return (
                  <li
                    key={game.id}
                    className="flex items-center gap-3.5 rounded-2xl bg-[#1A1A1A] p-3 ring-1 ring-white/[0.06]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectGame(game);
                      }}
                      className="h-16 w-24 shrink-0 overflow-hidden rounded-xl"
                      aria-label={`View ${game.title}`}
                    >
                      <GameCoverArt game={game} className="h-full w-full" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">
                        {game.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2 tabular-nums">
                        {game.discountPercent > 0 && (
                          <span className="rounded bg-[#E5192B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                            -{game.discountPercent}%
                          </span>
                        )}
                        <span className="text-xs font-bold text-white">
                          {formatPrice(game.price)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        {isOwned ? (
                          <span className="text-[11px] font-semibold text-neutral-300">
                            In Library
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onAddToCart(game.id)}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                              isInCart
                                ? 'bg-[#262626] text-white ring-1 ring-[#E5192B]'
                                : 'bg-[#E5192B] text-white hover:bg-[#FF2436]'
                            }`}
                          >
                            {isInCart ? (
                              <>
                                <Check className="h-3 w-3 text-[#FF2A3B]" /> In Cart
                              </>
                            ) : (
                              <>
                                <ShoppingBag className="h-3 w-3" /> Add to Cart
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveWishlist(game.id)}
                      aria-label={`Remove ${game.title} from wishlist`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-[#FF2A3B]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
