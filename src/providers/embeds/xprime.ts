/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput, makeEmbed } from '@/providers/base';
import { labelToLanguageCode } from '@/providers/captions';
import { NotFoundError } from '@/utils/errors';

const foxBaseUrl = 'https://backend.xprime.tv/fox';
const apolloBaseUrl = 'https://kendrickl-3amar.site';
const showboxBaseUrl = 'https://backend.xprime.tv/primebox';
const marantBaseUrl = 'https://backend.xprime.tv/marant';
const krakenBaseUrl = 'https://backend.xprime.tv/kraken';
const primenetBaseUrl = 'https://backend.xprime.tv/primenet';
const volkswagenBaseUrl = 'https://backend.xprime.tv/volkswagen';
const harbourBaseUrl = 'https://backend.xprime.tv/harbour';
const fendiBaseUrl = 'https://backend.xprime.tv/fendi';
const rageBaseUrl = 'https://backend.xprime.tv/rage';
const phoenixBaseUrl = 'https://backend.xprime.tv/phoenix';

export const xprimeApolloEmbed = makeEmbed({
  id: 'xprime-apollo',
  name: 'Appolo',
  disabled: true,
  rank: 249,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    let url = `${apolloBaseUrl}/${query.tmdbId}`;

    if (query.type === 'show') {
      url += `/${query.season}/${query.episode}`;
    }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    const captions =
      data.subtitles?.map((sub: { file: string; label: string }, index: number) => ({
        id: index,
        type: 'vtt',
        url: sub.file,
        language: labelToLanguageCode(sub.label) || 'unknown',
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions,
          ...(data.thumbnails?.file
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: data.thumbnails.file,
                },
              }
            : {}),
        },
      ],
    };
  },
});

