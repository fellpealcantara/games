import https from 'node:https';

export default async function handler(req, res) {
  // Global CORS headers for EmulatorJS and browser fetch
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const file = req.query.file || (req.url ? req.url.replace(/^\/api\/roms?\/?/, '').split('?')[0] : '');
  if (!file) {
    return res.status(400).json({ error: 'Missing file parameter' });
  }

  const cleanFile = Array.isArray(file) ? file.join('/') : file.replace(/^\/+/, '');
  const targetUrl = `https://github.com/fellpealcantara/games/releases/download/${cleanFile}`;

  function fetchWithRedirect(url, redirectCount = 0) {
    if (redirectCount > 5) {
      return res.status(500).json({ error: 'Too many redirects' });
    }

    https
      .get(url, { headers: { 'User-Agent': 'PlayEntertainmentPlatform/1.0' } }, (remoteRes) => {
        if (remoteRes.statusCode === 301 || remoteRes.statusCode === 302) {
          const redirectUrl = remoteRes.headers.location;
          if (!redirectUrl) {
            return res.status(500).json({ error: 'Redirect without location' });
          }
          return fetchWithRedirect(redirectUrl, redirectCount + 1);
        }

        if (remoteRes.statusCode !== 200) {
          return res
            .status(remoteRes.statusCode || 500)
            .json({ error: `Upstream returned status ${remoteRes.statusCode}` });
        }

        res.setHeader('Content-Type', remoteRes.headers['content-type'] || 'application/octet-stream');
        if (remoteRes.headers['content-length']) {
          res.setHeader('Content-Length', remoteRes.headers['content-length']);
        }
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.status(200);

        remoteRes.pipe(res);
      })
      .on('error', (err) => {
        res.status(500).json({ error: err.message });
      });
  }

  fetchWithRedirect(targetUrl);
}
