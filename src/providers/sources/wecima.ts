import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://wecima.tube';

async function searchWecima(ctx: MovieScrapeContext | ShowScrapeContext, titleToSearch: string): Promise<string | null> {
  const searchUrl = `${baseUrl}/search/${encodeURIComponent(titleToSearch)}/`;
  const html = await ctx.proxiedFetcher<string>(searchUrl);
  const $ = load(html);
  const firstResultLink = $('.Grid--WecimaPosts .GridItem a').first().attr('href');
  return firstResultLink ? `${baseUrl}${firstResultLink}` : null;
}

async function getEmbedUrlFromContentPage(ctx: MovieScrapeContext | ShowScrapeContext, contentPageUrl: string): Promise<string | null> {
  const html = await ctx.proxiedFetcher<string>(contentPageUrl);
  const $ = load(html);
  const embedUrl = $('meta[itemprop="embedURL"]').attr('content');
  return embedUrl ?? null;
}

async function getFinalVideoUrlFromEmbedPage(ctx: MovieScrapeContext | ShowScrapeContext, embedUrl: string): Promise<string | null> {
  const html = await ctx.proxiedFetcher<string>(embedUrl);
  const $ = load(html);
  const videoSourceUrl = $('source[type="video/mp4"]').attr('src');
  return videoSourceUrl ?? null;
}

async function getTvEpisodePageUrl(ctx: ShowScrapeContext, seriesPageUrl: string): Promise<string | null> {
  const seriesHtml = await ctx.proxiedFetcher<string>(seriesPageUrl);
  const series$ = load(seriesHtml);

  let seasonUrl: string | undefined;
  series$('.List--Seasons--Episodes a').each((_, el) => {
    const linkText = series$(el).text().trim();
    if (linkText.includes(`موسم ${ctx.media.season.number}`)) {
      seasonUrl = series$(el).attr('href');
      return false;
    }
  });
  if (!seasonUrl) throw new NotFoundError(`Season ${ctx.media.season.number} not found on Wecima`);
  if (!seasonUrl.startsWith('http')) seasonUrl = `${baseUrl}${seasonUrl}`;


  const seasonHtml = await ctx.proxiedFetcher<string>(seasonUrl);
  const season$ = load(seasonHtml);

  let episodeUrl: string | undefined;
  season$('.Episodes--Seasons--Episodes a').each((_, el) => {
    const episodeTitle = season$(el).find('episodetitle').text().trim();
    if (episodeTitle === `الحلقة ${ctx.media.episode.number}`) {
      episodeUrl = season$(el).attr('href');
      return false;
    }
  });
  if (!episodeUrl) throw new NotFoundError(`Episode ${ctx.media.episode.number} for season ${ctx.media.season.number} not found on Wecima`);
  if (!episodeUrl.startsWith('http')) episodeUrl = `${baseUrl}${episodeUrl}`;

  return episodeUrl;
}

const universalScraper = async (ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> => {
  const titleToSearch = ctx.media.title;
  if (!titleToSearch) throw new NotFoundError('Media title is required for this source');

  ctx.progress(10);
  const contentRootUrl = await searchWecima(ctx, titleToSearch);
  if (!contentRootUrl) throw new NotFoundError(`No Wecima search results for: ${titleToSearch}`);
  ctx.progress(30);

  let contentPageUrl: string;

  if (ctx.media.type === 'show') {
    const episodePageUrl = await getTvEpisodePageUrl(ctx, contentRootUrl as string);
    if (!episodePageUrl) throw new NotFoundError('TV episode page URL not found');
    contentPageUrl = episodePageUrl;
  } else {
    contentPageUrl = contentRootUrl as string;
  }
  ctx.progress(50);

  const embedUrl = await getEmbedUrlFromContentPage(ctx, contentPageUrl);
  if (!embedUrl) throw new NotFoundError('Embed URL not found on content page');
  ctx.progress(70);

  const finalVideoUrl = await getFinalVideoUrlFromEmbedPage(ctx, embedUrl);
  if (!finalVideoUrl) throw new NotFoundError('Final video URL not found from embed page');
  ctx.progress(90);

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'file',
        flags: [flags.CORS_ALLOWED],
        qualities: {
          unknown: {
            type: 'mp4',
            url: finalVideoUrl,
          },
        },
        captions: [],
        headers: {
          Referer: baseUrl,
        },
      },
    ],
  };
};

export const wecimaScraper = makeSourcerer({
  id: 'wecima',
  name: 'Wecima',
  rank: 100,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: universalScraper,
  scrapeShow: universalScraper,
});
