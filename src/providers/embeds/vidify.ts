/* eslint-disable no-console */
import { flags } from '@/entrypoint/utils/targets';
import { NotFoundError } from '@/utils/errors';
import { createM3U8ProxyUrl } from '@/utils/proxy';

import { EmbedOutput, makeEmbed } from '../base';

const VIDIFY_SERVERS = ['alfa', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliett'];

// Do not do this. This is very lazy!
const M3U8_URL_REGEX = /https?:\/\/[^\s"'<>]+?\.m3u8[^\s"'<>]*/i;

function extractFromString(input: string): string | null {
  const match = input.match(M3U8_URL_REGEX);
  return match ? match[0] : null;
}

function findFirstM3U8Url(input: unknown): string | null {
  // eslint-disable-next-line no-console
  console.log(input);
  const visited = new Set<unknown>();

  function dfs(node: unknown): string | null {
    if (node == null) return null;
    if (visited.has(node)) return null;
    // Only mark objects/arrays as visited to avoid blocking primitives
    if (typeof node === 'object') visited.add(node);

    if (typeof node === 'string') {
      return extractFromString(node);
    }

    if (Array.isArray(node)) {
      for (const element of node) {
        const found = dfs(element);
        if (found) return found;
      }
      return null;
    }

    if (typeof node === 'object') {
      for (const value of Object.values(node as Record<string, unknown>)) {
        if (typeof value === 'string') {
          const foundInString = extractFromString(value);
          if (foundInString) return foundInString;
        } else {
          const found = dfs(value);
          if (found) return found;
        }
      }
    }

    return null;
  }

  return dfs(input);
}

const baseUrl = 'api.vidify.top';
const headers = {
  referer: 'https://player.vidify.top/',
  origin: 'https://player.vidify.top',
  Authorization: 'Bearer scraper_ki_ma_ka_server',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
};

export function makeVidifyEmbed(id: string, rank: number = 100) {
  const serverIndex = VIDIFY_SERVERS.indexOf(id) + 1;

  return makeEmbed({
    id: `vidify-${id}`,
    name: `Vidify ${id.charAt(0).toUpperCase() + id.slice(1)}`,
    rank,
    async scrape(ctx): Promise<EmbedOutput> {
      const query = JSON.parse(ctx.url);
      const { type, tmdbId, season, episode } = query;

      let url = `https://${baseUrl}/`;

      if (type === 'movie') {
        url += `/movie/${tmdbId}?sr=${serverIndex}`;
      } else if (type === 'show') {
        url += `/tv/${tmdbId}/season/${season}/episode/${episode}?sr=${serverIndex}`;
      } else {
        throw new NotFoundError('Unsupported media type');
      }

      const res = await ctx.proxiedFetcher(url, { headers });

      const playlistUrl = findFirstM3U8Url(res);
      if (playlistUrl) {
        if (playlistUrl.includes('https://live.adultiptv.net/rough.m3u8')) {
          throw new NotFoundError('No playlist URL found');
        }
      }
      if (!playlistUrl) {
        throw new NotFoundError('No playlist URL found');
      }

      ctx.progress(100);

      return {
        stream: [
          {
            id: 'primary',
            type: 'hls',
            playlist: createM3U8ProxyUrl(playlistUrl, headers),
            flags: [flags.CORS_ALLOWED],
            captions: [],
          },
        ],
      };
    },
  });
}

export const vidifyEmbeds = VIDIFY_SERVERS.map((server, i) => makeVidifyEmbed(server, 230 - i));
