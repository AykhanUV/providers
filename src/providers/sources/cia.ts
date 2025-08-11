import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const getUserToken = (): string | null => {
  return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NDI5OTc4MTksIm5iZiI6MTc0Mjk5NzgxOSwiZXhwIjoxNzc0MTAxODM5LCJkYXRhIjp7InVpZCI6Njk2MzU5LCJ0b2tlbiI6IjUzNmNiZjI2NzA0Zjk4MjAxMjBiYjY4OTRlNjBmMmI2In19.RC8T4zyxxikVtuuEIxbYhYK8T_REhIcnC8AYzoS3jKY';
};

const getRegion = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const regionData = window.localStorage.getItem('__MW::region');
    if (!regionData) return null;
    const parsed = JSON.parse(regionData);
    return parsed?.state?.region ?? null;
  } catch (err) {
    console.warn('Unable to access localStorage or parse auth data:', err);
    return null;
  }
};

const getBaseUrl = (): string => {
  const region = getRegion();
  switch (region) {
    case 'us-east':
      return 'https://febbox.andresdev.org';
    case 'us-west':
      return 'https://febbox.andresdev.org';
    case 'south-america':
      return 'https://febbox2.andresdev.org';
    case 'asia':
      return 'https://febbox2.andresdev.org';
    case 'europe':
      return 'https://febbox2.andresdev.org';
    default:
      return 'https://febbox.andresdev.org';
  }
};

const BASE_URL = getBaseUrl();

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const userToken = getUserToken();
  if (!userToken) throw new NotFoundError('Requires a user token!');

  const url =
    ctx.media.type === 'movie'
      ? `${BASE_URL}/movie/${ctx.media.tmdbId}`
      : `${BASE_URL}/tv/${ctx.media.tmdbId}/season/${ctx.media.season.number}/episode/${ctx.media.episode.number}`;

  const headers: Record<string, string> = {
    Origin: 'https://pstream.mov',
    Referer: 'https://pstream.mov',
  };
  headers['ui-token'] = userToken;

  const data = await ctx.proxiedFetcher<any>(url, {
    headers,
  });

  if (data?.error && data.error.startsWith('No results found')) {
    throw new NotFoundError('No stream found');
  }
  if (data?.error === 'No cached data found for this episode') {
    throw new NotFoundError('No stream found');
  }
  if (data?.error === 'No cached data found for this ID') {
    throw new NotFoundError('No stream found');
  }
  if (!data) throw new NotFoundError('No response from API');

  ctx.progress(50);

  if (!data.sources || !Array.isArray(data.sources) || data.sources.length === 0) {
    throw new NotFoundError('No streams data found in response');
  }

  const streams = data.sources.reduce((acc: Record<string, string>, source: any) => {
    const qualityLabel = source.label;
    const fileUrl = source.file;

    if (fileUrl.includes('/video/vip_only.mp4')) {
      return acc;
    }

    let qualityKey: number;
    if (qualityLabel === 'ORG[HDR]' || qualityLabel === 'ORG') {
      if (fileUrl.split('?')[0].toLowerCase().endsWith('.mp4')) {
        acc.unknown = fileUrl;
      }
      return acc;
    }
    if (qualityLabel === '4K') {
      qualityKey = 2160;
    } else {
      qualityKey = parseInt(qualityLabel.replace('P', ''), 10);
    }
    if (Number.isNaN(qualityKey) || acc[qualityKey]) return acc;
    acc[qualityKey] = fileUrl;
    return acc;
  }, {});

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        captions: [],
        qualities: {
          ...(streams[2160] && {
            '4k': {
              type: 'mp4',
              url: streams[2160],
            },
          }),
          ...(streams[1080] && {
            '1080': {
              type: 'mp4',
              url: streams[1080],
            },
          }),
          ...(streams[720] && {
            '720': {
              type: 'mp4',
              url: streams[720],
            },
          }),
          ...(streams[480] && {
            '480': {
              type: 'mp4',
              url: streams[480],
            },
          }),
          ...(streams[360] && {
            '360': {
              type: 'mp4',
              url: streams[360],
            },
          }),
          ...(streams.unknown && {
            unknown: {
              type: 'mp4',
              url: streams.unknown,
            },
          }),
        },
        type: 'file',
        flags: [flags.CORS_ALLOWED],
      },
    ],
  };
}

export const ciaapiScraper = makeSourcerer({
  id: 'cia-api',
  name: 'CIA API (4K) 🔥',
  rank: 890,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
