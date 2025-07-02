import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

export const autoembedScraper = makeEmbed({
  id: 'autoembed',
  name: 'Autoembed',
  rank: 550,
  async scrape(ctx) {
    const url = new URL(ctx.url);
    const language = url.searchParams.get('lang') || 'english';
    url.searchParams.delete('lang');
    const playlistUrl = url.toString();

    const capitalLang = language.charAt(0).toUpperCase() + language.slice(1);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: playlistUrl,
          flags: [flags.CORS_ALLOWED],
          captions: [],
          displayName: capitalLang,
        },
      ],
    };
  },
});
