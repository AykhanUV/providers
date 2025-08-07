import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const CDN_HOSTNAME = 'download.fedsr.us';

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const media = ctx.media;
  let path;

  if (media.type === 'movie') {
    path = `/media/${media.tmdbId}/master.m3u8`;
  } else if (media.type === 'show') {
    path = `/media/${media.tmdbId}-${media.season.number}-${media.episode.number}/master.m3u8`;
  } else {
    throw new NotFoundError('Unsupported media type');
  }

  const url = `https://${CDN_HOSTNAME}${path}`;

  const res = await ctx.proxiedFetcher.full(url, {
    method: 'HEAD',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    },
  });

  if (res.statusCode !== 200) throw new NotFoundError('stream not found');

  ctx.progress(100);

  return {
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: url,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
    embeds: [],
  };
}

export const vidsrccxScraper = makeSourcerer({
  id: 'vidsrccx',
  name: 'VidSrc 🏐',
  disabled: true,
  rank: 173,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
});
