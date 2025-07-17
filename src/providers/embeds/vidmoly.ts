import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

export const vidmolyScraper = makeEmbed({
  id: 'vidmoly',
  name: 'Vidmoly',
  rank: 40,
  async scrape(ctx) {
    const page = await ctx.proxiedFetcher<string>(ctx.url);
    const m3u8Url = page.match(/sources:\s*\[{file:"([^"]+.m3u8)"}\]/)?.[1];

    if (!m3u8Url) throw new NotFoundError('No stream found');

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: createM3U8ProxyUrl(m3u8Url, {
            Referer: 'https://vidmoly.to/',
          }),
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
    };
  },
});
