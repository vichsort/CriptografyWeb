import type { Metadata } from 'next';
import { articles } from '@/content';
import { Article, articleBySlug } from '@/features/learn';

type Props = PageProps<'/learn/[slug]'>;

export function generateStaticParams() {
  return articles.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { title, summary } = articleBySlug((await params).slug);
  return { title, description: summary };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  return <Article slug={slug} />;
}
