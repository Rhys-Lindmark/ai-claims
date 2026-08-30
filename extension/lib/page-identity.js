const TRACKING_PARAMETERS = new Set([
  'fbclid',
  'gclid',
  'ref',
  'ref_',
  'source',
  'utm_campaign',
  'utm_content',
  'utm_medium',
  'utm_source',
  'utm_term',
]);

function youtubeVideoId(url) {
  if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] ?? null;
  if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) return null;
  if (url.pathname === '/watch') return url.searchParams.get('v');
  const parts = url.pathname.split('/').filter(Boolean);
  return ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1] ?? null : null;
}

export function identifyPage(rawUrl, title = '') {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return { kind: 'unsupported', entityKey: null, canonicalUrl: null, title };
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    return { kind: 'unsupported', entityKey: null, canonicalUrl: null, title };
  }

  const videoId = youtubeVideoId(url);
  if (videoId) {
    return {
      kind: 'youtube',
      entityKey: `youtube:${videoId}`,
      canonicalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`,
      title,
    };
  }

  if (['goodreads.com', 'www.goodreads.com'].includes(url.hostname)) {
    const match = url.pathname.match(/^\/book\/show\/(\d+)/);
    if (match) {
      return {
        kind: 'goodreads',
        entityKey: `goodreads:${match[1]}`,
        canonicalUrl: `https://www.goodreads.com/book/show/${match[1]}`,
        title,
      };
    }
  }

  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (TRACKING_PARAMETERS.has(key) || key.startsWith('utm_')) url.searchParams.delete(key);
  }
  url.searchParams.sort();
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/$/, '');

  return {
    kind: 'web',
    entityKey: `web:${url.hostname}${url.pathname}${url.search}`,
    canonicalUrl: url.toString(),
    title,
  };
}
