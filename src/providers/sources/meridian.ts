import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { labelToLanguageCode, removeDuplicatedLanguages } from '@/providers/captions';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

const baseUrl = 'https://movies4f.com';

async function getTokens(ctx: ShowScrapeContext | MovieScrapeContext, iframeUrl: string, videoId: string) {
  const boundary = '----geckoformboundaryc5f480bcac13a77346dab33881da6bfb';
  const requestBody = [
    `--${boundary}`,
    'Content-Disposition: form-data; name="renderer"',
    '',
    'ANGLE (NVIDIA, NVIDIA GeForce GTX 980 Direct3D11 vs_5_0 ps_5_0), or similar',
    `--${boundary}`,
    'Content-Disposition: form-data; name="id"',
    '',
    '6164426f797cf4b2fe93e4b20c0a4338',
    `--${boundary}`,
    'Content-Disposition: form-data; name="videoId"',
    '',
    videoId,
    `--${boundary}`,
    'Content-Disposition: form-data; name="domain"',
    '',
    'https://movies4f.com/',
    `--${boundary}--`,
  ].join('\r\n');

  const tokenData = await ctx.proxiedFetcher<string>('/geturl', {
    baseUrl: 'https://moviking.childish2x2.fun',
    method: 'POST',
    headers: {
      Accept: '*/*',
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      Origin: 'https://moviking.childish2x2.fun',
      Referer: iframeUrl,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: requestBody,
  });

  const params = new URLSearchParams(tokenData);
  const token1 = params.get('token1');
  const token3 = params.get('token3');

  if (!token1 || !token3) {
    throw new NotFoundError('Could not retrieve tokens');
  }

  return {
    token1,
    token2: params.get('token2'),
    token3,
  };
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const searchResults = await ctx.proxiedFetcher<string>(`/search?q=${encodeURIComponent(ctx.media.title)}`, {
    baseUrl,
  });

  const $search = load(searchResults);
  const searchItems = $search('.col');

  let foundUrl: string | null = null;

  for (const item of searchItems.toArray()) {
    const $item = $search(item);
    const title = $item.find('h3.card-title').text().trim();
    const mediaTitle = ctx.media.title.toLowerCase();
    const season = ctx.media.type === 'show' ? ctx.media.season.number : -1;

    if (ctx.media.type === 'movie' && title.toLowerCase() === mediaTitle) {
      const path = $item.find('a.poster').attr('href');
      if (path) {
        foundUrl = `${baseUrl}${path}`;
        break;
      }
    } else if (ctx.media.type === 'show' && title.toLowerCase() === `${mediaTitle} season ${season}`) {
      const path = $item.find('a.poster').attr('href');
      if (path) {
        foundUrl = `${baseUrl}${path}`;
        break;
      }
    }
  }

  if (!foundUrl) {
    throw new NotFoundError('Movie or series not found');
  }

  if (ctx.media.type === 'show') {
    const episodeNumber = ctx.media.episode.number;
    const seasonPage = await ctx.proxiedFetcher<string>(foundUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
      },
    });
    const $seasonPage = load(seasonPage);
    const episodeLinks = $seasonPage('a[href*="/episode-"]');
    const episodeAncher = episodeLinks.filter((i, el) => {
      const href = $seasonPage(el).attr('href');
      if (!href) return false;
      return href.endsWith(`/episode-${episodeNumber}`);
    });

    const episodePath = episodeAncher.attr('href');
    if (!episodePath) throw new NotFoundError('Episode not found on season page');
    foundUrl = `${baseUrl}${episodePath}`;
  }

  const moviePage = await ctx.proxiedFetcher<string>(foundUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
    },
  });
  const $movie = load(moviePage);
  const iframeUrl = $movie('iframe#iframeStream').attr('src');

  if (!iframeUrl) {
    throw new NotFoundError('Could not find embed iframe');
  }

  const videoId = new URL(iframeUrl).searchParams.get('id');
  if (!videoId) {
    throw new NotFoundError('Could not find videoId');
  }

  let tokens;
  for (let i = 0; i < 3; i += 1) {
    try {
      tokens = await getTokens(ctx, iframeUrl, videoId);
      break;
    } catch (err) {
      if (err instanceof NotFoundError && err.message === 'Could not retrieve tokens' && i < 2) {
        continue;
      }
      throw err;
    }
  }

  if (!tokens) {
    throw new NotFoundError('Could not retrieve tokens after 3 attempts');
  }

  const { token1, token2, token3 } = tokens;

  const cdnDomain = ctx.media.type === 'movie' ? 'https://cdn.bald241.site' : 'https://cdn.ketquaxoso.icu';
  const cdnDomain2 = ctx.media.type === 'movie' ? 'https://cdn2.bald241.site' : 'https://cdn.ketquaxoso.icu';

  const streamUrl = `${cdnDomain}/segment/${videoId}/?token1=${token1}&token3=${token3}`;

  const streamingPage = await ctx.proxiedFetcher<string>(
    `/streaming?id=${videoId}&web=movies4f.com&token1=${token1}&token2=${token2}&token3=${token3}&cdn=${cdnDomain2}&lang=en`,
    {
      baseUrl: cdnDomain2,
      headers: {
        Referer: 'https://moviking.childish2x2.fun/',
      },
    },
  );

  const tracksMatch = streamingPage.match(/tracks: (\[.*?\])/);
  if (!tracksMatch) {
    throw new NotFoundError('Could not find tracks');
  }

  const tracks = JSON.parse(tracksMatch[1]);
  let captions = tracks
    .map((track: any) => {
      const language = labelToLanguageCode(track.label);
      if (!language) return null;
      return {
        id: track.file,
        url: track.file.replace('https://cdn.bald241.site', cdnDomain),
        type: 'vtt',
        language,
        hasCorsRestrictions: true,
      };
    })
    .filter((x: any) => x !== null);

  captions = removeDuplicatedLanguages(captions);

  return {
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: createM3U8ProxyUrl(streamUrl, {
          Origin: cdnDomain,
          Referer: `${cdnDomain}/`,
        }),
        flags: [flags.CORS_ALLOWED],
        captions,
      },
    ],
    embeds: [],
  };
}

export const meridianScraper = makeSourcerer({
  id: 'meridian',
  name: 'Meridian 🪐',
  rank: 900,
  flags: [flags.CORS_ALLOWED],
  disabled: false,
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
