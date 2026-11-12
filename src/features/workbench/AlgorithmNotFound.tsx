import Link from 'next/link';
import { site, workbench } from '@/content';
import { WORKBENCH_COLUMN } from './layout';

/**
 * What an unknown algorithm address shows, inside the same column as the workbench. The catalog
 * is known only in the browser, so the page cannot answer 404; React hoists the title and the
 * noindex meta into the head instead.
 */
export function AlgorithmNotFound() {
  return (
    <div className={WORKBENCH_COLUMN}>
      <title>{`${workbench.notFound.title} · ${site.name}`}</title>
      <meta name="robots" content="noindex" />
      <h1 className="mt-1 text-large-title text-label">{workbench.notFound.title}</h1>
      <p className="mt-3 max-w-prose text-body text-label-secondary">{workbench.notFound.body}</p>
      <Link
        href="/algorithms"
        className="mt-6 inline-flex h-11 items-center rounded-md bg-tint px-5 text-body font-semibold text-on-tint shadow-control hover:brightness-110"
      >
        {workbench.notFound.link}
      </Link>
    </div>
  );
}
