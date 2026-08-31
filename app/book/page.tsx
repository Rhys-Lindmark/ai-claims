import type { Metadata } from 'next';
import { BookAnalysis } from './book-analysis';

export const metadata: Metadata = {
  title: 'Book analysis — AI Claims',
  description: 'A synthetic end-to-end Goodreads identity, publication-gate, and passage-evidence fixture.',
};

export default function BookPage() {
  return <BookAnalysis />;
}
