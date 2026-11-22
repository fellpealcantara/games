async function inspectVercel() {
  try {
    const res = await fetch('https://felipealcantara.vercel.app/');
    const html = await res.text();
    console.log('Status:', res.status, 'HTML length:', html.length);
    console.log('Head slice:', html.slice(0, 1500));
    
    // Search for any links or assets
    const regex = /(?:src|href|url)=["']([^"']+)["']/gi;
    let match;
    const urls = [];
    while ((match = regex.exec(html)) !== null) {
      urls.push(match[1]);
    }
    console.log('Found URLs:', urls);
  } catch (e) {
    console.error('Error:', e);
  }
}
inspectVercel();
