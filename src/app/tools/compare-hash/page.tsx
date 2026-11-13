import type { Metadata } from 'next';
import { compareHash } from '@/content';
import { CompareHash } from '@/features/compare-hash';
import { PageTransition } from '@/ui';

export const metadata: Metadata = { title: compareHash.title };

export default function CompareHashPage() {
  return (
    <PageTransition>
      <CompareHash />
    </PageTransition>
  );
}
