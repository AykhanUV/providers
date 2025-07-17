import { load } from 'cheerio';

import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://filmekseni.net';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  if (!ctx.media.imdbId) {
    throw new NotFoundError('IMDb ID is required for this scraper');
  }

  const searchResponseString = await ctx.proxiedFetcher<string>(`/search/`, {
    baseUrl,
    method: 'POST',
    body: new URLSearchParams({
      query: ctx.media.imdbId,
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: baseUrl,
      Origin: baseUrl,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.9',
      'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    },
  });

  const searchResponse = JSON.parse(searchResponseString);

  if (!searchResponse.result || searchResponse.result.length === 0) {
    throw new NotFoundError('No search results found');
  }

  const firstResult = searchResponse.result[0];
  const mediaUrl = `${baseUrl}/${firstResult.slug_prefix}${firstResult.slug}/1`;

  const mediaPage = await ctx.proxiedFetcher<string>(mediaUrl);
  const $ = load(mediaPage);

  const embedUrl = $('.card-video iframe').attr('data-src');
  if (!embedUrl) throw new NotFoundError('No embed found');

  return {
    embeds: [
      {
        embedId: 'vidmoly', // This might need to be changed to a more generic embed id
        url: embedUrl.startsWith('https:') ? embedUrl : `https:${embedUrl}`,
      },
    ],
  };
}

export const filmekseniScraper = makeSourcerer({
  id: 'filmekseni',
  name: 'Ekseni ♠️(Turkish)',
  rank: 181,
  flags: [],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
