import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

const VIDIFY_TOKEN = 'chuitya'; // IMPORTANT: Replace with a valid token

type VidifyStreamResponse = {
  m3u8?: string;
  url?: string;
};

export const vidifyEmbedScraper = makeEmbed({
  id: 'vidify-embed',
  name: 'Vidify',
  rank: 155,
  async scrape(ctx) {
    const streamData = await ctx.proxiedFetcher<VidifyStreamResponse>(ctx.url, {
      headers: {
        Authorization: `Bearer ${VIDIFY_TOKEN}`,
        Referer: 'https://player.vidify.top/',
        Origin: 'https://player.vidify.top',
      },
    });

    if (streamData?.m3u8) {
      return {
        stream: [
          {
            id: 'primary',
            type: 'hls',
            playlist: streamData.m3u8,
            flags: [flags.CORS_ALLOWED],
            captions: [],
          },
        ],
      };
    }

    if (streamData?.url && streamData.url.includes('proxyv1.vidify.top')) {
      const proxiedUrl = new URL(streamData.url);
      const originalUrl = proxiedUrl.searchParams.get('url');

      if (originalUrl) {
        return {
          stream: [
            {
              id: 'primary',
              type: 'hls',
              playlist: createM3U8ProxyUrl(originalUrl),
              flags: [flags.CORS_ALLOWED],
              captions: [],
            },
          ],
        };
      }
    }

    throw new NotFoundError('No stream found for this Vidify server.');
  },
});
