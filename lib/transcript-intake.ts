export type TranscriptAccessRoute = 'user_supplied' | 'creator_authorized' | 'licensed_provider' | 'none';

export type TranscriptIntakeState =
  | 'ready_user_supplied'
  | 'ready_creator_authorized'
  | 'ready_licensed_provider'
  | 'permission_required'
  | 'captions_unavailable'
  | 'captions_disabled'
  | 'unsupported_language'
  | 'transcript_processing';

export type TranscriptSignal =
  | 'available'
  | 'unavailable'
  | 'disabled'
  | 'unsupported_language'
  | 'processing';

export interface TranscriptIntakeResult {
  state: TranscriptIntakeState;
  title: string;
  detail: string;
  nextAction: string;
  canAnalyze: boolean;
}

const results: Record<TranscriptIntakeState, Omit<TranscriptIntakeResult, 'state'>> = {
  ready_user_supplied: {
    title: 'Ready for a user-supplied transcript',
    detail: 'Attach or paste a transcript and confirm that it may be processed. The MVP should keep it browser-local or short-lived by default.',
    nextAction: 'Provide transcript + rights confirmation',
    canAnalyze: true,
  },
  ready_creator_authorized: {
    title: 'Creator authorization can unlock captions',
    detail: 'The official YouTube captions path requires OAuth authorization and access to the requested caption track.',
    nextAction: 'Connect the channel with OAuth',
    canAnalyze: true,
  },
  ready_licensed_provider: {
    title: 'A licensed provider can supply the transcript',
    detail: 'Proceed only after the provider terms cover retrieval, processing, storage, and the intended public display.',
    nextAction: 'Record provider + license provenance',
    canAnalyze: true,
  },
  permission_required: {
    title: 'Permission required',
    detail: 'A public video URL is not enough to use the official caption-download API. Creator authorization, a licensed source, or user-supplied text is still needed.',
    nextAction: 'Choose a permitted transcript route',
    canAnalyze: false,
  },
  captions_unavailable: {
    title: 'Transcript unavailable',
    detail: 'No usable transcript was supplied or found through a permitted source. The analysis remains indexed but cannot advance.',
    nextAction: 'Supply a transcript or permitted source',
    canAnalyze: false,
  },
  captions_disabled: {
    title: 'Captions disabled',
    detail: 'The creator or platform has made captions unavailable. The product should not work around that setting.',
    nextAction: 'Ask the publisher for a transcript',
    canAnalyze: false,
  },
  unsupported_language: {
    title: 'Language not supported yet',
    detail: 'A transcript may exist, but the current extraction and review workflow cannot responsibly evaluate this language.',
    nextAction: 'Queue language support or human review',
    canAnalyze: false,
  },
  transcript_processing: {
    title: 'Transcript still processing',
    detail: 'Automatic captions are not always ready when a video is published. Retry this canonical analysis later instead of creating a duplicate.',
    nextAction: 'Retry the same analysis later',
    canAnalyze: false,
  },
};

export function resolveTranscriptIntake(route: TranscriptAccessRoute, signal: TranscriptSignal = 'available'): TranscriptIntakeResult {
  if (signal === 'disabled') return { state: 'captions_disabled', ...results.captions_disabled };
  if (signal === 'unsupported_language') return { state: 'unsupported_language', ...results.unsupported_language };
  if (signal === 'processing') return { state: 'transcript_processing', ...results.transcript_processing };
  if (signal === 'unavailable') return { state: 'captions_unavailable', ...results.captions_unavailable };

  const stateByRoute: Record<TranscriptAccessRoute, TranscriptIntakeState> = {
    user_supplied: 'ready_user_supplied',
    creator_authorized: 'ready_creator_authorized',
    licensed_provider: 'ready_licensed_provider',
    none: 'permission_required',
  };
  const state = stateByRoute[route];
  return { state, ...results[state] };
}

