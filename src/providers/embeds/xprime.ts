/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const foxBaseUrl = 'https://xprime.tv/foxtemp';
const apolloBaseUrl = 'https://cors.aether.mom/?destination=https://kendrickl-3amar.site';
const showboxBaseUrl = 'https://cors.aether.mom/?destination=https://xprime.tv/primebox';
const marantBaseUrl = 'https://cors.aether.mom/?destination=https://backend.xprime.tv/marant';
const primenetBaseUrl = 'https://cors.aether.mom/?destination=https://backend.xprime.tv/primenet';
const volkswagenBaseUrl = 'https://cors.aether.mom/?destination=https://backend.xprime.tv/volkswagen';
const harbourBaseUrl = 'https://backend.xprime.tv/harbour';

const languageMap: Record<string, string> = {
  'chinese - hong kong': 'zh',
  'chinese - traditional': 'zh',
  czech: 'cs',
  danish: 'da',
  dutch: 'nl',
  english: 'en',
  'english - sdh': 'en',
  finnish: 'fi',
  french: 'fr',
  german: 'de',
  greek: 'el',
  hungarian: 'hu',
  italian: 'it',
  korean: 'ko',
  norwegian: 'no',
  polish: 'pl',
  portuguese: 'pt',
  'portuguese - brazilian': 'pt',
  romanian: 'ro',
  'spanish - european': 'es',
  'spanish - latin american': 'es',
  swedish: 'sv',
  turkish: 'tr', 
  اَلْعَرَبِيَّةُ: 'ar',
  বাংলা: 'bn',
  filipino: 'tl',
  indonesia: 'id',
  اردو: 'ur',
};

export const xprimeApolloEmbed = makeEmbed({
  id: 'xprime-apollo',
  name: 'Appolo',
  rank: 237,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    let url = `${apolloBaseUrl}/${query.tmdbId}`;

    if (query.type === 'show') {
      url += `/${query.season}/${query.episode}`;
    }

    const data = await ctx.proxiedFetcher(url, {
      baseUrl: apolloBaseUrl,
      headers: {
        Referer: `https://pstream.org`,
        Origin: `https://pstream.org`,
      },
    });

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    const captions =
      data.subtitles?.map((sub: { file: string; label: string }) => ({
        type: 'vtt',
        url: sub.file,
        language: languageMap[sub.label.toLowerCase()] || 'unknown',
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: `https://proxy.fifthwit.net/m3u8-proxy?url=${encodeURIComponent(data.url)}&headers=${encodeURIComponent(JSON.stringify({ referer: 'https://pstream.org/', origin: 'https://pstream.org' }))}`,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const xprimeStreamboxEmbed = makeEmbed({
  id: 'xprime-streambox',
  name: 'Streambox',
  rank: 236,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);

    let url = `${showboxBaseUrl}?name=${query.title}&year=${query.releaseYear}&fallback_year=${query.releaseYear}`;

    if (query.type === 'show') {
      url += `&season=${query.season}&episode=${query.episode}`;
    }

    // Old handling in case
    // if (query.type === 'show') {
    //   url += `?id=${query.tmdbId}&season=${query.season}&episode=${query.episode}`;
    // } else {
    //   url += `?id=${query.tmdbId}`;
    // }

    const data = await ctx.fetcher(url);

    if (!data) throw new NotFoundError('No response received');
    if (data.error) throw new NotFoundError(data.error);
    if (!data.streams) throw new NotFoundError('No streams found in response');

    const captions =
      data.subtitles?.map((sub: { file: string; label: string }) => ({
        id: sub.label,
        url: sub.file,
        language: languageMap[sub.label.toLowerCase()] || 'unknown',
        type: 'srt',
      })) || [];

    const qualityMap: Record<string, { type: string; url: string }> = {};

    Object.entries(data.streams).forEach(([key, value]) => {
      const normalizedKey = key.toLowerCase().replace('p', '');
      qualityMap[normalizedKey] = {
        type: 'mp4',
        url: value as string,
      };
    });

    return {
      stream: [
        {
          id: 'primary',
          captions,
          qualities: qualityMap,
          type: 'file',
          flags: [flags.CORS_ALLOWED],
        },
      ],
    };
  },
});

export const xprimePrimenetEmbed = makeEmbed({
  id: 'xprime-primenet',
  name: 'Primenet',
  rank: 235,
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

export const xprimeFoxEmbed = makeEmbed({
  id: 'xprime-fox',
  name: 'Fox',
  rank: 233,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const params = new URLSearchParams({
      name: query.title,
      pstream: 'true',
    });

    if (query.type === 'show') {
      params.append('season', query.season.toString());
      params.append('episode', query.episode.toString());
    }

    const apiRes = await ctx.fetcher(`${foxBaseUrl}?${params.toString()}`);
    if (!apiRes) throw new NotFoundError('No response received');
    const data = await JSON.parse(apiRes);
    if (!data.url) throw new NotFoundError('No stream URL found in response');

    const captions =
      data.subtitles?.map((sub: { file: string; label: string }) => ({
        type: 'vtt',
        url: sub.file,
        language: languageMap[sub.label.toLowerCase()] || 'unknown',
      })) || [];

    ctx.progress(90);

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: `https://oca.kendrickl-3amar.site/?v=${encodeURIComponent(data.url)}&headers=${encodeURIComponent(JSON.stringify({ referer: 'https://megacloud.store/', origin: 'https://megacloud.store' }))}`,
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
  rank: 232,
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
      data.subtitles?.map((sub: { file: string; label: string }) => ({
        type: 'vtt',
        url: sub.file,
        language: languageMap[sub.label.toLowerCase()] || 'unknown',
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

export const xprimeMarantEmbed = makeEmbed({
  id: 'xprime-marant',
  name: 'Marant (French + English)',
  rank: 231,
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
  rank: 230,
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
