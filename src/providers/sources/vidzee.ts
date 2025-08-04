import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const query = {
    type: ctx.media.type,
    title: ctx.media.title,
    tmdbId: ctx.media.tmdbId,
    imdbId: ctx.media.imdbId,
    ...(ctx.media.type === 'show' && {
      season: ctx.media.season.number,
      episode: ctx.media.episode.number,
    }),
    releaseYear: ctx.media.releaseYear,
  };

  const embeds = [
    {
      embedId: 'vidzee-server1',
      url: JSON.stringify(query),
    },
    {
      embedId: 'vidzee-server2',
      url: JSON.stringify(query),
    },
  ];

  return { embeds };
}

export const vidzeeScraper = makeSourcerer({
  id: 'vidzee',
  name: 'Vidzee',
  rank: 164,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
