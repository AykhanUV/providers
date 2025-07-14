import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { Qualities } from '@/providers/streams';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const aetherBase = 'https://bigback-dev.sudo-flix.nl';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  let availabilityUrl: string;
  if (ctx.media.type === 'movie') {
    availabilityUrl = `${aetherBase}/availability/movie/${ctx.media.tmdbId}`;
  } else {
    availabilityUrl = `${aetherBase}/availability/show/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const qualitiesList = await ctx.proxiedFetcher<string[]>(availabilityUrl);
  if (!qualitiesList || qualitiesList.length === 0) {
    throw new NotFoundError('No qualities found for this media');
  }

  const qualities: Partial<Record<Qualities, { type: 'mp4'; url: string }>> = {};

  for (const quality of qualitiesList) {
    let streamUrl: string;
    if (ctx.media.type === 'movie') {
      streamUrl = `${aetherBase}/stream/movie/${ctx.media.tmdbId}/${quality}`;
    } else {
      streamUrl = `${aetherBase}/stream/show/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}/${quality}`;
    }

    let qualityKey: Qualities;
    if (quality.toUpperCase() === 'ORG') {
      qualityKey = 'unknown';
    } else {
      qualityKey = quality.toLowerCase().replace('p', '') as Qualities;
    }
    qualities[qualityKey] = {
      type: 'mp4',
      url: streamUrl,
    };
  }

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        qualities,
        flags: [],
        captions: [],
      },
    ],
  };
}

export const aetherScraper = makeSourcerer({
  id: 'aether',
  name: 'Aether 💫',
  rank: 169,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
