import { flags } from '@/entrypoint/utils/targets';
import { EmbedOutput, makeEmbed } from '@/providers/base';
import { NotFoundError } from '@/utils/errors';

export const hianimeHd1DubEmbed = makeEmbed({
  id: 'hianime-hd1-dub',
  name: 'Hianime HD-1 (Dub)',
  disabled: true,
  rank: 250,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const url = `https://hianime.pstream.org/api/v2/hianime/episode/sources?animeEpisodeId=${query.episodeId}&server=hd-1&category=dub`;

    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (!data.data?.sources?.[0]?.url) throw new NotFoundError('No stream URL found in response');

    const thumbnailTrack = data.data.tracks?.find((track: { kind: string }) => track.kind === 'thumbnails')?.file;

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.data.sources[0].url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
          ...(thumbnailTrack
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: thumbnailTrack,
                },
              }
            : {}),
          headers: data.data.headers,
        },
      ],
    };
  },
});

export const hianimeHd2DubEmbed = makeEmbed({
  id: 'hianime-hd2-dub',
  name: 'Hianime HD-2 (Dub)',
  rank: 251,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const url = `https://hianime.pstream.org/api/v2/hianime/episode/sources?animeEpisodeId=${query.episodeId}&server=hd-2&category=dub`;

    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (!data.data?.sources?.[0]?.url) throw new NotFoundError('No stream URL found in response');

    const thumbnailTrack = data.data.tracks?.find((track: { kind: string }) => track.kind === 'thumbnails')?.file;

    return {
      // stream: [
      //   {
      //     type: 'hls',
      //     id: 'primary',
      //     playlist: data.data.sources[0].url,
      //     flags: [flags.CORS_ALLOWED],
      //     captions: [],
      //     ...(thumbnailTrack
      //       ? {
      //           thumbnailTrack: {
      //             type: 'vtt',
      //             url: thumbnailTrack,
      //           },
      //         }
      //       : {}),
      //     headers: data.data.headers,
      //   },
      // ],
      stream: [
        {
          type: 'file',
          id: 'primary',
          qualities: {
            unknown: {
              type: 'mp4',
              url: data.data.sources[0].url,
            },
          },
          flags: [flags.CORS_ALLOWED],
          captions: [],
          ...(thumbnailTrack
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: thumbnailTrack,
                },
              }
            : {}),
          headers: data.data.headers,
        },
      ],
    };
  },
});

export const hianimeHd1SubEmbed = makeEmbed({
  id: 'hianime-hd1-sub',
  name: 'Hianime HD-1 (Sub)',
  disabled: true,
  rank: 252,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const url = `https://hianime.pstream.org/api/v2/hianime/episode/sources?animeEpisodeId=${query.episodeId}&server=hd-1&category=sub`;

    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (!data.data?.sources?.[0]?.url) throw new NotFoundError('No stream URL found in response');

    const thumbnailTrack = data.data.tracks?.find((track: { kind: string }) => track.kind === 'thumbnails')?.file;

    return {
      stream: [
        {
          type: 'hls',
          id: 'primary',
          playlist: data.data.sources[0].url,
          flags: [flags.CORS_ALLOWED],
          captions: [],
          ...(thumbnailTrack
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: thumbnailTrack,
                },
              }
            : {}),
          headers: data.data.headers,
        },
      ],
    };
  },
});

export const hianimeHd2SubEmbed = makeEmbed({
  id: 'hianime-hd2-sub',
  name: 'Hianime HD-2 (Sub)',
  rank: 253,
  async scrape(ctx): Promise<EmbedOutput> {
    const query = JSON.parse(ctx.url);
    const url = `https://hianime.pstream.org/api/v2/hianime/episode/sources?animeEpisodeId=${query.episodeId}&server=hd-2&category=sub`;

    const data = await ctx.fetcher(url);
    if (!data) throw new NotFoundError('No response received');
    if (!data.data?.sources?.[0]?.url) throw new NotFoundError('No stream URL found in response');

    const thumbnailTrack = data.data.tracks?.find((track: { kind: string }) => track.kind === 'thumbnails')?.file;

    return {
      // stream: [
      //   {
      //     type: 'hls',
      //     id: 'primary',
      //     playlist: data.data.sources[0].url,
      //     flags: [flags.CORS_ALLOWED],
      //     captions: [],
      //     ...(thumbnailTrack
      //       ? {
      //           thumbnailTrack: {
      //             type: 'vtt',
      //             url: thumbnailTrack,
      //           },
      //         }
      //       : {}),
      //     headers: data.data.headers,
      //   },
      // ],
      stream: [
        {
          type: 'file',
          id: 'primary',
          qualities: {
            unknown: {
              type: 'mp4',
              url: data.data.sources[0].url,
            },
          },
          flags: [flags.CORS_ALLOWED],
          captions: [],
          ...(thumbnailTrack
            ? {
                thumbnailTrack: {
                  type: 'vtt',
                  url: thumbnailTrack,
                },
              }
            : {}),
          headers: data.data.headers,
        },
      ],
    };
  },
});
