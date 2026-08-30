export type YouTubeParseResult =
  | { ok: true; videoId: string; canonicalUrl: string }
  | { ok: false; error: string };

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com']);
const NO_COOKIE_HOSTS = new Set(['youtube-nocookie.com', 'www.youtube-nocookie.com']);

export function parseYouTubeUrl(input: string): YouTubeParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { ok: false, error: 'Paste a YouTube URL first.' };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, error: 'That is not a valid URL.' };
  }

  const hostname = url.hostname.toLowerCase();
  let videoId = '';

  if (hostname === 'youtu.be' || hostname === 'www.youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? '';
  } else if (YOUTUBE_HOSTS.has(hostname)) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v') ?? '';
    else if (/^\/(shorts|live|embed)\//.test(url.pathname)) videoId = url.pathname.split('/')[2] ?? '';
  } else if (NO_COOKIE_HOSTS.has(hostname) && url.pathname.startsWith('/embed/')) {
    videoId = url.pathname.split('/')[2] ?? '';
  } else {
    return { ok: false, error: 'Use a public YouTube or youtu.be link.' };
  }

  if (!VIDEO_ID.test(videoId)) {
    return { ok: false, error: 'This YouTube link does not contain a valid video ID.' };
  }

  return {
    ok: true,
    videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
  };
}
