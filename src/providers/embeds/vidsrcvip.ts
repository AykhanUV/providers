import { flags } from '@/entrypoint/utils/targets';
import { makeEmbed } from '@/providers/base';

const embedProviders = [
  {
    id: 'vidsrc-nova',
    name: 'Nova',
    rank: 558,
  },
  {
    id: 'vidsrc-comet',
    name: 'Comet',
    rank: 560,
  },
  {
    id: 'vidsrc-pulsar',
    name: 'Pulsar',
    rank: 559,
  },
];

function makeVidSrcEmbed(provider: { id: string; name: string; rank: number }) {
  return makeEmbed({
    id: provider.id,
    name: provider.name,
    rank: provider.rank,
    async scrape(ctx) {
      return {
        stream: [
          {
            id: 'primary',
            type: 'hls',
            playlist: ctx.url,
            flags: [flags.CORS_ALLOWED],
            captions: [],
          },
        ],
      };
    },
  });
}

export const [vidsrcNovaEmbed, vidsrcCometEmbed, vidsrcPulsarEmbed] = embedProviders.map(makeVidSrcEmbed);
