import { Embed, Sourcerer } from '@/providers/base';
import { doodScraper } from '@/providers/embeds/dood';
import {
  hianimeHd1DubEmbed,
  hianimeHd1SubEmbed,
  hianimeHd2DubEmbed,
  hianimeHd2SubEmbed,
} from '@/providers/embeds/hianime';
import { mixdropScraper } from '@/providers/embeds/mixdrop';
import { turbovidScraper } from '@/providers/embeds/turbovid';
import { upcloudScraper } from '@/providers/embeds/upcloud';
import { vidmolyScraper } from '@/providers/embeds/vidmoly';
import { vidsrcCometEmbed, vidsrcNovaEmbed, vidsrcPulsarEmbed } from '@/providers/embeds/vidsrcvip';
import { aetherScraper } from '@/providers/sources/aether';
import { autoembedScraper } from '@/providers/sources/autoembed';
import { catflixScraper } from '@/providers/sources/catflix';
import { ee3Scraper } from '@/providers/sources/ee3';
import { fsharetvScraper } from '@/providers/sources/fsharetv';
import { hianimeScraper } from '@/providers/sources/hianime';
import { insertunitScraper } from '@/providers/sources/insertunit';
import { meridianScraper } from '@/providers/sources/meridian';
import { mp4hydraScraper } from '@/providers/sources/mp4hydra';
import { nepuScraper } from '@/providers/sources/nepu';
import { pirxcyScraper } from '@/providers/sources/pirxcy';
import { tugaflixScraper } from '@/providers/sources/tugaflix';
import { videasyScraper } from '@/providers/sources/videasy';
import { vidsrcScraper } from '@/providers/sources/vidsrc';
import { vidsrccxScraper } from '@/providers/sources/vidsrccx';
import { vidsrcsuScraper } from '@/providers/sources/vidsrcsu';
import { vidsrcvipScraper } from '@/providers/sources/vidsrcvip';
import { vidsrcWTFScraper } from '@/providers/sources/vidsrcwtf';
import { vixsrcScraper } from '@/providers/sources/vixsrc';
import { zoechipScraper } from '@/providers/sources/zoechip';

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
} from './embeds/1server';
import { animetsuScraper } from './sources/animetsu';
import {
  autoembedBengaliScraper,
  autoembedEnglishScraper,
  autoembedHindiScraper,
  autoembedTamilScraper,
  autoembedTeluguScraper,
} from './embeds/autoembed';
import { cinemaosEmbeds } from './embeds/cinemaos';
import { closeLoadScraper } from './embeds/closeload';
import {
  ConsumetStreamSBScraper,
  ConsumetStreamTapeScraper,
  ConsumetVidCloudScraper,
  ConsumetVidStreamingScraper,
} from './embeds/consumet';
import { madplayBaseEmbed, madplayNsapiEmbed, madplayNsapiVidFastEmbed, madplayRoperEmbed } from './embeds/madplay';
import { mp4hydraServer1Scraper, mp4hydraServer2Scraper } from './embeds/mp4hydra';
import { ridooScraper } from './embeds/ridoo';
import { streamtapeLatinoScraper, streamtapeScraper } from './embeds/streamtape';
import { streamvidScraper } from './embeds/streamvid';
import {
  streamwishEnglishScraper,
  streamwishJapaneseScraper,
  streamwishLatinoScraper,
  streamwishSpanishScraper,
} from './embeds/streamwish';
import { vidCloudScraper } from './embeds/vidcloud';
import { vidifyEmbeds } from './embeds/vidify';
import {
  VidsrcsuServer10Scraper,
  VidsrcsuServer11Scraper,
  VidsrcsuServer12Scraper,
  VidsrcsuServer1Scraper,
  VidsrcsuServer20Scraper,
  VidsrcsuServer2Scraper,
  VidsrcsuServer3Scraper,
  VidsrcsuServer4Scraper,
  VidsrcsuServer5Scraper,
  VidsrcsuServer6Scraper,
  VidsrcsuServer7Scraper,
  VidsrcsuServer8Scraper,
  VidsrcsuServer9Scraper,
} from './embeds/vidsrcsu';
import { vidzeeServer1Embed, vidzeeServer2Embed } from './embeds/vidzee';
import { viperScraper } from './embeds/viper';
import { warezcdnembedHlsScraper } from './embeds/warezcdn/hls';
import { warezcdnembedMp4Scraper } from './embeds/warezcdn/mp4';
import { warezPlayerScraper } from './embeds/warezcdn/warezplayer';
import { webtor1080Scraper, webtor480Scraper, webtor4kScraper, webtor720Scraper } from './embeds/webtor';
import {
  xprimeApolloEmbed,
  xprimeFendiEmbed,
  xprimeFoxEmbed,
  xprimeHarbourEmbed,
  xprimeKrakenEmbed,
  xprimeMarantEmbed,
  xprimePhoenixEmbed,
  xprimePrimenetEmbed,
  xprimeRageEmbed,
  xprimeStreamboxEmbed,
  xprimeVolkswagenEmbed,
} from './embeds/xprime';
import { zunimeEmbeds } from './embeds/zunime';
import { oneServerScraper } from './sources/1server';
import { EightStreamScraper } from './sources/8stream';
import { animeflvScraper } from './sources/animeflv';
import { AnimetsuEmbeds } from './embeds/animetsu';
import { ciaapiScraper } from './sources/cia';
import { cinemaosScraper } from './sources/cinemaos';
import { coitusScraper } from './sources/coitus';
import { ConsumetScraper } from './sources/consumet';
import { cuevana3Scraper } from './sources/cuevana3';
import { embedsuScraper } from './sources/embedsu';
import { FedAPIScraper } from './sources/fedapi';
import { filmekseniScraper } from './sources/filmekseni';
import { fullhdfilmizleScraper } from './sources/fullhdfilmizle';
import { hdRezkaScraper } from './sources/hdrezka';
import { hollymoviehdScraper } from './sources/hollymoviehd';
import { iosmirrorScraper } from './sources/iosmirror';
import { iosmirrorPVScraper } from './sources/iosmirrorpv';
import { madplayScraper } from './sources/madplay';
import { nunflixScraper } from './sources/nunflix';
import { oneroomScraper } from './sources/oneroom';
import { rgshowsScraper } from './sources/rgshows';
import { ridooMoviesScraper } from './sources/ridomovies';
import { sezonlukdiziScraper } from './sources/sezonlukdizi';
import { slidemoviesScraper } from './sources/slidemovies';
import { soaperTvScraper } from './sources/soapertv';
import { streamboxScraper } from './sources/streambox';
import { uiraliveScraper } from './sources/uiralive';
import { vidapiClickScraper } from './sources/vidapiclick';
import { vidfastScraper } from './sources/vidfast';
import { vidifyScraper } from './sources/vidify';
import { vidzeeScraper } from './sources/vidzee';
import { warezcdnScraper } from './sources/warezcdn';
import { webtorScraper } from './sources/webtor';
import { wecimaScraper } from './sources/wecima';
import { xprimeScraper } from './sources/xprime';
import { zunimeScraper } from './sources/zunime';

