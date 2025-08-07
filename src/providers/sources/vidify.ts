import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';

const vidifyBase = 'https://api.vidify.top';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaType = ctx.media.type;
  let apiUrlPath: string;

  if (mediaType === 'movie') {
    apiUrlPath = `/movie/${ctx.media.tmdbId}`;
  } else {
    apiUrlPath = `/tv/${ctx.media.tmdbId}/season/${ctx.media.season.number}/episode/${ctx.media.episode.number}`;
  }

  const embeds: SourcererEmbed[] = [];
  for (let serverId = 1; serverId <= 11; serverId++) {
    const fullApiUrl = `${vidifyBase}${apiUrlPath}?sr=${serverId}`;
    embeds.push({
      embedId: 'vidify-embed',
      url: fullApiUrl,
    });
  }

  return {
    embeds,
  };
}

export const vidifyScraper = makeSourcerer({
  id: 'vidify-source',
  name: 'Vidify',
  rank: 155,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
