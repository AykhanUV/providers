import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://vidsrc.cx';

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const media = ctx.media;
  let path;

  if (media.type === 'movie') {
    path = `/embed/movie/${media.tmdbId}`;
  } else if (media.type === 'show') {
    path = `/embed/tv/${media.tmdbId}/${media.season.number}/${media.episode.number}`;
  } else {
    throw new NotFoundError('Unsupported media type');
  }

  const embedUrl = `${baseUrl}${path}`;

  const scrapeUrl = `https://scraper.aether.mom/api/scrape?url=${encodeURIComponent(embedUrl)}&waitfor=.m3u8`;

  const data = await ctx.proxiedFetcher<any>(scrapeUrl);

  const m3u8Url = data.requests.find((req: any) => req.url.includes('.m3u8'));
  if (!m3u8Url) throw new NotFoundError('No m3u8 url found in response');

  return {
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: m3u8Url.url,
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
    embeds: [],
  };
}

export const vidsrccxScraper = makeSourcerer({
  id: 'vidsrccx',
  name: 'VidSrc 🏐',
  disabled: false,
  rank: 175,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
