import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const API_SERVER = 'https://mbp.pirxcy.dev';

// Helper function to convert quality string to standard format
function normalizeQuality(quality: string): string {
  const qualityMap: { [key: string]: string } = {
    '4K': '2160',
    '1080p': '1080',
    '720p': '720',
    HDTV: '720',
    '480p': '480',
    '360p': '360',
  };
  return qualityMap[quality] || '720';
}

// Helper function to build qualities object from all available streams
function buildQualitiesFromStreams(streams: Array<{ path: string; real_quality: string }>) {
  const mp4Streams = streams.filter((s) => s.path && new URL(s.path).pathname.endsWith('.mp4'));
  if (mp4Streams.length === 0) {
    throw new NotFoundError('No playable MP4 streams found');
  }

  const qualities: { [key: string]: { url: string } } = {};

  // Add all available qualities
  for (const stream of mp4Streams) {
    const normalizedQuality = normalizeQuality(stream.real_quality);
    qualities[normalizedQuality] = { url: stream.path };
  }

  return qualities;
}

// Helper function to find media by TMDB ID
async function findMediaByTMDBId(
  ctx: MovieScrapeContext | ShowScrapeContext,
  tmdbId: string,
  title: string,
  type: 'movie' | 'tv',
  year?: string,
): Promise<string> {
  const searchUrl = `${API_SERVER}/search?q=${encodeURIComponent(title)}&type=${type}${year ? `&year=${year}` : ''}`;
  const searchRes = await ctx.proxiedFetcher(searchUrl);

  if (!searchRes.data || searchRes.data.length === 0) {
    throw new NotFoundError('No results found in search');
  }

  // Find the correct internal ID by matching TMDB ID
  for (const result of searchRes.data) {
    const detailUrl = `${API_SERVER}/details/${type}/${result.id}`;
    const detailRes = await ctx.proxiedFetcher(detailUrl);

    if (detailRes.data && detailRes.data.tmdb_id.toString() === tmdbId) {
      return result.id;
    }
  }

  throw new NotFoundError('Could not find matching media item for TMDB ID');
}

async function scrapeMovie(ctx: MovieScrapeContext): Promise<SourcererOutput> {
  const tmdbId = ctx.media.tmdbId;
  const title = ctx.media.title;
  const year = ctx.media.releaseYear?.toString();

  if (!tmdbId || !title) {
    throw new NotFoundError('Missing required media information');
  }

  try {
    // Find internal media ID
    const mediaId = await findMediaByTMDBId(ctx, tmdbId, title, 'movie', year);

    // Get stream links
    const streamUrl = `${API_SERVER}/movie/${mediaId}`;
    const streamData = await ctx.proxiedFetcher(streamUrl);

    if (!streamData.data || !streamData.data.list) {
      throw new NotFoundError('No streams found for this movie');
    }

    const qualities = buildQualitiesFromStreams(streamData.data.list);

    return {
      stream: [
        {
          id: 'pirxcy',
          type: 'file',
          qualities,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
      embeds: [],
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new NotFoundError(`Failed to scrape movie: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function scrapeShow(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  const tmdbId = ctx.media.tmdbId;
  const title = ctx.media.title;
  const year = ctx.media.releaseYear?.toString();
  const season = ctx.media.season.number;
  const episode = ctx.media.episode.number;

  if (!tmdbId || !title || !season || !episode) {
    throw new NotFoundError('Missing required media information');
  }

  try {
    // Find internal media ID
    const mediaId = await findMediaByTMDBId(ctx, tmdbId, title, 'tv', year);

    // Get stream links
    const streamUrl = `${API_SERVER}/tv/${mediaId}/${season}/${episode}`;
    const streamData = await ctx.proxiedFetcher(streamUrl);

    if (!streamData.data || !streamData.data.list) {
      throw new NotFoundError('No streams found for this episode');
    }

    const qualities = buildQualitiesFromStreams(streamData.data.list);

    return {
      stream: [
        {
          id: 'pirxcy',
          type: 'file',
          qualities,
          flags: [flags.CORS_ALLOWED],
          captions: [],
        },
      ],
      embeds: [],
    };
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new NotFoundError(`Failed to scrape show: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const pirxcyScraper = makeSourcerer({
  id: 'pirxcy',
  name: 'Pirxcy',
  rank: 150,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie,
  scrapeShow,
});
