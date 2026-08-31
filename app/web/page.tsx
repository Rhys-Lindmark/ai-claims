import type { Metadata } from 'next';
import { WebAnalysis } from './web-analysis';

export const metadata: Metadata = {
  title: 'Webpage analysis — AI Claims',
  description: 'A synthetic end-to-end generic webpage identity, publication-gate, and passage-evidence fixture.',
};

export default function WebPage() {
  return <WebAnalysis />;
}
