import Link from 'next/link';
import { notFound } from 'next/navigation';
import { articles, learn } from '@/content';

const COLUMN = 'mx-auto w-full max-w-prose px-4 pt-6 pb-12 sm:px-8 sm:pt-8 lg:px-0';

/** Finds an article by slug; an unknown slug is a 404 (call on the server only). */
export function articleBySlug(slug: string) {
  return articles.find((a) => a.slug === slug) ?? notFound();
}

/** One article: back link, title, reading time, then the body in the text styles. */
export function Article({ slug }: { slug: string }) {
  const { title, minutes, Body } = articleBySlug(slug);
  return (
    <article className={COLUMN}>
      <Link href="/learn" className="text-footnote font-semibold text-tint-text">
        {learn.back}
      </Link>
      <h1 className="mt-3 text-large-title text-label">{title}</h1>
      <p className="mt-2 text-caption text-label-tertiary">{learn.minutes(minutes)}</p>
      <div className="mt-4">
        <Body />
      </div>
    </article>
  );
}
