import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { labelToLanguageCode } from '@/providers/captions';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const getUserToken = (): string | null => {
  try {
    if (typeof window === 'undefined') return null;
    const preferences = window.localStorage.getItem('__MW::preferences');
    if (!preferences) return null;
    const parsed = JSON.parse(preferences);
    return parsed?.state?.febboxKey || null;
  } catch (err) {
    console.warn('Unable to access localStorage or parse auth data:', err);
    return null;
  }
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

const BASE_URL = 'https://fed-api.pstream.mov';
const ALLOWED_REGIONS = ['east', 'west', 'south', 'asia', 'europe'];

function normalizeRegion(region: string | null): string {
  const lowercasedRegion = (region || '').toLowerCase();
  if (ALLOWED_REGIONS.includes(lowercasedRegion)) {
    return lowercasedRegion;
  }
  return 'east';
}

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const userToken = getUserToken();
  if (!userToken) throw new NotFoundError('Requires a user token!');

  const region = getRegion();
  const url =
    ctx.media.type === 'movie'
      ? `${BASE_URL}/movie/${ctx.media.imdbId}`
      : `${BASE_URL}/tv/${ctx.media.imdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;

  const data = await ctx.proxiedFetcher<any>(url, {
    headers: {
      'ui-token': userToken,
      region: normalizeRegion(region),
      Origin: 'https://pstream.mov',
      Referer: 'https://pstream.mov',
    },
  });

  if (data?.error && data.error.startsWith('No results found in MovieBox search')) {
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

  const streams = Object.entries(data.streams).reduce((acc: Record<string, string>, [quality, streamUrl]) => {
    let qualityKey;
    if (quality === 'ORG') {
      if ((streamUrl as string).split('?')[0].toLowerCase().endsWith('.mp4')) {
        acc.unknown = streamUrl as string;
      }
      return acc;
    }
    if (quality === '4K') {
      qualityKey = 2160;
    } else {
      qualityKey = parseInt(quality.replace('P', ''), 10);
    }
    if (Number.isNaN(qualityKey) || acc[qualityKey]) return acc;
    acc[qualityKey] = streamUrl as string;
    return acc;
  }, {});

  const filteredStreams = Object.entries(streams).reduce((acc: Record<string, string>, [quality, streamUrl]) => {
    if (quality !== 'unknown') {
      acc[quality] = streamUrl;
    }
    return acc;
  }, {});

  const captions: any = [];
  if (data.subtitles) {
    for (const [lang, subData] of Object.entries(data.subtitles as Record<string, any>)) {
      const langKey = lang.split('_')[0];
      const langName = langKey.charAt(0).toUpperCase() + langKey.slice(1);
      const language = labelToLanguageCode(langName)?.toLowerCase() ?? 'unknown';
      if (subData.subtitle_link) {
        const subUrl = subData.subtitle_link;
        const isVtt = subUrl.toLowerCase().endsWith('.vtt');
        captions.push({
          type: isVtt ? 'vtt' : 'srt',
          id: subUrl,
          url: subUrl,
          language,
          hasCorsRestrictions: false,
        });
      }
    }
  }

  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        captions,
        qualities: {
          ...(filteredStreams[2160] && {
            '4k': {
              type: 'mp4',
              url: filteredStreams[2160],
            },
          }),
          ...(filteredStreams[1080] && {
            '1080': {
              type: 'mp4',
              url: filteredStreams[1080],
            },
          }),
          ...(filteredStreams[720] && {
            '720': {
              type: 'mp4',
              url: filteredStreams[720],
            },
          }),
          ...(filteredStreams[480] && {
            '480': {
              type: 'mp4',
              url: filteredStreams[480],
            },
          }),
          ...(filteredStreams[360] && {
            '360': {
              type: 'mp4',
              url: filteredStreams[360],
            },
          }),
          ...(filteredStreams.unknown && {
            unknown: {
              type: 'mp4',
              url: filteredStreams.unknown,
            },
          }),
        },
        type: 'file',
        flags: [flags.CORS_ALLOWED],
      },
    ],
  };
}

export const FedAPIScraper = makeSourcerer({
  id: 'fedapi',
  name: 'FED API (4K) 🔥',
  rank: 895,
  disabled: !getUserToken(),
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
