/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://api2.vidsrc.vip';

// The encoding logic from autoembed's hls.js file.
// It maps digits to letters for movies, then reverses and double-base64 encodes.
function digitToLetterMap(digit: string): string {
  const map = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
  return map[parseInt(digit, 10)];
}

function encodeId(id: string) {
  return btoa(btoa(id.split('').reverse().join('')));
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const media = ctx.media;
  let path;

  if (media.type === 'movie') {
    const movieId = media.tmdbId.split('').map(digitToLetterMap).join('');
    path = `movie/${encodeId(movieId)}`;
  } else {
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
  const streamUrl = data?.source1?.url;
  if (!streamUrl) throw new NotFoundError('No stream found');

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

export const autoembedScraper = makeSourcerer({
  id: 'autoembed',
  name: 'Autoembed 🔮',
  rank: 550,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
