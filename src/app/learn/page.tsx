import type { Metadata } from 'next';
import { learn } from '@/content';
import { ArticleList } from '@/features/learn';
import { PageTransition } from '@/ui';

export const metadata: Metadata = { title: learn.title };

export default function LearnPage() {
  return (
    <PageTransition>
      <ArticleList />
    </PageTransition>
  );
}
