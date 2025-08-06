import { flags } from '@/entrypoint/utils/targets';
import type { ShowMedia } from '@/entrypoint/utils/media';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const mainUrl = 'https://dezzu370xol.com';

async function scrapeMovie(ctx: MovieScrapeContext): Promise<SourcererOutput> {
  const imdbId = ctx.media.imdbId;
  if (!imdbId) throw new NotFoundError('IMDb ID not found');

  const playerPage = await ctx.proxiedFetcher<string>(`/play/${imdbId}`, {
    baseUrl: mainUrl,
    headers: {
      Referer: 'https://www.vidsrc.wtf/',
    },
  });

  const playerConfigMatch = playerPage.match(/let pc = ({.*});/s);
  if (!playerConfigMatch) throw new Error('Failed to find player config');
  const playerConfig = JSON.parse(playerConfigMatch[1]);

  const sources = await ctx.proxiedFetcher<any>(playerConfig.file, {
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': playerConfig.key,
      Referer: `${mainUrl}/`,
      Origin: mainUrl,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
      'Content-type': 'application/x-www-form-urlencoded',
    },
  });

  const englishSource = sources[1];
  if (!englishSource) throw new Error('No english source found');

  const finalFilePath = englishSource.file.startsWith('~') ? englishSource.file.substring(1) : englishSource.file;
  const finalUrl = await ctx.proxiedFetcher<string>(`/playlist/${finalFilePath}.txt`, {
    baseUrl: mainUrl,
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': playerConfig.key,
      Referer: `${mainUrl}/play/${imdbId}`,
      Origin: mainUrl,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
      'Content-type': 'application/x-www-form-urlencoded',
    },
  });

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: finalUrl,
        flags: [],
        captions: [],
      },
    ],
  };
}

async function scrapeShow(ctx: ShowScrapeContext): Promise<SourcererOutput> {
  const imdbId = ctx.media.imdbId;
  if (!imdbId) throw new NotFoundError('IMDb ID not found');

  const playerPage = await ctx.proxiedFetcher<string>(`/play/${imdbId}`, {
    baseUrl: mainUrl,
    headers: {
      Referer: 'https://www.vidsrc.wtf/',
    },
  });

  let playerConfigMatch = playerPage.match(/let pc = ({.*});/s);
  if (!playerConfigMatch) {
    playerConfigMatch = playerPage.match(/new HDVBPlayer\((.*)\);/s);
  }
  if (!playerConfigMatch) throw new Error('Failed to find player config');
  const playerConfig = JSON.parse(playerConfigMatch[1]);

  const sources = await ctx.proxiedFetcher<any>(
    playerConfig.file.startsWith('/playlist') ? playerConfig.file : `/playlist/${playerConfig.file}`,
    {
      baseUrl: mainUrl,
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': playerConfig.key,
        Referer: `${mainUrl}/`,
        Origin: mainUrl,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
        'Content-type': 'application/x-www-form-urlencoded',
      },
    },
  );

  const media = ctx.media as ShowMedia;
  const season = sources.find((s: any) => s.title === `Season ${media.season.number}`);
  if (!season) throw new NotFoundError('Season not found');

  const episode = season.folder.find((e: any) => e.episode === `${media.episode.number}`);
  if (!episode) throw new NotFoundError('Episode not found');

  const englishSource = episode.folder.find((f: any) => f.title === 'English');
  if (!englishSource) throw new NotFoundError('No english source found for episode');
  let finalFilePath = englishSource.file;

  if (finalFilePath.startsWith('~')) {
    finalFilePath = finalFilePath.substring(1);
  }

  const finalUrl = await ctx.proxiedFetcher<string>(`/playlist/${finalFilePath}.txt`, {
    baseUrl: mainUrl,
    method: 'POST',
    headers: {
      'X-CSRF-TOKEN': playerConfig.key,
      Referer: `${mainUrl}/play/${imdbId}`,
      Origin: mainUrl,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:141.0) Gecko/20100101 Firefox/141.0',
      'Content-type': 'application/x-www-form-urlencoded',
    },
  });

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: finalUrl,
        flags: [],
        captions: [],
      },
    ],
  };
}

export const vidsrcWTFScraper = makeSourcerer({
  id: 'vidsrcwtf',
  name: 'VidSrcWT ☄️',
  rank: 179,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie,
  scrapeShow,
});
