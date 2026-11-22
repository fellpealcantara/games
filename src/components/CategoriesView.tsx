import type { Game, GameCategory, SortOption, StoreFilter } from '../types/store';
import { GameCard } from './GameCard';

interface CategoriesViewProps {
  games: Game[];
  filter: StoreFilter;
  onFilterChange: (next: StoreFilter) => void;
  cartIds: string[];
  libraryIds: string[];
  onSelectGame: (game: Game) => void;
  onQuickAddCart: (gameId: string) => void;
  onResetFilters: () => void;
  onPlayGame?: (game: Game) => void;
}

const CATEGORIES: GameCategory[] = [
  'All',
  'PS1',
  'Game Boy',
  'SNES',
  'CS 1.6',
  'Action',
  'RPG',
  'Adventure',
];

export function CategoriesView({
  games,
  filter,
  onFilterChange,
  cartIds,
  libraryIds,
  onSelectGame,
  onQuickAddCart,
  onResetFilters,
  onPlayGame,
}: CategoriesViewProps) {
  return (
    <section aria-label="Navegar por categorias" className="space-y-6 select-none">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Consoles & Categorias</h1>
          <p className="mt-1 text-xs text-neutral-400">
            Explore {games.length} {games.length === 1 ? 'jogo' : 'jogos'} prontos para jogar
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="category-sort" className="text-xs text-neutral-400">
            Ordenar:
          </label>
          <select
            id="category-sort"
            value={filter.sortBy}
            onChange={(e) =>
              onFilterChange({ ...filter, sortBy: e.target.value as SortOption })
            }
            className="rounded-xl border border-white/10 bg-[#161616] px-3 py-2 text-xs font-medium text-white focus:border-[#E5192B] focus:outline-none"
          >
            <option value="featured">Destaques</option>
            <option value="name">Nome (A-Z)</option>
            <option value="rating">Melhor Avaliados</option>
            <option value="size">Tamanho do Arquivo</option>
          </select>
        </div>
      </div>

      {/* Console and Genre Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive = filter.category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onFilterChange({ ...filter, category: cat })}
              className={`rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'bg-[#E5192B] text-white'
                  : 'bg-[#181818] text-neutral-400 hover:bg-[#222222] hover:text-white'
              }`}
            >
              {cat === 'All' ? 'Todos os Jogos' : cat}
            </button>
          );
        })}
      </div>

      {/* Grid of Games */}
      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#141414] px-6 py-16 text-center">
          <p className="text-sm font-semibold text-white">Nenhum jogo encontrado nesta categoria</p>
          <p className="mt-1 text-xs text-neutral-400">
            Tente selecionar outro console ou limpar os filtros.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 rounded-xl bg-[#E5192B] px-5 py-2 text-xs font-semibold text-white hover:bg-[#FF2436]"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 min-[2100px]:grid-cols-8 min-[2500px]:grid-cols-9 min-[3000px]:grid-cols-11 min-[3400px]:grid-cols-12">
          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isInCart={cartIds.includes(game.id)}
              isOwned={libraryIds.includes(game.id)}
              onSelectGame={onSelectGame}
              onPlayGame={onPlayGame}
              onQuickAddCart={onQuickAddCart}
            />
          ))}
        </div>
      )}
    </section>
  );
}
