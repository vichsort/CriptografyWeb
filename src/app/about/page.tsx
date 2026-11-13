import type { Metadata } from 'next';
import { about } from '@/content';
import { About } from '@/features/about';
import { PageTransition } from '@/ui';

export const metadata: Metadata = { title: about.title };

export default function AboutPage() {
  return (
    <PageTransition>
      <About />
    </PageTransition>
  );
}
