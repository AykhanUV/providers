import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput, makeEmbed } from '@/providers/base';
import { labelToLanguageCode } from '@/providers/captions';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

const BaseUrl = 'https://player.vidzee.wtf/api/server';

export const vidzeeServer1Embed = makeEmbed({
  id: 'vidzee-server1',
  name: 'Server 1',
  rank: 34,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const params = new URLSearchParams({
      id: query.tmdbId,
      sr: '1',
    });

    if (query.type === 'show') {
      params.append('ss', query.season.toString());
      params.append('ep', query.episode.toString());
    }

    const data = await ctx.proxiedFetcher(`${BaseUrl}?${params.toString()}`);
    if (!data) throw new NotFoundError('No response received');
    if (!data.url || !Array.isArray(data.url) || data.url.length === 0) {
      throw new NotFoundError('No stream URL found in response');
    }

    const streamData = data.url[0];
    const streamUrl = streamData.link;
    const headers = data.headers || {};

    if (headers.Referer && headers.Referer.includes('vidzee')) {
      headers.Origin = 'https://player.vidzee.wtf';
    }

    const captions =
      data.tracks?.map((track: { lang: string; url: string }, i: number) => {
        return {
          id: i,
          type: 'vtt',
          url: track.url,
          language: labelToLanguageCode(track.lang) || 'unknown',
        };
      }) || [];

    ctx.progress(90);

    const finalUrl = Object.keys(headers).length > 0 ? createM3U8ProxyUrl(streamUrl, headers) : streamUrl;

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: finalUrl,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});

export const vidzeeServer2Embed = makeEmbed({
  id: 'vidzee-server2',
  name: 'Server 2',
  rank: 33,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const params = new URLSearchParams({
      id: query.tmdbId,
      sr: '2',
    });

    if (query.type === 'show') {
      params.append('ss', query.season.toString());
      params.append('ep', query.episode.toString());
    }

    const data = await ctx.proxiedFetcher(`${BaseUrl}?${params.toString()}`);
    if (!data) throw new NotFoundError('No response received');
    if (!data.url || !Array.isArray(data.url) || data.url.length === 0) {
      throw new NotFoundError('No stream URL found in response');
    }

    const streamData = data.url[0];
    const streamUrl = streamData.link;
    const headers = data.headers || {};

    // Add Origin header if Referer contains vidzee
    if (headers.Referer && headers.Referer.includes('vidzee')) {
      headers.Origin = 'https://player.vidzee.wtf/';
    }

    const captions =
      data.tracks?.map((track: { lang: string; url: string }, i: number) => {
        return {
          id: i,
          type: 'vtt',
          url: track.url,
          language: labelToLanguageCode(track.lang) || 'unknown',
        };
      }) || [];

    ctx.progress(90);

    const finalUrl = Object.keys(headers).length > 0 ? createM3U8ProxyUrl(streamUrl, headers) : streamUrl;

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: finalUrl,
          flags: [flags.CORS_ALLOWED],
          captions,
        },
      ],
    };
  },
});
