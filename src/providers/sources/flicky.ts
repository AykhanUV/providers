import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

const baseUrl = 'madplay.site';
const headers = {
  referer: 'https://madplay.site/',
  origin: 'https://madplay.site',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const { media } = ctx;
  let url = `https://${baseUrl}/api/playsrc`;

  if (media.type === 'movie') {
    url += `?id=${media.tmdbId}`;
  } else if (media.type === 'show') {
    const { tmdbId, season, episode } = media;
    url += `?id=${tmdbId}&season=${season.number}&episode=${episode.number}`;
  } else {
    throw new NotFoundError('Unsupported media type');
  }

  const res = await ctx.proxiedFetcher(url, { headers });

  if (!Array.isArray(res) || res.length === 0) {
    throw new NotFoundError('No streams found');
  }
  const stream = res[0];

  if (!stream.file) {
    throw new NotFoundError('No file URL found in stream');
  }

  ctx.progress(100);

  return {
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: createM3U8ProxyUrl(stream.file, headers),
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
    embeds: [],
  };
}

export const flickyScraper = makeSourcerer({
  id: 'flicky',
  name: 'Flicky',
  rank: 155,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
