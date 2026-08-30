import type { Metadata } from 'next';
import { BookIdentityIntake } from './book-identity-intake';

export const metadata: Metadata = {
  title: 'Book identity intake — AI Claims',
  description: 'Pair a Goodreads page key with a confirmed ISBN without scraping page metadata.',
};

export default function BookIntakePage() {
  return <BookIdentityIntake />;
}
