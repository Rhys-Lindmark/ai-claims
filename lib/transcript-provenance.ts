export type TranscriptCaptionType = 'creator_authored' | 'professional' | 'automatic' | 'unknown';

export interface TranscriptProvenanceRecord {
  schema_version: 1;
  canonical_video_url: string;
  acquisition_route: 'user_supplied';
  supplied_at: string;
  language: string;
  caption_type: TranscriptCaptionType;
  character_count: number;
  word_count: number;
  content_checksum: string;
  rights_confirmed: true;
  persistence: 'browser_memory_only';
  review_state: 'transcript_unreviewed';
}

export type TranscriptFixtureResult =
  | { ok: true; record: TranscriptProvenanceRecord }
  | { ok: false; error: string };

function fnv1a32(value: string) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function createUserTranscriptFixture(input: {
  canonicalVideoUrl: string;
  transcript: string;
  language: string;
  captionType: TranscriptCaptionType;
  rightsConfirmed: boolean;
  suppliedAt: string;
}): TranscriptFixtureResult {
  const transcript = input.transcript.trim();
  if (!input.rightsConfirmed) return { ok: false, error: 'Confirm that you may submit this transcript for analysis.' };
  if (transcript.length < 80) return { ok: false, error: 'Paste at least 80 characters so the fixture contains meaningful transcript text.' };
  if (!input.language.trim()) return { ok: false, error: 'Choose a transcript language.' };

  return {
    ok: true,
    record: {
      schema_version: 1,
      canonical_video_url: input.canonicalVideoUrl,
      acquisition_route: 'user_supplied',
      supplied_at: input.suppliedAt,
      language: input.language,
      caption_type: input.captionType,
      character_count: transcript.length,
      word_count: transcript.split(/\s+/u).length,
      content_checksum: fnv1a32(transcript),
      rights_confirmed: true,
      persistence: 'browser_memory_only',
      review_state: 'transcript_unreviewed',
    },
  };
}

