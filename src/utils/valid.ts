// import { alphaScraper, deltaScraper } from '@/providers/embeds/nsbx';
// import { astraScraper, novaScraper, orionScraper } from '@/providers/embeds/whvx';
import {
  oneServerAnimepaheEmbed,
  oneServerAnizoneEmbed,
  oneServerAutoembedEmbed,
  oneServerFlixhqEmbed,
  oneServerFoxstreamEmbed,
  oneServerGokuEmbed,
  oneServerHianimeEmbed,
  oneServerPrimeboxEmbed,
  oneServerVidsrcsuEmbed,
} from '@/providers/embeds/1server';
import { cinemaosHexaEmbeds } from '@/providers/embeds/cinemaos';
import {
  ConsumetStreamSBScraper,
  ConsumetStreamTapeScraper,
  ConsumetVidCloudScraper,
  ConsumetVidStreamingScraper,
} from '@/providers/embeds/consumet';
import { FedAPIPrivateScraper, FedDBScraper } from '@/providers/embeds/fedapi';
import {
  hianimeHd1DubEmbed,
  hianimeHd1SubEmbed,
  hianimeHd2DubEmbed,
  hianimeHd2SubEmbed,
} from '@/providers/embeds/hianime';
import {
  streamwishEnglishScraper,
  streamwishLatinoScraper,
  streamwishSpanishScraper,
} from '@/providers/embeds/streamwish';
import { turbovidScraper } from '@/providers/embeds/turbovid';
import { vidmolyScraper } from '@/providers/embeds/vidmoly';
import { vidsrcNovaEmbed } from '@/providers/embeds/vidsrcvip';
import { viperScraper } from '@/providers/embeds/viper';
import { warezcdnembedMp4Scraper } from '@/providers/embeds/warezcdn/mp4';
import {
  xprimeApolloEmbed,
  xprimeFendiEmbed,
  xprimeFoxEmbed,
  xprimeHarbourEmbed,
  xprimeMarantEmbed,
  xprimePhoenixEmbed,
  xprimePrimenetEmbed,
  xprimeStreamboxEmbed,
  xprimeVolkswagenEmbed,
} from '@/providers/embeds/xprime';
import { embedsuScraper } from '@/providers/sources/embedsu';
import { nepuScraper } from '@/providers/sources/nepu';
import { pirxcyScraper } from '@/providers/sources/pirxcy';
import { soaperTvScraper } from '@/providers/sources/soapertv';
import { uiraliveScraper } from '@/providers/sources/uiralive';
import { vidsrcScraper } from '@/providers/sources/vidsrc';
import { wecimaScraper } from '@/providers/sources/wecima';
import { Stream } from '@/providers/streams';
import { IndividualEmbedRunnerOptions } from '@/runners/individualRunner';
import { ProviderRunnerOptions } from '@/runners/runner';

const SKIP_VALIDATION_CHECK_IDS = [
  warezcdnembedMp4Scraper.id,
  // deltaScraper.id,
  // alphaScraper.id,
  // novaScraper.id,
  // astraScraper.id,
  // orionScraper.id,
  viperScraper.id,
  streamwishLatinoScraper.id,
  streamwishSpanishScraper.id,
  streamwishEnglishScraper.id,
  uiraliveScraper.id,
  embedsuScraper.id,
  FedAPIPrivateScraper.id,
  FedDBScraper.id,
  xprimeFoxEmbed.id,
  xprimeApolloEmbed.id,
  xprimeStreamboxEmbed.id,
  xprimeMarantEmbed.id,
  xprimeFendiEmbed.id,
  xprimePrimenetEmbed.id,
  xprimeVolkswagenEmbed.id,
  xprimeHarbourEmbed.id,
  xprimePhoenixEmbed.id,
  ConsumetVidCloudScraper.id,
  ConsumetStreamSBScraper.id,
  ConsumetVidStreamingScraper.id,
  ConsumetStreamTapeScraper.id,
  hianimeHd1DubEmbed.id,
  hianimeHd1SubEmbed.id,
  hianimeHd2DubEmbed.id,
  hianimeHd2SubEmbed.id,
  oneServerAutoembedEmbed.id,
  oneServerVidsrcsuEmbed.id,
  oneServerPrimeboxEmbed.id,
  oneServerFoxstreamEmbed.id,
  oneServerFlixhqEmbed.id,
  oneServerGokuEmbed.id,
  oneServerHianimeEmbed.id,
  oneServerAnimepaheEmbed.id,
  oneServerAnizoneEmbed.id,
  wecimaScraper.id,
  ...cinemaosHexaEmbeds.map((e) => e.id),
  soaperTvScraper.id,
  vidsrcScraper.id,
  turbovidScraper.id,
  nepuScraper.id,
  pirxcyScraper.id,
  vidsrcNovaEmbed.id,
  vidmolyScraper.id,
];

export function isValidStream(stream: Stream | undefined): boolean {
  if (!stream) return false;
  if (stream.type === 'hls') {
    if (!stream.playlist) return false;
    return true;
  }
  if (stream.type === 'file') {
    const validQualities = Object.values(stream.qualities).filter((v) => v.url.length > 0);
    if (validQualities.length === 0) return false;
    return true;
  }

  // unknown file type
  return false;
}

export async function validatePlayableStream(
  stream: Stream,
  ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions,
  sourcererId: string,
): Promise<Stream | null> {
  if (SKIP_VALIDATION_CHECK_IDS.includes(sourcererId)) return stream;

  if (stream.type === 'hls') {
    // dirty temp fix for base64 urls to prep for fmhy poll
    if (stream.playlist.startsWith('data:')) return stream;

    const result = await ops.proxiedFetcher.full(stream.playlist, {
      method: 'GET',
      headers: {
        ...stream.preferredHeaders,
        ...stream.headers,
      },
    });
    if (result.statusCode < 200 || result.statusCode >= 400) return null;
    return stream;
  }
  if (stream.type === 'file') {
    const validQualitiesResults = await Promise.all(
      Object.values(stream.qualities).map((quality) =>
        ops.proxiedFetcher.full(quality.url, {
          method: 'GET',
          headers: {
            ...stream.preferredHeaders,
            ...stream.headers,
            Range: 'bytes=0-1',
          },
        }),
      ),
    );
    // remove invalid qualities from the stream
    const validQualities = stream.qualities;
    Object.keys(stream.qualities).forEach((quality, index) => {
      if (validQualitiesResults[index].statusCode < 200 || validQualitiesResults[index].statusCode >= 400) {
        delete validQualities[quality as keyof typeof stream.qualities];
      }
    });

    if (Object.keys(validQualities).length === 0) return null;
    return { ...stream, qualities: validQualities };
  }
  return null;
}

export async function validatePlayableStreams(
  streams: Stream[],
  ops: ProviderRunnerOptions | IndividualEmbedRunnerOptions,
  sourcererId: string,
): Promise<Stream[]> {
  if (SKIP_VALIDATION_CHECK_IDS.includes(sourcererId)) return streams;

  return (await Promise.all(streams.map((stream) => validatePlayableStream(stream, ops, sourcererId)))).filter(
    (v) => v !== null,
  ) as Stream[];
}
