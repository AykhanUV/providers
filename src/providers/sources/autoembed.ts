import { flags } from '@/entrypoint/utils/targets';
import { SourcererEmbed, SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const baseUrl = 'https://autoembed.pro';

async function comboScraper(ctx: ShowScrapeContext | MovieScrapeContext): Promise<SourcererOutput> {
  const mediaType = ctx.media.type === 'show' ? 'tv' : 'movie';
  let url = `${baseUrl}/embed/${mediaType}/${ctx.media.tmdbId}`;

  if (ctx.media.type === 'show') {
    url = `${url}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const data = await ctx.proxiedFetcher<string>(url, {
    headers: {
      Referer: baseUrl,
    },
  });

  if (!data) throw new NotFoundError('Failed to fetch video source');

  const sourcesMatch = data.match(/window\.sourceEntries\s*=\s*(\[.*?\]);/);
  if (!sourcesMatch?.[1]) throw new NotFoundError('Failed to find source entries');

  const sources = JSON.parse(sourcesMatch[1]) as Array<{ url: string; language?: string; name?: string }>;
  if (!sources) throw new NotFoundError('Failed to parse source entries');

  const embeds: SourcererEmbed[] = sources
    .filter((s) => s.url)
    .map((source) => {
      const language = (source.language || source.name || 'English').toLowerCase();
      const sourceUrl = new URL(source.url);
      sourceUrl.searchParams.set('lang', language);
      return {
        embedId: 'autoembed',
        url: sourceUrl.toString(),
      };
    });

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
