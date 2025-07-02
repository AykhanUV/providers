/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://autoembed.pro';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaType = ctx.media.type === 'show' ? 'tv' : 'movie';
  let url = `${baseUrl}/embed/${mediaType}/${ctx.media.tmdbId}`;

  if (ctx.media.type === 'show') {
    url = `${url}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const data = await ctx.proxiedFetcher<any>(url, {
    headers: {
      Referer: baseUrl,
    },
  });

  if (!data) throw new NotFoundError('Failed to fetch video source');
  ctx.progress(50);

  const embeds: SourcererEmbed[] = [
    {
      embedId: `autoembed-english`,
      url: data.videoSource,
    },
  ];

  ctx.progress(90);

  return {
    embeds,
  };
}

export const autoembedScraper = makeSourcerer({
  id: 'autoembed',
  name: 'Autoembed 🔮',
  rank: 550,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
