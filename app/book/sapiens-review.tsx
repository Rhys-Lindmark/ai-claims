import packet from '@/data/books/sapiens.json';
import { CandidateBookReview } from './candidate-book-review';

export function SapiensReview() {
  return <CandidateBookReview packet={packet} />;
}
