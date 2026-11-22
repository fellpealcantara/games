import { useState } from 'react';
import { CheckCircle2, ShoppingBag, Trash2, X } from 'lucide-react';
import type { Game } from '../types/store';
import { calculateCartTotals, formatPrice } from '../utils/storeLogic';
import { GameCoverArt } from './GameCoverArt';

interface CartDrawerProps {
  open: boolean;
  cartIds: string[];
  games: Game[];
  onClose: () => void;
  onRemoveItem: (gameId: string) => void;
  onCheckout: () => void;
  onGoToLibrary: () => void;
}

export function CartDrawer({
  open,
  cartIds,
  games,
  onClose,
  onRemoveItem,
  onCheckout,
  onGoToLibrary,
}: CartDrawerProps) {
  const [orderCompleted, setOrderCompleted] = useState<{
    count: number;
    total: number;
    orderNumber: string;
  } | null>(null);

  if (!open) return null;

  const totals = calculateCartTotals(cartIds, games);

  const handleCheckout = () => {
    if (totals.count === 0) return;
    const summary = {
      count: totals.count,
      total: totals.subtotal,
      orderNumber: `PG-${Math.floor(100000 + Math.random() * 900000)}`,
    };
    onCheckout();
    setOrderCompleted(summary);
  };

  const handleClose = () => {
    setOrderCompleted(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Cart"
      onClick={handleClose}
    >
      <div
        className="flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#121212] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-5">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="h-5 w-5 text-[#FF2A3B]" aria-hidden="true" />
            <h2 className="text-base font-bold text-white">
              Shopping Cart ({totals.count})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close shopping cart"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 store-scroll">
          {orderCompleted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E5192B]/15 text-[#FF2A3B]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">Purchase Confirmed</h3>
              <p className="mt-1.5 text-xs text-neutral-400">
                Order #{orderCompleted.orderNumber} · {orderCompleted.count}{' '}
                {orderCompleted.count === 1 ? 'game' : 'games'} added to My Library
              </p>
              <p className="mt-2 text-sm font-bold text-white tabular-nums">
                Total Paid: {formatPrice(orderCompleted.total)}
              </p>
              <button
                type="button"
                onClick={() => {
                  setOrderCompleted(null);
                  onClose();
                  onGoToLibrary();
                }}
                className="mt-6 rounded-xl bg-[#E5192B] px-6 py-2.5 text-xs font-bold text-white hover:bg-[#FF2436]"
              >
                Open My Library
              </button>
            </div>
          ) : totals.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-10 w-10 text-neutral-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-white">Your cart is empty</p>
              <p className="mt-1 text-xs text-neutral-400">
                Add discounted titles or pre-orders from the storefront.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {totals.items.map((game) => (
                <li
                  key={game.id}
                  className="flex items-center gap-3.5 rounded-2xl bg-[#1A1A1A] p-3 ring-1 ring-white/[0.06]"
                >
                  <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                    <GameCoverArt game={game} className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-white">
                      {game.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-neutral-400">
                      {game.edition} · {game.category}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 tabular-nums">
                      {game.discountPercent > 0 && (
                        <span className="rounded bg-[#E5192B] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          -{game.discountPercent}%
                        </span>
                      )}
                      {game.discountPercent > 0 && (
                        <span className="text-[11px] text-neutral-500 line-through">
                          {formatPrice(game.originalPrice)}
                        </span>
                      )}
                      <span className="text-xs font-bold text-white">
                        {formatPrice(game.price)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(game.id)}
                    aria-label={`Remove ${game.title} from cart`}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-white/10 hover:text-[#FF2A3B]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer Totals */}
        {!orderCompleted && totals.items.length > 0 && (
          <div className="border-t border-white/[0.08] bg-[#161616] p-6 space-y-4">
            <div className="space-y-2 text-xs tabular-nums">
              <div className="flex items-center justify-between text-neutral-400">
                <span>Original price</span>
                <span>{formatPrice(totals.originalTotal)}</span>
              </div>
              {totals.totalSavings > 0 && (
                <div className="flex items-center justify-between text-[#FF2A3B]">
                  <span>Discount savings</span>
                  <span>-{formatPrice(totals.totalSavings)}</span>
                </div>
              )}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-2.5 text-sm font-bold text-white">
                <span>Subtotal</span>
                <span>{formatPrice(totals.subtotal)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full rounded-xl bg-[#E5192B] py-3 text-xs font-bold text-white transition-colors hover:bg-[#FF2436]"
            >
              Complete Purchase · {formatPrice(totals.subtotal)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
