import { getCaptionTypeFromUrl, labelToLanguageCode } from '@/providers/captions';
import { FileBasedStream } from '@/providers/streams';
import { NotFoundError } from '@/utils/errors';
import { getValidQualityFromString } from '@/utils/quality';

function generateRandomFavs(): string {
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  const generateSegment = (length: number) => Array.from({ length }, randomHex).join('');

  return `${generateSegment(8)}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(
    12,
  )}`;
}

function parseSubtitleLinks(inputString?: string | boolean): FileBasedStream['captions'] {
  if (!inputString || typeof inputString === 'boolean') return [];
  const linksArray = inputString.split(',');
  const captions: FileBasedStream['captions'] = [];

  linksArray.forEach((link) => {
    const match = link.match(/\[([^\]]+)\](https?:\/\/\S+?)(?=,\[|$)/);

    if (match) {
      const type = getCaptionTypeFromUrl(match[2]);
      const language = labelToLanguageCode(match[1]);
      if (!type || !language) return;

      captions.push({
        id: match[2],
        language,
        hasCorsRestrictions: false,
        type,
        url: match[2],
      });
    }
  });

  return captions;
}

function decodeStream(encoded: string): Record<string, string> {
  const replacements = {
    '#': 'o',
    '!': 'p',
    '@': 'a',
    $: 's',
    '%': 't',
    '^': 'e',
    '&': 'h',
    '*': 'r',
    '(': 'u',
    ')': 'n',
    '_': 'd',
    '+': 'l',
    '|': 'c',
  };

  const trash = ['//_//', '$$', '^^^', '###', '@@@'];

  let decoded = encoded;
  for (const [key, value] of Object.entries(replacements)) {
    decoded = decoded.replace(new RegExp(`\\${key}`, 'g'), value);
  }

  for (const t of trash) {
    decoded = decoded.replace(new RegExp(t, 'g'), '');
  }

  try {
    decoded = atob(decoded);
  } catch (e) {
    throw new Error('Failed to decode base64 string');
  }

  return decoded.split(',').reduce((acc, part) => {
    const [quality, url] = part.split(']');
    if (quality && url) {
      acc[quality.substring(1)] = url;
    }
    return acc;
  }, {} as Record<string, string>);
}

function parseVideoLinks(inputString?: string): FileBasedStream['qualities'] {
  if (!inputString) throw new NotFoundError('No video links found');

  try {
    const qualities = decodeStream(inputString);
    const result: FileBasedStream['qualities'] = {};

    for (const [quality, url] of Object.entries(qualities)) {
      if (url === 'null') continue;
      const validQuality = getValidQualityFromString(quality.replace('p', ''));
      result[validQuality] = {
        type: 'mp4',
        url: url.trim(),
      };
    }

    return result;
  } catch (error) {
    if (error instanceof Error) throw new NotFoundError(error.message);
    throw new NotFoundError('Failed to parse video links');
  }
}

function extractTitleAndYear(input: string) {
  const regex = /^(.*?),.*?(\d{4})/;
  const match = input.match(regex);

  if (match) {
    const title = match[1];
    const year = match[2];
    return { title: title.trim(), year: year ? parseInt(year, 10) : null };
  }
  return null;
}

export { extractTitleAndYear, parseSubtitleLinks, parseVideoLinks, generateRandomFavs, decodeStream };
