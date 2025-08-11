import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

const baseUrl = 'https://videasy.net';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaType = ctx.media.type;
  const tmdbId = ctx.media.tmdbId;
  const seasonId = mediaType === 'show' ? ctx.media.season.number : undefined;
  const episodeId = mediaType === 'show' ? ctx.media.episode.number : undefined;

  const playerUrl = `https://player.videasy.net/${
    mediaType === 'show' ? `tv/${tmdbId}/${seasonId}/${episodeId}` : `movie/${tmdbId}`
  }`;

  const scrapeUrl = `https://scraper.aether.mom/api/scrape?url=${encodeURIComponent(
    playerUrl,
  )}&clickSelector=.play-icon-main&waitfor=.m3u8`;

  const data = await ctx.proxiedFetcher<any>(scrapeUrl, {
    headers: {
      Referer: baseUrl,
    },
  });

  const m3u8Url = data.requests.find((req: any) => req.url.includes('.m3u8'));
  if (!m3u8Url) throw new NotFoundError('No m3u8 url found in response');

  const streamHeaders = {
    Referer: 'https://videasy.net/',
    Origin: 'https://videasy.net',
  };

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: createM3U8ProxyUrl(m3u8Url.url, streamHeaders),
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const videasyScraper = makeSourcerer({
  id: 'videasy',
  name: 'Videasy 🪄',
  rank: 820,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
