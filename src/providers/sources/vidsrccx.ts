import CryptoJS from 'crypto-js';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const CDN_HOSTNAME = 'vidsrccx.b-cdn.net';
const SECURITY_KEY = '83f1da34-e937-4735-a51c-c544700168da';

function signUrl(
  url: string,
  securityKey: string,
  expirationTime = 3600,
  userIp: string | null = null,
  isDirectory = false,
  pathAllowed: string | null = null,
) {
  const urlObj = new URL(url);
  const protocol = urlObj.protocol;
  const host = urlObj.host;
  const path = urlObj.pathname;
  const queryParams = urlObj.searchParams;

  let pathForSigning = path;
  if (pathAllowed) {
    pathForSigning = pathAllowed;
    queryParams.set('token_path', pathForSigning);
  }

  const expires = Math.floor(Date.now() / 1000) + expirationTime;
  const sortedParams = Array.from(queryParams.keys()).sort();

  let queryParamString = '';
  let queryParamStringUrl = '';
  sortedParams.forEach((key) => {
    if (queryParamString.length > 0) {
      queryParamString += '&';
      queryParamStringUrl += '&';
    }
    queryParamString += `${key}=${queryParams.get(key)}`;
    queryParamStringUrl += `${key}=${encodeURIComponent(queryParams.get(key) || '')}`;
  });

  let stringToSign = securityKey + pathForSigning + expires;
  if (userIp) {
    stringToSign += userIp;
  }
  stringToSign += queryParamString;

  const hash = CryptoJS.SHA256(stringToSign);
  const token = CryptoJS.enc.Base64.stringify(hash).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

  if (isDirectory) {
    return `${protocol}//${host}/bcdn_token=${token}&expires=${expires}${queryParamStringUrl ? `&${queryParamStringUrl}` : ''}${path}`;
  }
  return `${protocol}//${host}${path}?token=${token}${queryParamStringUrl ? `&${queryParamStringUrl}` : ''}&expires=${expires}`;
}

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  const media = ctx.media;
  let path;

  if (media.type === 'movie') {
    path = `/media/${media.tmdbId}/master.m3u8`;
  } else if (media.type === 'show') {
    path = `/media/${media.tmdbId}-${media.season.number}-${media.episode.number}/master.m3u8`;
  } else {
    throw new NotFoundError('Unsupported media type');
  }

  const signedUrl = signUrl(
    `https://${CDN_HOSTNAME}${path}`,
    SECURITY_KEY,
    3600,
    null,
    true,
    `/media/${media.tmdbId}/`,
  );

  const res = await ctx.proxiedFetcher.full(signedUrl, {
    method: 'HEAD',
  });

  if (res.statusCode !== 200) throw new NotFoundError('stream not found');

  return {
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: signedUrl,
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
  rank: 173,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
});
