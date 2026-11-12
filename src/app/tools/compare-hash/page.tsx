import type { Metadata } from 'next';
import { compareHash } from '@/content';
import { CompareHash } from '@/features/compare-hash';

export const metadata: Metadata = { title: compareHash.title };

export default function CompareHashPage() {
  return <CompareHash />;
}
