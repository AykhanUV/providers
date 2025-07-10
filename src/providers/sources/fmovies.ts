import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { Caption } from '@/providers/captions';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

import { upstreamScraper } from '../embeds/upstream';

const baseUrl = 'https://fmovies.ps';

interface StreamData {
  playlist: string;
  tracks?: Caption[];
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  ctx.progress(10);

  // Search for the movie or TV show
  const searchSlug = ctx.media.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
  const urlSearch = `${baseUrl}/search/${searchSlug}`;

  const searchHtml = await ctx.proxiedFetcher(urlSearch);
  if (!searchHtml) {
    throw new NotFoundError('No search results found');
  }

  // Parse the search results using Cheerio
  const search$ = load(searchHtml);

  let detailUrl = '';
  const items = search$('.flw-item');

  ctx.progress(30);

  // Find the correct title from search results
  items.each((_, item) => {
    const titleElement = search$(item).find('.film-poster-ahref');
    const title = titleElement.attr('title');
    const href = titleElement.attr('href');
    const yearElement = search$(item).find('.fdi-item').first();
    const year = yearElement.text().trim();
    const typeElement = search$(item).find('.fdi-type');
    const type = typeElement.text().trim().toLowerCase();

    if (title && href && !detailUrl) {
      // Check if title matches
      if (title.toLowerCase().includes(ctx.media.title.toLowerCase())) {
        // For movies, check both title and year
        if (ctx.media.type === 'movie' && type === 'movie' && year === ctx.media.releaseYear.toString()) {
          detailUrl = href.startsWith('/') ? `${baseUrl}${href}` : href;
        }

        // For TV shows, we'll need to verify the year on the detail page
        if (ctx.media.type === 'show' && type === 'tv') {
          detailUrl = href.startsWith('/') ? `${baseUrl}${href}` : href;
        }
      }
    }
  });

  if (!detailUrl) {
    throw new NotFoundError('Title not found in search results');
  }

  ctx.progress(50);

  // Extract film ID from detail URL
  const filmId = detailUrl.match(/-([0-9]+)$/i)?.[1];
  if (!filmId) {
    throw new NotFoundError('Could not extract film ID');
  }

  // Get servers and streams
  const serverIds: string[] = [];

  if (ctx.media.type === 'movie') {
    // For movies, get list of servers
    const apiUrlEmbed = `${baseUrl}/ajax/episode/list/${filmId}`;
    const embedHtml = await ctx.proxiedFetcher(apiUrlEmbed);
    if (!embedHtml) {
      throw new NotFoundError('No embed servers found');
    }

    const embed$ = load(embedHtml);

    // Extract server IDs
    embed$('.nav-link').each((_, server) => {
      const serverId = embed$(server).attr('data-linkid');
      if (serverId) {
        serverIds.push(serverId);
      }
    });
  } else if (ctx.media.type === 'show') {
    // For TV shows, get season and episode data
    const showCtx = ctx as ShowScrapeContext;
    const apiUrlGetSeason = `${baseUrl}/ajax/season/list/${filmId}`;
    const seasonHtml = await ctx.proxiedFetcher(apiUrlGetSeason);
    if (!seasonHtml) {
      throw new NotFoundError('No seasons found');
    }

    const season$ = load(seasonHtml);

    // Find the right season
    let seasonId = '';
    season$('.ss-item').each((_, season) => {
      const seasonText = season$(season).text();
      const seasonDataId = season$(season).attr('data-id');

      if (seasonText && seasonDataId) {
        const seasonNum = seasonText.match(/([0-9]+)/)?.[1];
        if (seasonNum && Number(seasonNum) === showCtx.media.season.number) {
          seasonId = seasonDataId;
        }
      }
    });

    if (!seasonId) {
      throw new NotFoundError('Season not found');
    }

    // Get episodes for the season
    const apiUrlGetEpisode = `${baseUrl}/ajax/season/episodes/${seasonId}`;
    const episodeHtml = await ctx.proxiedFetcher(apiUrlGetEpisode);
    if (!episodeHtml) {
      throw new NotFoundError('No episodes found');
    }

    const episode$ = load(episodeHtml);

    // Find the right episode
    let episodeId = '';
    episode$('.eps-item').each((_, episode) => {
      const episodeText = episode$(episode).find('strong').text();
      const episodeDataId = episode$(episode).attr('data-id');

      if (episodeText && episodeDataId) {
        const episodeNum = episodeText.match(/([0-9]+)/)?.[1];
        if (episodeNum && Number(episodeNum) === showCtx.media.episode.number) {
          episodeId = episodeDataId;
        }
      }
    });

    if (!episodeId) {
      throw new NotFoundError('Episode not found');
    }

    // Get servers for the episode
    const urlGetEmbedTv = `${baseUrl}/ajax/episode/servers/${episodeId}`;
    const embedTvHtml = await ctx.proxiedFetcher(urlGetEmbedTv);
    if (!embedTvHtml) {
      throw new NotFoundError('No embed servers found for episode');
    }

    const embedTv$ = load(embedTvHtml);

    // Extract server IDs
    embedTv$('.nav-link').each((_, server) => {
      const serverId = embedTv$(server).attr('data-id');
      if (serverId) {
        serverIds.push(serverId);
      }
    });
  }

  if (serverIds.length === 0) {
    throw new NotFoundError('No servers found');
  }

  ctx.progress(70);

  // Try to get streams from each server
  const apiGetLinkEmbed = `${baseUrl}/ajax/episode/sources/`;

  const embeds = [];
  for (const serverId of serverIds) {
    try {
      let embedData = await ctx.proxiedFetcher(apiGetLinkEmbed + serverId);
      if (typeof embedData === 'string') embedData = JSON.parse(embedData);
      if (!embedData?.link) continue;

      const embedLink = embedData.link;
      embeds.push({
        embedId: 'upstream',
        url: embedLink,
      });
    } catch (error) {
      continue;
    }
  }

  return {
    embeds,
    stream: [],
  };
}

export const fmoviesScraper = makeSourcerer({
  id: 'fmovies',
  name: 'FMovies',
  rank: 171,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
