import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

export const autoembedScraper = makeEmbed({
  id: 'autoembed',
  name: 'Autoembed',
  rank: 550,
  async scrape(ctx) {
    const embedId = ctx.url.split('embedId=')[1] || 'autoembed-english';
    const language = embedId.split('-')[1] || 'English';
    const capitalLang = language.charAt(0).toUpperCase() + language.slice(1);

    return {
      stream: [
        {
          id: 'primary',
          type: 'hls',
          playlist: ctx.url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
          displayName: `${capitalLang}`,
        },
      ],
    };
  },
});
