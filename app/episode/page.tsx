import type { Metadata } from 'next';
import { EpisodeAnalysis } from './episode-analysis';

export const metadata: Metadata = {
  title: 'YouTube episode analysis — AI Claims',
  description: 'A synthetic end-to-end YouTube entity, resolver, publication-gate, and evidence-route fixture.',
};

export default function EpisodePage() {
  return <EpisodeAnalysis />;
}
