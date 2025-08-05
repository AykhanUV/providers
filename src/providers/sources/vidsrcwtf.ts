import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const mainUrl = 'https://dezzu370xol.com';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
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

export const vidsrcWTFScraper = makeSourcerer({
  id: 'vidsrcwtf',
  name: 'VidSrc.WT',
  rank: 179,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
