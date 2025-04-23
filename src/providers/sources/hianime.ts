import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { ShowScrapeContext } from '@/utils/context';

interface HianimeSearchResult {
  success: boolean;
  data: {
    animes: Array<{
      id: string;
      name: string;
    }>;
  };
}

interface HianimeEpisodeResult {
  success: boolean;
  data: {
    episodes: Array<{
      number: number;
      title: string;
      episodeId: string;
    }>;
  };
}

async function searchAnime(title: string): Promise<string> {
  const response = await fetch(`https://hianime.pstream.org/api/v2/hianime/search?q=${encodeURIComponent(title)}`);
  if (!response.ok) throw new Error('Failed to search anime');
  const data: HianimeSearchResult = await response.json();

  if (!data.success || !data.data.animes.length) {
    throw new Error('Anime not found');
  }

  // Return the ID of the first matching anime
  return data.data.animes[0].id;
}

async function fetchEpisodeData(animeId: string): Promise<HianimeEpisodeResult> {
  const response = await fetch(`https://hianime.pstream.org/api/v2/hianime/anime/${animeId}/episodes`);
  if (!response.ok) throw new Error('Failed to fetch episode data');
  return response.json();
}

async function comboScraper(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  // First, search for the anime to get its Hianime ID
  const animeId = await searchAnime(ctx.media.title);

  // Then, get the episode data
  const episodeData = await fetchEpisodeData(animeId);
  const episode = episodeData.data.episodes.find((ep) => ep.number === ctx.media.episode.number);

  if (!episode) throw new Error('Episode not found');

  const embeds = [
    {
      embedId: 'hianime-hd1-dub',
      url: JSON.stringify({
        episodeId: episode.episodeId,
      }),
    },
    {
      embedId: 'hianime-hd2-dub',
      url: JSON.stringify({
        episodeId: episode.episodeId,
      }),
    },
    {
      embedId: 'hianime-hd1-sub',
      url: JSON.stringify({
        episodeId: episode.episodeId,
      }),
    },
    {
      embedId: 'hianime-hd2-sub',
      url: JSON.stringify({
        episodeId: episode.episodeId,
      }),
    },
  ];

  return { embeds };
}

export const hianimeScraper = makeSourcerer({
  id: 'hianime',
  name: 'Hianime',
  rank: 7,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeShow: comboScraper,
});
