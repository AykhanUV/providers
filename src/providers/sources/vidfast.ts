import puppeteer from 'puppeteer';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const DOMAIN = 'https://vidfast.pro';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  let url = `${DOMAIN}/movie/${ctx.media.tmdbId}`;
  if (ctx.media.type === 'show') {
    url = `${DOMAIN}/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const streamUrl = await new Promise<string>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new NotFoundError('Timeout while waiting for stream'));
    }, 20000); // 20 second timeout

    page.on('response', (res) => {
      const resUrl = res.url();
      if (resUrl.includes('hexawave3.xyz') && resUrl.endsWith('.m3u8')) {
        clearTimeout(timeout);
        resolve(resUrl);
      }
    });

    page.goto(url).catch((err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });

  await browser.close();

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: streamUrl,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const vidfastScraper = makeSourcerer({
  id: 'vidfast',
  name: 'VidFast',
  rank: 145,
  // disabled: true,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
