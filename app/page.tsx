import type { Metadata } from 'next';
import { ClaimReviewFixture } from './claims/review-fixture';

export const metadata: Metadata = {
  title: 'Claims — Website Accelerator',
  description: 'Source-traceable experiments for splitting, grouping, and evaluating claims in books and podcasts.',
};

export default function ClaimsPage() {
  return <ClaimReviewFixture />;
}