export const xprimeStreamboxEmbed = makeEmbed({
  id: 'xprime-streambox',
  name: 'Streambox',
  rank: 248,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);

    let url = `${showboxBaseUrl}?name=${query.title}&year=${query.releaseYear}&fallback_year=${query.releaseYear}`;

    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.streams) throw new NotFoundError('No streams found in response');

    const captions =
      data.subtitles?.map((sub: { file: string; label: string }, index: number) => ({
        id: index,
        url: sub.file,
        language: labelToLanguageCode(sub.label) || 'unknown',
        type: 'srt',
      })) || [];

    const qualityMap: Record<string, string> = {};

    Object.entries(data.streams).forEach(([key, value]) => {
      const normalizedKey = key.toUpperCase();
      let quality;

      if (normalizedKey === '4K') {
        quality = 2160;
      } else {
        quality = parseInt(normalizedKey.replace('P', ''), 10);
      }

      if (!Number.isNaN(quality) && !qualityMap[quality]) {
        qualityMap[quality] = value as string;
      }
    });

    return {
      stream: [
        {
          id: 'primary',
          captions,
          qualities: {
            ...(qualityMap[2160] && {
              '4k': {
                type: 'mp4',
                url: qualityMap[2160],
              },
            }),
            ...(qualityMap[1080] && {
              '1080': {
                type: 'mp4',
                url: qualityMap[1080],
              },
            }),
            ...(qualityMap[720] && {
              '720': {
                type: 'mp4',
                url: qualityMap[720],
              },
            }),
            ...(qualityMap[480] && {
              '480': {
                type: 'mp4',
                url: qualityMap[480],
              },
            }),
            ...(qualityMap[360] && {
              '360': {
                type: 'mp4',
                url: qualityMap[360],
              },
            }),
          },
          type: 'file',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});

export const xprimeFoxEmbed = makeEmbed({
  id: 'xprime-fox',
  name: 'Fox',
  rank: 247,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const params = new URLSearchParams({
      id: query.tmdbId,
    });

    if (query.type === 'show') {
      params.append('season', query.season.toString());
      params.append('episode', query.episode.toString());
    }

    const apiRes = await ctx.fetcher(`${foxBaseUrl}?${params.toString()}`);
    if (!apiRes) throw new NotFoundError('No response received');
    const data = JSON.parse(apiRes);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    const captions =
      data.subtitles?.map((sub: { file: string; label: string }, index: number) => {
        const lang = sub.label.split(' ')[0].toLowerCase();
        return {
          id: index,
          type: 'vtt',
          url: sub.file,
          language: labelToLanguageCode(lang) || 'unknown',
        };
      }) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const xprimePrimenetEmbed = makeEmbed({
  id: 'xprime-primenet',
  name: 'Primenet',
  rank: 246,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    let url = `${primenetBaseUrl}?id=${query.tmdbId}`;

    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});

export const xprimeKrakenEmbed = makeEmbed({
  id: 'xprime-kraken',
  name: 'Kraken',
  rank: 245,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    let url = `${krakenBaseUrl}?id=${query.tmdbId}&name=${encodeURIComponent(query.title)}`;

    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}&eid=${query.episodeId || ''}`;
    }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    const captions =
      data.subtitles?.map((sub: { file: string; label: string }, index: number) => ({
        id: index,
        type: 'vtt',
        url: sub.file,
        language: labelToLanguageCode(sub.label) || 'unknown',
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const xprimePhoenixEmbed = makeEmbed({
  id: 'xprime-phoenix',
  name: 'Phoenix',
  rank: 244,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);

    const params = new URLSearchParams();
    params.append('id', query.tmdbId);
    params.append('imdb', query.imdbId);

    // For TV shows, add season and episode
    if (query.type === 'show') {
      params.append('season', query.season.toString());
      params.append('episode', query.episode.toString());
    }

    const url = `${phoenixBaseUrl}?${params.toString()}`;
    ctx.progress(50);

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    ctx.progress(90);

    // Parse and format captions
    const captions = data.subtitles
      ? data.subtitles.map((sub: any, index: number) => {
          // Extract the base label without number suffixes
          const baseLabel = sub.label.split(' ')[0];
          // Use mapped ISO code or the original label if not found in the map
          const langCode = labelToLanguageCode(baseLabel) || baseLabel.toLowerCase().substring(0, 2);

          return {
            id: index,
            language: langCode,
            url: sub.file,
            label: sub.label,
            type: 'vtt',
          };
        })
      : [];

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const xprimeHarbourEmbed = makeEmbed({
  id: 'xprime-harbour',
  name: 'Harbour',
  disabled: true,
  rank: 243,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const params = new URLSearchParams({
      name: query.title,
      year: query.releaseYear.toString(),
    });

    if (query.type === 'show') {
      params.append('season', query.season.toString());
      params.append('episode', query.episode.toString());
    }

    const apiRes = await ctx.fetcher(`${harbourBaseUrl}?${params.toString()}`);
    if (!apiRes) throw new NotFoundError('No response received');
    const data = await JSON.parse(apiRes);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    const captions =
      data.subtitles?.map((sub: { file: string; label: string }, index: number) => ({
        id: index,
        type: 'vtt',
        url: sub.file,
        language: labelToLanguageCode(sub.label) || 'unknown',
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const xprimeRageEmbed = makeEmbed({
  id: 'xprime-rage',
  name: 'Rage (4K)',
  rank: 242,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    let url = `${rageBaseUrl}?imdb=${query.imdbId}`;

    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    const qualityMap: Record<string, string> = {};

    if (data.quality === '4K') {
      qualityMap['4K'] = data.url;
    } else if (data.quality) {
      qualityMap[`${data.quality}P`] = data.url;
    } else {
      qualityMap.ORG = data.url;
    }

    const streams = Object.entries(qualityMap).reduce((acc: Record<string, string>, [quality, streamUrl]) => {
      let qualityKey;
      if (quality === 'ORG') {
        if (streamUrl.split('?')[0].toLowerCase().endsWith('.mp4')) {
          acc.unknown = streamUrl;
        }
        return acc;
      }
      if (quality === '4K') {
        qualityKey = 2160;
      } else {
        qualityKey = parseInt(quality.replace('P', ''), 10);
      }
      if (Number.isNaN(qualityKey) || acc[qualityKey]) return acc;
      acc[qualityKey] = streamUrl;
      return acc;
    }, {});

    ctx.progress(90);

    return {
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
  },
});

export const xprimeFendiEmbed = makeEmbed({
  id: 'xprime-fendi',
  name: 'Fendi (Italian + English)',
  rank: 241,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    let url = `${fendiBaseUrl}?id=${query.tmdbId}`;

    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});

export const xprimeMarantEmbed = makeEmbed({
  id: 'xprime-marant',
  name: 'Marant (French + English)',
  rank: 240,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    let url = `${marantBaseUrl}?id=${query.tmdbId}`;

    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});

export const xprimeVolkswagenEmbed = makeEmbed({
  id: 'xprime-volkswagen',
  name: 'Volkswagen (German)',
  rank: 239,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    let url = `${volkswagenBaseUrl}?name=${query.title}`;

    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    } else {
      url += `&year=${query.releaseYear}`;
    }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.streams) throw new NotFoundError('No streams found in response');

    const qualityMap: Record<string, { type: string; url: string }> = {};

    Object.entries(data.streams).forEach(([key, value]) => {
      const normalizedKey = key.toLowerCase().replace('p', '');
      qualityMap[normalizedKey] = {
        type: 'mp4',
        url: value as string,
      };
    });

    ctx.progress(90);

    return {
      stream: [
        {
          id: 'primary',
          type: 'file',
          flags: [flags.CORS_ALLOWED],
          qualities: qualityMap,
          captions: [],
        },
      ],
    };
  },
});
