#!/usr/bin/env node
const puppeteer = require('puppeteer');
const im = require('imagemagick');
const fs = require('fs');
const { ArgumentParser } = require("argparse");
const ora = require('ora');
const rimraf = require('rimraf');

const config = {
  args: ['--no-sandbox', '--disable-setuid-sandbox']
};

// Parser configuration
const parser = new ArgumentParser({
  version: '0.0.1',
  description: 'Grabs published Google Slides',
});

parser.addArgument('url', { help: 'URL of published Google Slides' });
parser.addArgument(['-o', '--output'], { help: 'Output file', defaultValue: 'slides.pdf' });
parser.addArgument(['--no-pdf'], { help: 'Do not generate PDF', action: 'storeTrue' });

const args = parser.parseArgs();
const [, filename] = args.output.match(/(.+?)(\.[^.]*$|$)/);

if (!fs.existsSync(filename)) fs.mkdirSync(filename);

(async () => {
  const browser = await puppeteer.launch(config);
  const page = await browser.newPage();


  await page.setViewport({ width: 1200, height: 800 });

  let spinner = ora('Opening URL in background (This might take a while)').start()
  await page.goto(args.url, { waitUntil: 'networkidle2', timeout: 0 });
  spinner.succeed();

  let pages = await page.$eval('#\\:w', e => e.getAttribute('aria-setsize'));
  pages = parseFloat(pages);

  await page.evaluate(() => {
    const el = document.querySelector('.punch-viewer-nav-v2.punch-viewer-nav-floating');
    el.remove();
  });

  spinner = ora('Starting slide grabbing').start();
  const el = await page.$('.punch-viewer-content');
  await page.waitFor(1500);

  let i = 1;
  do {
    spinner.text = `Grabbing image of slide ${i}`;
    await el.screenshot({ path: `${filename}/${i}.png` });
    await page.keyboard.press('ArrowRight');
    await page.waitFor(300);

    i++;
  } while (i <= pages);

  await browser.close();
  spinner.succeed('Successfully grabbed slides');

  if (!args['no_pdf']) {
    const files = Array.from({ length: pages }).map((_, i) => `${filename}/${i + 1}.png`);
  
    spinner = ora('Compiling images to PDF').start();
    im.convert([...files, '-quality', '100', `${filename}.pdf`], (err, stdout) => {
      if (err) {
        spinner.fail("Failure to generate PDF");
      } else {
        spinner.succeed("Successfully generated PDF");
        rimraf.sync(filename);
      }
    });
  }
})();
