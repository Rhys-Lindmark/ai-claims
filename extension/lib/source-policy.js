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
  return 'Page identity is local; no page text is uploaded by this prototype.';
}
