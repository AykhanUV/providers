import json5 from 'json5';

import { flags } from '@/entrypoint/utils/targets';
import { SourcererOutput, makeSourcerer } from '@/providers/base';
import { MovieScrapeContext, ShowScrapeContext } from '@/utils/context';
import { NotFoundError } from '@/utils/errors';

const vixsrcBase = 'https://vixsrc.to';

type MasterPlaylist = {
  params: {
    token: string;
    expires: string;
  };
  url: string;
};

async function comboScraper(ctx: MovieScrapeContext | ShowScrapeContext): Promise<SourcererOutput> {
  let url: string;
  if (ctx.media.type === 'movie') {
    url = `${vixsrcBase}/movie/${ctx.media.tmdbId}`;
  } else {
    url = `${vixsrcBase}/tv/${ctx.media.tmdbId}/${ctx.media.season.number}/${ctx.media.episode.number}`;
  }

  const mainPage = await ctx.proxiedFetcher<string>(url);

  const masterPlaylistMatch = mainPage.match(/window\.masterPlaylist\s*=\s*({[\s\S]*?}(?!,));?/s);
  if (!masterPlaylistMatch || !masterPlaylistMatch[1]) {
    throw new NotFoundError('Could not find master playlist');
  }
  const masterPlaylist: MasterPlaylist = json5.parse(masterPlaylistMatch[1]);

  const playlistUrl = new URL(masterPlaylist.url);
  Object.entries(masterPlaylist.params).forEach(([key, value]) => {
    if (value) {
      playlistUrl.searchParams.set(key, value);
    }
  });
  playlistUrl.searchParams.set('h', '1');
  playlistUrl.searchParams.set('lang', 'en');

  return {
    embeds: [],
    stream: [
      {
        id: 'primary',
        type: 'hls',
        playlist: playlistUrl.toString(),
        flags: [flags.CORS_ALLOWED],
        captions: [],
      },
    ],
  };
}

export const vixsrcScraper = makeSourcerer({
  id: 'vixsrc',
  name: 'VixSrc ⚙️(Italian)',
  rank: 172,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