export function gatherAllSources(): Array<Sourcerer> {
  // all sources are gathered here
  return [
    vidifyScraper,
    vidfastScraper,
    aetherScraper,
    ciaapiScraper,
    cuevana3Scraper,
    catflixScraper,
    ridooMoviesScraper,
    hdRezkaScraper,
    warezcdnScraper,
    insertunitScraper,
    soaperTvScraper,
    autoembedScraper,
    tugaflixScraper,
    ee3Scraper,
    fsharetvScraper,
    vidsrcsuScraper,
    vidsrccxScraper,
    vidsrcScraper,
    mp4hydraScraper,
    webtorScraper,
    embedsuScraper,
    FedAPIScraper,
    slidemoviesScraper,
    iosmirrorScraper,
    iosmirrorPVScraper,
    uiraliveScraper,
    vidapiClickScraper,
    coitusScraper,
    streamboxScraper,
    nunflixScraper,
    EightStreamScraper,
    xprimeScraper,
    ConsumetScraper,
    hianimeScraper,
    oneServerScraper,
    wecimaScraper,
    animeflvScraper,
    cinemaosScraper,
    hollymoviehdScraper,
    oneroomScraper,
    zoechipScraper,
    vixsrcScraper,
    nepuScraper,
    pirxcyScraper,
    fullhdfilmizleScraper,
    filmekseniScraper,
    vidsrcvipScraper,
    vidsrcWTFScraper,
    rgshowsScraper,
    sezonlukdiziScraper,
    videasyScraper,
    vidzeeScraper,
    meridianScraper,
    madplayScraper,
    zunimeScraper,
    animetsuScraper,
  ];
}

