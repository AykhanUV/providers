import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl, getM3U8ProxyUrl } from '@/utils/proxy';

const baseUrl = 'https://mappletv.uk';

const universalHeaders = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  Connection: 'keep-alive',
  Host: 'mappletv.uk',
  Priority: 'u=0, i',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
};

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaType = ctx.media.type;
  const tmdbId = ctx.media.tmdbId;

  let url = '';
  if (mediaType === 'movie') {
    url = `${baseUrl}/watch/movie/${tmdbId}`;
  } else {
    url = `${baseUrl}/watch/tv/${tmdbId}-${ctx.media.season.number}-${ctx.media.episode.number}`;
  }

  const page = await ctx.proxiedFetcher<string>(url, {
    headers: universalHeaders,
  });

  const videoUrlMatch = page.match(/videoUrl\\":\\"([^"]+)\\"/);
  if (!videoUrlMatch) {
    throw new NotFoundError('Could not find videoUrl in page');
  }
  const videoUrl = videoUrlMatch[1];

  const streamHeaders = {
    'Accept-Language': 'en-GB,en;q=0.6',
    Connection: 'keep-alive',
    Host: 'soup.mapple.cc',
    Origin: 'https://mappletv.uk',
    Referer: 'https://mappletv.uk/',
    'sec-ch-ua-mobile': '?0',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-GPC': '1',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
  };

  return {
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: createM3U8ProxyUrl(videoUrl, streamHeaders),
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
    embeds: [],
  };
}

export const mappleTvScraper = makeSourcerer({
  id: 'mappletv',
  name: 'Mapple 🍃',
  rank: 885,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
