export function getConfig() {
  let tmdbApiKey =
    process.env.MOVIE_WEB_TMDB_API_KEY ??
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjUwMjc3YmZjNjNkNzNiYjY5NmI3MWU2NThjMjUyMSIsIm5iZiI6MTcyNTcyNTQ1OS4wOTksInN1YiI6IjY2ZGM3YjEzNDQyYjExNDQzMmRkMTU5MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.W7jVmiYfA3XQg0eXTdnjer5EkNlJ1F4k4bJyw5zdgVY';
  tmdbApiKey = tmdbApiKey.trim();

  if (!tmdbApiKey) {
    throw new Error('Missing MOVIE_WEB_TMDB_API_KEY environment variable');
  }

  let proxyUrl: undefined | string = process.env.MOVIE_WEB_PROXY_URL;
  proxyUrl = !proxyUrl ? undefined : proxyUrl;

  return {
    tmdbApiKey,
    proxyUrl,
  };
}
