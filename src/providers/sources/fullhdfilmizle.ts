import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const fullHDBase = 'https://www.fullhdfilmizlesene.so';

function decodePlayerUrl(encoded: string): string {
  const rot13ed = `${encoded}`.replace(/[a-z]/gi, function rot13Replace(s) {
    return String.fromCharCode(s.charCodeAt(0) + (s.toLowerCase() < 'n' ? 13 : -13));
  });
  return atob(rot13ed);
}

function decodeStreamUrl(encoded: string): string {
  const reversed = encoded.split('').reverse().join('');
  const t = atob(reversed);
  let o = '';
  for (let i = 0; i < t.length; i += 1) {
    const r = 'K9L'[i % 3];
    const n = t.charCodeAt(i) - ((r.charCodeAt(0) % 5) + 1);
    o += String.fromCharCode(n);
  }
  return atob(o);
}

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const imdbId = ctx.media.imdbId;
  if (!imdbId) throw new NotFoundError('IMDB ID not found');

  const searchUrl = `${fullHDBase}/arama/${imdbId}`;
  const searchResult = await ctx.proxiedFetcher<string>(searchUrl, {
    headers: {
      Referer: fullHDBase,
    },
  });

  const $search = load(searchResult);
  const mediaLink = $search('a.tt').attr('href');
  if (!mediaLink) throw new NotFoundError('Could not find media link from search');

  const mediaPage = await ctx.proxiedFetcher<string>(mediaLink, {
    headers: {
      Referer: searchUrl,
    },
  });

  const $media = load(mediaPage);
  const scxVar = $media('script:contains("var scx =")').html();
  if (!scxVar) throw new NotFoundError('Could not find scx variable');

  const scxMatch = scxVar.match(/var scx = (.*?);/);
  if (!scxMatch) throw new NotFoundError('Could not extract scx variable');

  const scxData = JSON.parse(scxMatch[1]);
  const sources = scxData.atom.sx.t;
  if (!sources || sources.length === 0) throw new NotFoundError('No sources found in scx data');

  const playerUrl = decodePlayerUrl(sources[0]);

  const playerPage = await ctx.proxiedFetcher<string>(playerUrl, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Sec-Fetch-Dest': 'iframe',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
      Referer: 'https://www.fullhdfilmizlesene.so/',
    },
  });

  const streamMatch = playerPage.match(/"file": av\('(.*?)'\)/);
  if (!streamMatch) throw new NotFoundError('Could not find encoded stream URL');

  const encodedStream = streamMatch[1];
  const streamUrl = decodeStreamUrl(encodedStream);

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

export const fullhdfilmizleScraper = makeSourcerer({
  id: 'fullhdfilmizle',
  name: 'ALTR 🔵(Turkish)',
  rank: 800,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
});
