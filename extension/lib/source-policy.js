export const YOUTUBE_ACQUISITION_STATES = ['permission_required', 'rights_required', 'creator_authorized', 'user_supplied', 'licensed_source'];

export function transcriptAcquisition(input) {
  if (input.kind !== 'youtube') return { state: 'not_applicable', permitted: true, reason: 'This page does not require YouTube transcript acquisition.' };
  if (input.creatorAuthorized === true) return { state: 'creator_authorized', permitted: true, reason: 'A video editor authorized the documented captions API path.' };
  if (input.licensedSource === true) return { state: 'licensed_source', permitted: true, reason: 'A publisher transcript is available under documented permitted terms.' };
  if (input.transcriptSupplied === true && input.rightsConfirmed === true) return { state: 'user_supplied', permitted: true, reason: 'A supplying party confirmed the right to provide this transcript.' };
  if (input.transcriptSupplied === true) return { state: 'rights_required', permitted: false, reason: 'The transcript cannot enter review until its supplying party confirms rights.' };
  return { state: 'permission_required', permitted: false, reason: 'AI Claims does not scrape YouTube. Creator authorization or a rights-confirmed transcript is required.' };
}

export function sourceNotice(kind) {
  if (kind === 'youtube') return 'Transcript acquisition is permission-gated; this prototype does not scrape YouTube.';
  if (kind === 'goodreads') return 'The Goodreads page identifies the book; analysis uses separately sourced book claims and evidence.';
  return 'Only the canonical page key is checked against AI Claims; page text is not uploaded.';
}

export function goodreadsBookResolution(input) {
  if (input.kind !== 'goodreads') return { state: 'not_applicable', resolved: true, reason: 'This page does not require Goodreads book resolution.' };
  if (input.registryMatch === true) return { state: 'registry_match', resolved: true, reason: 'The page ID maps to a reviewed AI Claims book entity.' };
  if (input.suppliedIsbn === true) return { state: 'user_supplied_isbn', resolved: true, reason: 'A user supplied an edition identifier for review.' };
  if (input.publisherMetadata === true) return { state: 'publisher_metadata', resolved: true, reason: 'Permitted publisher or library metadata identifies the edition.' };
  return { state: 'identity_unresolved', resolved: false, reason: 'AI Claims uses the Goodreads URL only as a page key and does not scrape book metadata.' };
}
