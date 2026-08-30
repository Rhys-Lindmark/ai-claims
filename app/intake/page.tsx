import type { Metadata } from 'next';
import { TranscriptIntakeForm } from './transcript-intake-form';

export const metadata: Metadata = {
  title: 'Permitted transcript intake — AI Claims',
  description: 'Stage a rights-confirmed transcript provenance record in browser memory without scraping or uploading text.',
};

export default function IntakePage() {
  return <TranscriptIntakeForm />;
}
