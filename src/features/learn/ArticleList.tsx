import Link from 'next/link';
import { articles, learn } from '@/content';
import { ChevronRightIcon } from '@/ui';

const COLUMN = 'mx-auto w-full max-w-workbench px-4 pt-6 pb-12 sm:px-8 sm:pt-8 lg:px-10';

/** The Learn section: a large title, then one glass card per article. */
export function ArticleList() {
  return (
    <div className={COLUMN}>
      <h1 className="mt-1 text-large-title text-label">{learn.title}</h1>
      <p className="mt-3 max-w-prose text-body text-label-secondary">{learn.description}</p>
      <ul className="mt-6 space-y-4">
        {articles.map((article) => (
          <li key={article.slug}>
            <Link
              href={`/learn/${article.slug}`}
              className="material-glass-regular flex items-center gap-4 rounded-xl px-5 py-4 transition duration-fast hover:brightness-105"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-headline text-label">{article.title}</span>
                <span className="mt-1 block text-callout text-label-secondary">
                  {article.summary}
                </span>
                <span className="mt-2 block text-caption text-label-tertiary">
                  {learn.minutes(article.minutes)}
                </span>
              </span>
              <span aria-hidden="true" className="text-footnote text-label-tertiary">
                <ChevronRightIcon />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
