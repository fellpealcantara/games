const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/data/games.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Mapping of game id to asset filename in GitHub release v1.0.0
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
  const romUrl = `/api/roms/v1.0.0/${asset}`;
  
  // Find the block for this game
  const idRegex = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?romFilename:\\s*'[^']+',)`);
  if (idRegex.test(content)) {
    // Check if romUrl already exists
    const romUrlRegex = new RegExp(`(id:\\s*'${id}',[\\s\\S]*?romUrl:\\s*'[^']+',)`);
    if (romUrlRegex.test(content)) {
      content = content.replace(romUrlRegex, (m, p1) => {
        return p1.replace(/romUrl:\s*'[^']+',/, `romUrl: '${romUrl}',`);
      });
    } else {
      content = content.replace(idRegex, `$1\n    romUrl: '${romUrl}',`);
    }
    console.log(`Updated ${id} -> ${romUrl}`);
  } else {
    console.warn(`Could not find block for ${id}`);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated src/data/games.ts with GitHub Release ROM URLs!');
