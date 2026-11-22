const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/data/games.ts');
let content = fs.readFileSync(filePath, 'utf8');

const ASSET_MAP = {
  // SNES
  'super-mario-world': 'super_mario_world.zip',
  'chrono-trigger': 'chrono_trigger.zip',
  'super-metroid': 'super_metroid.zip',
  'zelda-four-swords': 'zelda_four_swords.zip',
  
  // GBA
  'zelda-minish-cap': 'zelda_minish_cap.zip',
  'pokemon-emerald': 'pokemon_emerald.zip',
  'pokemon-fire-red': 'pokemon_fire_red.zip',
  'metroid-fusion': 'metroid_fusion.zip',
  'castlevania-aria-of-sorrow': 'castlevania_aria_of_sorrow.zip',

  // GBC
  'pokemon-crystal': 'pokemon_crystal.zip',

  // PS1
  'crash-bandicoot-2': 'crash_bandicoot_2.pbp',
  'crash-bandicoot-3': 'crash_bandicoot_3.pbp',
  'megaman-8': 'megaman_8.pbp',
  'marvel-vs-capcom': 'marvel_vs_capcom.pbp',
  'bloody-roar-2': 'bloody_roar_2.pbp',
  'castlevania-sotn': 'castlevania_sotn.pbp',
  'silent-hill-1': 'silent_hill_1.chd',
  'tomb-raider-1': 'tomb_raider_1.chd',
};

for (const [id, asset] of Object.entries(ASSET_MAP)) {
  const url = `/api/roms/v1.0.0/${asset}`;
  const needle = `id: '${id}',`;
  const idx = content.indexOf(needle);
  if (idx === -1) {
    console.warn('Game not found:', id);
    continue;
  }
  const chunk = content.slice(idx, idx + 400);
  if (chunk.includes('romUrl:')) {
    const updatedChunk = chunk.replace(/romUrl:\s*'[^']+',/, `romUrl: '${url}',`);
    content = content.slice(0, idx) + updatedChunk + content.slice(idx + 400);
    console.log(`Updated existing romUrl for ${id} -> ${url}`);
  } else {
    const updatedChunk = chunk.replace(needle, `${needle}\n    romUrl: '${url}',`);
    content = content.slice(0, idx) + updatedChunk + content.slice(idx + 400);
    console.log(`Inserted romUrl for ${id} -> ${url}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Finished updating games.ts successfully!');
