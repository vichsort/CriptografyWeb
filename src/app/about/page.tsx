import type { Metadata } from 'next';
import { about } from '@/content';
import { About } from '@/features/about';

export const metadata: Metadata = { title: about.title };

export default function AboutPage() {
  return <About />;
}
