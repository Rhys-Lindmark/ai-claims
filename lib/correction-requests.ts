export type RequesterRole = 'speaker' | 'publisher' | 'authorized_representative' | 'reader';
export type CorrectionRequestKind = 'transcript_context' | 'speaker_attribution' | 'claim_wording' | 'canonical_grouping' | 'evidence' | 'finding' | 'right_of_reply';
export type CorrectionTriageState = 'received' | 'identity_check' | 'needs_information' | 'editorial_review' | 'accepted' | 'partially_accepted' | 'declined' | 'closed';

export interface CorrectionAttachment {
  attachment_id: string;
  title: string;
  url: string;
  supplied_by_requester: true;
  review_state: 'unreviewed' | 'reviewed';
}

export interface CorrectionRequestRecord {
  request_id: string;
  analysis_id: string;
  target_record_ids: string[];
  requester_role: RequesterRole;
  identity_state: 'unverified' | 'verification_pending' | 'verified' | 'not_required';
  request_kinds: CorrectionRequestKind[];
  requested_context: string;
  attachments: CorrectionAttachment[];
  received_at: string;
  response_due_at: string;
  triage_state: CorrectionTriageState;
  public_reply: string | null;
  editorial_response: string | null;
  resulting_version_id: string | null;
  independence_notice: string;
}

export function validateCorrectionRequest(record: CorrectionRequestRecord): string[] {
  const errors: string[] = [];
  if (!record.target_record_ids.length) errors.push('A correction request needs at least one target record.');
  if (!record.request_kinds.length) errors.push('A correction request needs at least one request kind.');
  if (!record.requested_context.trim()) errors.push('Requested context is required.');
  if (Date.parse(record.response_due_at) <= Date.parse(record.received_at)) errors.push('Response due time must follow receipt.');
  if ((record.requester_role === 'speaker' || record.requester_role === 'publisher' || record.requester_role === 'authorized_representative') && record.identity_state === 'not_required') errors.push('Represented-party requests cannot skip identity review.');
  if ((record.triage_state === 'accepted' || record.triage_state === 'partially_accepted') && !record.resulting_version_id) errors.push('Accepted changes need a resulting immutable version.');
  for (const attachment of record.attachments) if (!attachment.url.startsWith('https://')) errors.push(`${attachment.attachment_id} must use HTTPS.`);
  if (!record.independence_notice.trim()) errors.push('Editorial independence notice is required.');
  return errors;
}

