import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const comboScraper = async (ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> => {
  let urlPath;

  if (ctx.media.type === 'movie') {
    urlPath = `/movie/${ctx.media.tmdbId}`;
  } else if (ctx.media.type === 'show') {
    urlPath = `/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  } else {
    throw new Error('Unsupported media type');
  }

  const scrapeUrl = `https://play-right.vercel.app/api/scrape?url=https://vidfast.pro${urlPath}`;

  const networkLog = await ctx.fetcher<any>(scrapeUrl);

  const streamRequest = networkLog.requests.find((req: any) => req.url.includes('.m3u8'));

  if (!streamRequest) {
    throw new NotFoundError('No M3U8 stream found in network requests');
  }

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: streamRequest.url,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
};

export const vidfastScraper = makeSourcerer({
  id: 'vidfast',
  name: 'VidFast 🏎️',
  rank: 200,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
