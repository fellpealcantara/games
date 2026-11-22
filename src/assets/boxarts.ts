// Local retro games boxarts registry bundled with Vite
const boxartModules = import.meta.glob<string>('./images/boxarts/*.{png,jpg}', {
  eager: true,
  import: 'default',
});

const boxartMap = new Map<string, string>();

for (const [path, url] of Object.entries(boxartModules)) {
  // Extract id from path e.g. "./images/boxarts/crash-bandicoot-2.png" -> "crash-bandicoot-2"
  const filename = path.split('/').pop() ?? '';
  const id = filename.replace(/\.(png|jpg)$/, '');
  boxartMap.set(id, url);
}

export function getGameBoxartUrl(gameId: string): string | undefined {
  return boxartMap.get(gameId);
}
