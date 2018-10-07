const puppeteer = require('puppeteer');

const SLIDES = 73;
const URL = 'https://docs.google.com/presentation/d/e/2PACX-1vSiTALGQReVaqVzgssiRu7Q8h--j1M7lrbFBiBoRJLmL0AyldAcdtKQR1lmXxaY1IdlFFMOxFfHu8KJ/pub?start=false&loop=false&delayms=3000';

const config = {
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  //headless: false,
};

(async () => {
  const browser = await puppeteer.launch(config);
  const page = await browser.newPage();


  await page.setViewport({ width: 1200, height: 800 });

  console.log('Opening URL (This might take a while depending on your internet connection)');
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 0 });
  console.log('Successfully loaded URL');

  console.log('Starting slide grabbing');
  const el = await page.$('.punch-viewer-content');
  await page.waitFor(1500);

  let i = 1;
  do {
    console.log(`Taking screenshot for slide ${i}`);
    await el.screenshot({ path: `screenshots/${i}.png` });
    await page.keyboard.press('ArrowRight');
    await page.waitFor(300);

    i++;
  } while (i <= SLIDES);

  await browser.close();
  console.log('Successfully grabbed slides');
})();
