import type { Metadata } from 'next';
import { AnalysisLookup } from './analysis-lookup';

export const metadata: Metadata = {
  title: 'Analysis — AI Claims',
  description: 'A canonical claim-analysis route with score coverage, methodology, and publication state.',
};

export default function AnalysisPage() {
  return <AnalysisLookup />;
}
