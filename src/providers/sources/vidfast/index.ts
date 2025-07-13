import { flags } from '@/entrypoint/utils/targets';
import { makeSourcerer } from '@/providers/base';

import { comboScraper } from './scrape';

export const vidfastScraper = makeSourcerer({
  id: 'vidfast',
  name: 'VidFast',
  rank: 145,
  flags: [flags.CORS_ALLOWED],
  scrapeMovie: comboScraper,
  scrapeShow: comboScraper,
});
