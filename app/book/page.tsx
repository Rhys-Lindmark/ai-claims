import type { Metadata } from 'next';
import { BookAnalysis } from './book-analysis';

export const metadata: Metadata = {
  title: 'Book claim map — AI Claims',
  description: 'A source-traceable book claim inventory with review coverage and a score that stays hidden until the evidence review is complete.',
};

export default function BookPage() {
  return <BookAnalysis />;
}
