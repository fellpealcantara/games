import { useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import type { Game } from '../types/store';
import { getGameBoxartUrl } from '../assets/boxarts';

interface GameCoverArtProps {
  game: Game;
  showCardLogo?: boolean;
  className?: string;
}

export function GameCoverArt({
  game,
  className = '',
}: GameCoverArtProps) {
  const [imgError, setImgError] = useState(false);

  const localSrc = getGameBoxartUrl(game.id);
  const imageSrc = !imgError
    ? (localSrc || game.libretroBoxartUrl || game.coverImage)
    : (game.libretroBoxartUrl || game.coverImage);

  if (!imageSrc || imgError) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-[#181818] ${className}`}
      >
        <Gamepad2 className="h-8 w-8 text-neutral-500" aria-hidden="true" />
        <span className="mt-2 px-3 text-center text-xs font-semibold text-neutral-300">
          {game.title}
        </span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={game.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
