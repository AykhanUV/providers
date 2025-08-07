import { flags } from '@/entrypoint/utils/targets';
import { UseableFetcher } from '@/fetchers/types';
import { makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

const VIDIFY_TOKEN = 'chuitya'; // IMPORTANT: Replace with a valid token

type VidifyStreamResponse = {
  m3u8?: string;
  url?: string;
};

async function scrapeVidify(url: string, proxiedFetcher: UseableFetcher): Promise<VidifyStreamResponse> {
  return proxiedFetcher<VidifyStreamResponse>(url, {
    headers: {
      Authorization: `Bearer ${VIDIFY_TOKEN}`,
      Referer: 'https://player.vidify.top/',
      Origin: 'https://player.vidify.top',
    },
  });
}

function makeVidifyEmbed(id: string, name: string, rank: number) {
  return makeEmbed({
    id,
    name,
    rank,
    async scrape(ctx) {
      const streamData = await scrapeVidify(ctx.url, ctx.proxiedFetcher);

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
}

export const vidifyServer1Embed = makeVidifyEmbed('vidify-1', 'Vidify Server 1', 156);
export const vidifyServer8Embed = makeVidifyEmbed('vidify-8', 'Vidify Server 8', 155);
