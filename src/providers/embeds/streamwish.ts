/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

const providers = [
  {
    id: 'streamwish-latino',
    name: 'StreamWish (Latino)',
    rank: 170,
  },
  {
    id: 'streamwish-spanish',
    name: 'StreamWish (Castellano)',
    rank: 169,
  },
  {
    id: 'streamwish-english',
    name: 'StreamWish (English)',
    rank: 168,
  },
];

function embed(provider: { id: string; name: string; rank: number }) {
  return makeEmbed({
    id: provider.id,
    name: provider.name,
    rank: provider.rank,
    async scrape(ctx) {
      const encodedUrl = encodeURIComponent(ctx.url);
      const apiUrl = `https://ws-m3u8.moonpic.qzz.io/m3u8/${encodedUrl}`;

      const response = await fetch(apiUrl, {
        headers: {
          Accept: 'application/json',
          // 'ngrok-skip-browser-warning': 'true', // this header bypass ngrok warning
        },
      });

      if (!response.ok) throw new NotFoundError('No video URL found');
      const data = await response.json();

      const videoUrl = data.m3u8;
      if (!videoUrl) throw new NotFoundError('No video URL found');

      return {
        stream: [
          {
            id: 'primary',
            type: 'hls',
            playlist: videoUrl,
            flags: [flags.CORS_ALLOWED],
            captions: [],
          },
        ],
      };
    },
  });
}

export const [streamwishLatinoScraper, streamwishSpanishScraper, streamwishEnglishScraper] = providers.map(embed);
