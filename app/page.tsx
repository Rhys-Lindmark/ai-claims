import type { Metadata } from 'next';
import { BookChecker } from './book-checker';

export const metadata: Metadata = {
  title: 'AI Claims — How true is this book?',
  description: 'Type a book title to see its reviewed claims and source-traceable truth score—or add it to the review queue.',
};

export default function ClaimsPage() {
  return <BookChecker />;
}
