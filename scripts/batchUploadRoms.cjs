const fs = require('fs');
const path = require('path');

function getGitHubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    const { execSync } = require('child_process');
    const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n' }).toString();
    const match = creds.match(/password=(.+)/);
    return match ? match[1].trim() : '';
  } catch {
    return '';
  }
}

const TOKEN = getGitHubToken();
const REPO_OWNER = 'fellpealcantara';
const REPO_NAME = 'games';
const RELEASE_ID = 454070874;

// Catalog mapping of local ROM files to GitHub Release asset filenames
const ROM_TARGETS = [
  // SNES
  {
    id: 'super-mario-world',
    file: 'D:\\R36S\\EASYROMS\\snes\\Super Mario World (USA).zip',
    asset: 'super_mario_world.zip',
  },
  {
    id: 'chrono-trigger',
    file: 'D:\\R36S\\EASYROMS\\snes\\Chrono Trigger (USA).zip',
    asset: 'chrono_trigger.zip',
  },
  {
    id: 'super-metroid',
    file: 'D:\\R36S\\EASYROMS\\snes\\Super Metroid (Japan, USA) (En,Ja).zip',
    asset: 'super_metroid.zip',
  },
  // GBA
  {
    id: 'zelda-minish-cap',
    file: 'D:\\R36S\\EASYROMS\\gba\\Legend of Zelda, The - The Minish Cap (USA).zip',
    asset: 'zelda_minish_cap.zip',
  },
  {
    id: 'zelda-four-swords',
    file: 'D:\\R36S\\EASYROMS\\gba\\Legend of Zelda, The - A Link to the Past & Four Swords (USA, Australia).zip',
    asset: 'zelda_four_swords.zip',
  },
  {
    id: 'pokemon-emerald',
    file: 'D:\\R36S\\EASYROMS\\gba\\Pokemon - Emerald Version (USA, Europe).zip',
    asset: 'pokemon_emerald.zip',
  },
  {
    id: 'pokemon-fire-red',
    file: 'D:\\R36S\\EASYROMS\\gba\\Pokemon - FireRed Version (USA).zip',
    asset: 'pokemon_fire_red.zip',
  },
  {
    id: 'metroid-fusion',
    file: 'D:\\R36S\\EASYROMS\\gba\\Metroid Fusion (USA, Australia).zip',
    asset: 'metroid_fusion.zip',
  },
  {
    id: 'castlevania-aria-of-sorrow',
    file: 'D:\\R36S\\EASYROMS\\gba\\Castlevania - Aria of Sorrow (USA).zip',
    asset: 'castlevania_aria_of_sorrow.zip',
  },
  // GBC
  {
    id: 'pokemon-crystal',
    file: 'D:\\R36S\\EASYROMS\\gbc\\Pokemon - Crystal Version (USA, Europe) (Rev A).zip',
    asset: 'pokemon_crystal.zip',
  },
  // PS1 (PBP / CHD compact formats)
  {
    id: 'crash-bandicoot-2',
    file: 'D:\\R36S\\EASYROMS\\psx\\Crash Bandicoot 2 - Cortex Strikes Back.PBP',
    asset: 'crash_bandicoot_2.pbp',
  },
  {
    id: 'crash-bandicoot-3',
    file: 'D:\\R36S\\EASYROMS\\psx\\Crash Bandicoot 3 - Warped.PBP',
    asset: 'crash_bandicoot_3.pbp',
  },
  {
    id: 'megaman-8',
    file: 'D:\\R36S\\EASYROMS\\psx\\MegaMan 8.PBP',
    asset: 'megaman_8.pbp',
  },
  {
    id: 'marvel-vs-capcom',
    file: 'D:\\R36S\\EASYROMS\\psx\\Marvel vs. Capcom - Clash of the Super Heroes.PBP',
    asset: 'marvel_vs_capcom.pbp',
  },
  {
    id: 'bloody-roar-2',
    file: 'D:\\R36S\\EASYROMS\\psx\\Bloody Roar II.PBP',
    asset: 'bloody_roar_2.pbp',
  },
  {
    id: 'castlevania-sotn',
    file: 'D:\\R36S\\EASYROMS\\psx\\Castlevania - Symphony of the Night.PBP',
    asset: 'castlevania_sotn.pbp',
  },
  {
    id: 'silent-hill-1',
    file: 'D:\\R36S\\EASYROMS\\psx\\Silent Hill 1.chd',
    asset: 'silent_hill_1.chd',
  },
  {
    id: 'tomb-raider-1',
    file: 'D:\\R36S\\EASYROMS\\psx\\Tomb Raider I.chd',
    asset: 'tomb_raider_1.chd',
  },
];

async function getExistingAssets() {
  const res = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${RELEASE_ID}/assets?per_page=100`,
    {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'User-Agent': 'PlayPlatform',
      },
    }
  );
  if (!res.ok) return [];
  const assets = await res.json();
  return assets.map((a) => a.name);
}

async function uploadAsset(filePath, assetName) {
  if (!fs.existsSync(filePath)) {
    console.error(`Local file not found: ${filePath}`);
    return null;
  }
  const stat = fs.statSync(filePath);
  const sizeMb = (stat.size / 1024 / 1024).toFixed(2);
  console.log(`[START] Uploading ${assetName} (${sizeMb} MB)...`);

  const uploadUrl = `https://uploads.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${RELEASE_ID}/assets?name=${encodeURIComponent(assetName)}`;
  const buffer = fs.readFileSync(filePath);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent': 'PlayPlatform',
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size.toString(),
    },
    body: buffer,
    duplex: 'half',
  });

  if (res.status === 201) {
    const data = await res.json();
    console.log(`[SUCCESS] ${assetName} uploaded -> ${data.browser_download_url}`);
    return data.browser_download_url;
  } else {
    const errText = await res.text();
    console.error(`[ERROR] Failed ${assetName}: HTTP ${res.status} - ${errText}`);
    return null;
  }
}

async function main() {
  const existing = await getExistingAssets();
  console.log(`Existing assets in release (${existing.length}):`, existing.join(', '));

  for (const item of ROM_TARGETS) {
    if (existing.includes(item.asset)) {
      console.log(`[SKIP] ${item.asset} already uploaded.`);
      continue;
    }
    await uploadAsset(item.file, item.asset);
  }

  console.log('\nAll batch uploads completed!');
}

main();
