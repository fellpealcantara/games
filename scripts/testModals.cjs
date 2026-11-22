const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    headless: 'new',
    defaultViewport: { width: 1920, height: 1080 }
  });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/?mode=streaming', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  // 1. Click on the 2nd title in the grid (Velocidade e Paixão - a Movie)
  const buttons = await page.$$('button[aria-label^="Abrir"]');
  console.log(`Found ${buttons.length} open buttons`);
  
  if (buttons.length > 1) {
    await buttons[1].click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:\\Users\\alcan\\.gemini\\antigravity\\brain\\b72b85e2-e5ba-4740-a36b-dd234b08a20e\\screenshot_detail_movie.png' });
    
    // Close modal
    const closeBtn = await page.$('button[aria-label="Fechar detalhes"]');
    if (closeBtn) await closeBtn.click();
    await new Promise(r => setTimeout(r, 500));
  }

  // 2. Click on the 1st title (Arcanjo Renegado - a Series)
  const buttonsAfter = await page.$$('button[aria-label^="Abrir"]');
  if (buttonsAfter.length > 0) {
    await buttonsAfter[0].click();
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: 'C:\\Users\\alcan\\.gemini\\antigravity\\brain\\b72b85e2-e5ba-4740-a36b-dd234b08a20e\\screenshot_detail_series.png' });

    // 3. Click Assistir to see the video player
    const playBtn = await page.$('button[class*="bg-[#E5192B]"]');
    if (playBtn) {
      await playBtn.click();
      await new Promise(r => setTimeout(r, 1500));
      await page.screenshot({ path: 'C:\\Users\\alcan\\.gemini\\antigravity\\brain\\b72b85e2-e5ba-4740-a36b-dd234b08a20e\\screenshot_player_screen.png' });
    }
  }

  await browser.close();
  console.log('Finished capturing all verification screenshots!');
})();
