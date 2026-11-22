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

async function uploadAsset(filePath, assetName) {
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return null;
  }
  const stat = fs.statSync(filePath);
  console.log(`Uploading ${assetName} (${(stat.size / 1024 / 1024).toFixed(2)} MB)...`);

  const uploadUrl = `https://uploads.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${RELEASE_ID}/assets?name=${encodeURIComponent(assetName)}`;
  const fileStream = fs.createReadStream(filePath);

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent': 'PlayPlatform',
      'Content-Type': 'application/octet-stream',
      'Content-Length': stat.size.toString(),
    },
    body: fs.readFileSync(filePath), // or fileStream
    duplex: 'half',
  });

  if (res.status === 201) {
    const data = await res.json();
    console.log(`Success: ${assetName} -> ${data.browser_download_url}`);
    return data.browser_download_url;
  } else {
    const errText = await res.text();
    console.error(`Failed ${assetName}: HTTP ${res.status} - ${errText}`);
    return null;
  }
}

async function run() {
  // Test upload Super Mario World
  await uploadAsset(
    'D:\\R36S\\EASYROMS\\snes\\Super Mario World (USA).zip',
    'super_mario_world.zip'
  );
  // Test upload Chrono Trigger
  await uploadAsset(
    'D:\\R36S\\EASYROMS\\snes\\Chrono Trigger (USA).zip',
    'chrono_trigger.zip'
  );
}

run();
