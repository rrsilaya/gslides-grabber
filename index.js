const puppeteer = require('puppeteer');
const im = require('imagemagick');
const fs = require('fs');

const SLIDES = 73;
const URL = 'https://docs.google.com/presentation/d/e/2PACX-1vSiTALGQReVaqVzgssiRu7Q8h--j1M7lrbFBiBoRJLmL0AyldAcdtKQR1lmXxaY1IdlFFMOxFfHu8KJ/pub?start=false&loop=false&delayms=3000';
const DIRECTORY = 'screenshots';

const config = {
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
  //headless: false,
};

if (!fs.existsSync(DIRECTORY)) fs.mkdirSync(DIRECTORY);

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
    await el.screenshot({ path: `${DIRECTORY}/${i}.png` });
    await page.keyboard.press('ArrowRight');
    await page.waitFor(300);

    i++;
  } while (i <= SLIDES);

  await browser.close();
  console.log('Successfully grabbed slides');

  const files = Array.from({ length: SLIDES }).map((_, i) => `${DIRECTORY}/${i + 1}.png`);

  console.log('Compiling images to PDF');
  im.convert([...files, '-quality', '100', `${DIRECTORY}/slides.pdf`], (err, stdout) => {
    if (err) console.log('Failure to generate PDF');
    console.log(stdout);
  });

})();