export function gatherAllEmbeds(): Array<Embed> {
  // all embeds are gathered here
  return [
    upcloudScraper,
    vidCloudScraper,
    mixdropScraper,
    ridooScraper,
    closeLoadScraper,
    doodScraper,
    streamvidScraper,
    streamtapeScraper,
    warezcdnembedHlsScraper,
    warezcdnembedMp4Scraper,
    warezPlayerScraper,
    autoembedEnglishScraper,
    autoembedHindiScraper,
    autoembedBengaliScraper,
    autoembedTamilScraper,
    autoembedTeluguScraper,
    turbovidScraper,
    mp4hydraServer1Scraper,
    mp4hydraServer2Scraper,
    VidsrcsuServer1Scraper,
    VidsrcsuServer2Scraper,
    VidsrcsuServer3Scraper,
    VidsrcsuServer4Scraper,
    VidsrcsuServer5Scraper,
    VidsrcsuServer6Scraper,
    VidsrcsuServer7Scraper,
    VidsrcsuServer8Scraper,
    VidsrcsuServer9Scraper,
    VidsrcsuServer10Scraper,
    VidsrcsuServer11Scraper,
    VidsrcsuServer12Scraper,
    VidsrcsuServer20Scraper,
    webtor4kScraper,
    webtor1080Scraper,
    webtor720Scraper,
    webtor480Scraper,
    viperScraper,
    xprimeFoxEmbed,
    xprimeApolloEmbed,
    xprimeStreamboxEmbed,
    xprimeMarantEmbed,
    xprimeFendiEmbed,
    xprimePrimenetEmbed,
    xprimeVolkswagenEmbed,
    xprimeHarbourEmbed,
    xprimePhoenixEmbed,
    xprimeRageEmbed,
    xprimeKrakenEmbed,
    ConsumetVidCloudScraper,
    ConsumetStreamSBScraper,
    ConsumetVidStreamingScraper,
    ConsumetStreamTapeScraper,
    hianimeHd1DubEmbed,
    hianimeHd2DubEmbed,
    hianimeHd1SubEmbed,
    hianimeHd2SubEmbed,
    oneServerAutoembedEmbed,
    oneServerVidsrcsuEmbed,
    oneServerPrimeboxEmbed,
    oneServerFoxstreamEmbed,
    oneServerFlixhqEmbed,
    oneServerGokuEmbed,
    oneServerHianimeEmbed,
    oneServerAnimepaheEmbed,
    oneServerAnizoneEmbed,
    streamwishJapaneseScraper,
    streamwishLatinoScraper,
    streamwishSpanishScraper,
    streamwishEnglishScraper,
    streamtapeLatinoScraper,
    vidmolyScraper,
    ...cinemaosEmbeds,
    // ...cinemaosHexaEmbeds,
    vidsrcNovaEmbed,
    vidsrcCometEmbed,
    vidsrcPulsarEmbed,
    vidzeeServer1Embed,
    vidzeeServer2Embed,
    madplayBaseEmbed,
    madplayNsapiEmbed,
    madplayRoperEmbed,
    madplayNsapiVidFastEmbed,
    ...vidifyEmbeds,
    ...AnimetsuEmbeds,
    ...zunimeEmbeds,
  ];
}
