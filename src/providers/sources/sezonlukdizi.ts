import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { compareTitle } from '@/utils/compare';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const sezondiziBase = 'https://sezonlukdizi6.com';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  ctx.progress(10);
  const searchResult = await ctx.proxiedFetcher<string>(
    `${sezondiziBase}/diziler.asp?adi=${encodeURIComponent(ctx.media.title)}`,
  );
  const $search = load(searchResult);

  let mediaPageLink: string | undefined;
  $search('a.column').each((_, element) => {
    const card$ = $search(element);
    const title = card$.attr('title');
    if (title && compareTitle(title.replace(' izle', ''), ctx.media.title)) {
      mediaPageLink = card$.attr('href');
      return false; // stop iterating
    }
  });

  if (!mediaPageLink) {
    throw new NotFoundError('Could not find a matching media item on search results');
  }

  ctx.progress(30);
  let finalPageUrl: string;
  if (ctx.media.type === 'show') {
    const seriesSlug = mediaPageLink.replace('/diziler/', '').replace('.html', '');
    finalPageUrl = `${sezondiziBase}/${seriesSlug}/dublaj/${ctx.media.season.number}-sezon-${ctx.media.episode.number}-bolum.html`;
  } else {
    finalPageUrl = `${sezondiziBase}${mediaPageLink}`;
  }

  ctx.progress(60);
  const finalPage = await ctx.proxiedFetcher<string>(finalPageUrl);
  const $final = load(finalPage);

  const episodeId = $final('#dilsec[data-dil="0"]').attr('data-id');
  if (!episodeId) {
    throw new NotFoundError('Could not find episode ID');
  }

  const alternativesResponse = await ctx.proxiedFetcher<string>(`/ajax/dataAlternatif22.asp`, {
    baseUrl: sezondiziBase,
    method: 'POST',
    body: `bid=${episodeId}&dil=0`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: finalPageUrl,
    },
  });

  const alternatives = JSON.parse(alternativesResponse);

  if (alternatives.status !== 'success') {
    throw new NotFoundError('Failed to fetch alternatives');
  }

  const vidmolySource = alternatives.data.find((s: any) => s.baslik.toLowerCase().includes('vidmoly'));
  if (!vidmolySource) {
    throw new NotFoundError('Could not find VidMoly in alternatives');
  }

  const embedPage = await ctx.proxiedFetcher<string>(`/ajax/dataEmbed22.asp`, {
    baseUrl: sezondiziBase,
    method: 'POST',
    body: `id=${vidmolySource.id}`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      Referer: finalPageUrl,
    },
  });

  const $embed = load(embedPage);
  const embedUrl = $embed('iframe').attr('src');

  if (!embedUrl || !embedUrl.includes('vidmoly')) {
    throw new NotFoundError('Could not find VidMoly embed in final response');
  }

  ctx.progress(90);

  return {
    embeds: [
      {
        embedId: 'vidmoly',
        url: `https:${embedUrl}`,
      },
    ],
  };
}

export const sezonlukdiziScraper = makeSourcerer({
  id: 'sezonlukdizi',
  name: 'SzDizi 🍭(Turkish)',
  rank: 500,
  flags: [flags.CORS_ALLOWED],
  scrapeShow: comboScraper,
});
