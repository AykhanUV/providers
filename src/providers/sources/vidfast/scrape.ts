import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

import { vidfastBase } from './common';

const getSources = async (ctx: MovieScrapeContext | ShowScrapeContext, encryptedId: string) => {
  const sourceUrl = `${vidfastBase}/7NvrZknlSpkUiD1YNcXjqN1oO8xiA`; // This path is dynamic, we need to extract it
  const sources = await ctx.proxiedFetcher<any>(sourceUrl, {
    method: 'POST',
    body: new URLSearchParams({
      query: encryptedId,
    }),
  });

  return sources;
};

const getStream = async (ctx: MovieScrapeContext | ShowScrapeContext, sourceData: string) => {
  const streamUrl = `${vidfastBase}/NvmKwPl32dAoRGPLkzqt-Ps5N0N`; // This path is dynamic, we need to extract it
  const stream = await ctx.proxiedFetcher<any>(streamUrl, {
    method: 'POST',
    body: new URLSearchParams({
      query: sourceData,
    }),
  });

  return stream;
};

export const comboScraper = async (ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> => {
  let url = `${vidfastBase}/movie/${ctx.media.tmdbId}`;
  if (ctx.media.type === 'show') {
    url = `${vidfastBase}/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const page = await ctx.proxiedFetcher<string>(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'TE': 'trailers',
      'Referer': vidfastBase,
    },
  });

  console.log('PAGECONTENT', page);
  const encryptedIdMatch = page.match(/"en":"([^"]+)"/);
  if (!encryptedIdMatch || !encryptedIdMatch[1]) throw new NotFoundError('Could not find encrypted id');
  const encryptedId = encryptedIdMatch[1];

  if (!encryptedId) throw new NotFoundError('Could not find encrypted id');

  const sources = await getSources(ctx, encryptedId);
  if (!sources) throw new NotFoundError('No sources found');

  const vfastSource = sources.find((s: any) => s.name === 'vFast');
  if (!vfastSource) throw new NotFoundError('vFast source not found');

  const stream = await getStream(ctx, vfastSource.data);
  if (!stream) throw new NotFoundError('No stream found');

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        captions: [],
        type: 'hls',
        playlist: createM3U8ProxyUrl(stream.url, {
          Referer: vidfastBase,
        }),
        flags: [flags.CORS_ALLOWED],
      },
    ],
  };
};
