import type { Metadata } from 'next';
import { ClaimReviewFixture } from './review-fixture';

export const metadata: Metadata = { title: 'Atomic Claim Review — AI / RL', description: 'A synthetic review fixture for splitting podcast speech into checkable claim candidates without assigning verdicts.' };

export default function ClaimReviewPage() { return <ClaimReviewFixture />; }

