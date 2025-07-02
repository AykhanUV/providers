/* eslint-disable no-console */
import { load } from 'cheerio';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://autoembed.pro';

// Custom atob function from embedsu
async function stringAtob(input: string): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) {
    throw new Error('The string to be decoded is not correctly encoded.');
  }
  for (let bc = 0, bs = 0, i = 0; i < str.length; i++) {
    const buffer = str.charAt(i);
    const charIndex = chars.indexOf(buffer);
    if (charIndex === -1) continue;
    bs = bc % 4 ? bs * 64 + charIndex : charIndex;
    if (bc++ % 4) {
      output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6)));
    }
  }
  return output;
}

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaType = ctx.media.type === 'show' ? 'tv' : 'movie';
  let url = `${baseUrl}/embed/${mediaType}/${ctx.media.tmdbId}`;

  if (ctx.media.type === 'show') {
    url = `${url}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const data = await ctx.proxiedFetcher<any>(url, {
    headers: {
      Referer: baseUrl,
    },
  });

  if (!data) throw new NotFoundError('Failed to fetch video source');

  const $ = load(data);
  let iframeSrc = $('iframe').attr('src');

  if (!iframeSrc) {
    const vConfigMatch = data.match(/window\.vConfig\s*=\s*JSON\.parse\(atob\(`([^`]+)/i);
    const encodedConfig = vConfigMatch?.[1];
    if (encodedConfig) {
      const decodedConfig = JSON.parse(await stringAtob(encodedConfig));
      if (decodedConfig?.url) {
        iframeSrc = decodedConfig.url;
      }
    }
  }

  if (!iframeSrc) throw new NotFoundError('Failed to find iframe src');

  ctx.progress(50);

  const embeds: SourcererEmbed[] = [
    {
      embedId: `autoembed-english`,
      url: iframeSrc,
    },
  ];

  ctx.progress(90);

  return {
    embeds,
  };
}

export const autoembedScraper = makeSourcerer({
  id: 'autoembed',
  name: 'Autoembed 🔮',
  rank: 550,
  disabled: false,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
