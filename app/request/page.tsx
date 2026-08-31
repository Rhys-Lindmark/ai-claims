import type { Metadata } from 'next';
import { RequestStatus } from './request-status';

export const metadata: Metadata = {
  title: 'Request status — AI Claims',
  description: 'Public, identity-free lifecycle status for an AI Claims analysis request.',
};

export default function RequestPage() {
  return <RequestStatus />;
}
