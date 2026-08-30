export function normalizeIsbn(input) {
  return input.toUpperCase().replace(/[^0-9X]/g, '');
}

export function isValidIsbn(input) {
  const isbn = normalizeIsbn(input);
  if (/^\d{13}$/.test(isbn)) {
    const total = [...isbn.slice(0, 12)].reduce((sum, digit, index) => sum + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
    return (10 - (total % 10)) % 10 === Number(isbn[12]);
  }
  if (/^\d{9}[\dX]$/.test(isbn)) {
    const total = [...isbn].reduce((sum, digit, index) => sum + (digit === 'X' ? 10 : Number(digit)) * (10 - index), 0);
    return total % 11 === 0;
  }
  return false;
}

export function goodreadsPageId(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!['goodreads.com', 'www.goodreads.com'].includes(url.hostname)) return null;
    return url.pathname.match(/^\/book\/show\/(\d+)/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export function createBookIdentityRecord(input) {
  const pageId = goodreadsPageId(input.goodreadsUrl);
  if (!pageId) return { ok: false, error: 'Use a Goodreads /book/show/ URL with a numeric page ID.' };
  if (!isValidIsbn(input.isbn)) return { ok: false, error: 'Enter a valid ISBN-10 or ISBN-13 for the edition to analyze.' };
  if (input.editionConfirmed !== true) return { ok: false, error: 'Confirm that this ISBN identifies the intended edition.' };
  return {
    ok: true,
    record: {
      schema_version: 1,
      entity_key: `goodreads:${pageId}`,
      goodreads_page_id: pageId,
      canonical_goodreads_url: `https://www.goodreads.com/book/show/${pageId}`,
      isbn: normalizeIsbn(input.isbn),
      edition_note: input.editionNote.trim() || null,
      acquisition_route: 'user_supplied_isbn',
      supplied_at: input.suppliedAt,
      edition_confirmed: true,
      persistence: 'browser_memory_only',
      review_state: 'identity_unreviewed',
    },
  };
}
