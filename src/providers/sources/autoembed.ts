/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://api2.vidsrc.vip';

// The encoding function from autoembed's hls.js file
// It's a simple reverse and double base64 encode
function encodeId(id: string) {
  return btoa(btoa(id.split('').reverse().join('')));
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const media = ctx.media;
  let path;

  if (media.type === 'movie') {
    path = `movie/${media.tmdbId}`;
  } else {
    // The API requires the TMDB ID, season, and episode number to be encoded together for shows
    const tvId = `${media.tmdbId}-${media.season.number}-${media.episode.number}`;
    path = `tv/${encodeId(tvId)}`;
  }

  const url = `${baseUrl}/${path}`;
  const data = await ctx.proxiedFetcher<any>(url, {
    headers: {
      Referer: 'https://autoembed.pro/',
    },
  });

  // The API returns a JSON object with source URLs. We take the first one.
  const streamUrl = data?.source1;
  if (!streamUrl) throw new NotFoundError('No stream found');

  return {
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

export const autoembedScraper = makeSourcerer({
  id: 'autoembed',
  name: 'Autoembed 🔮',
  rank: 550,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
