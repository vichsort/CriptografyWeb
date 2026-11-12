import Link from 'next/link';
import { workbench } from '@/content';

/** What an unknown algorithm address shows, inside the same column as the workbench. */
export function AlgorithmNotFound() {
  return (
    <div className="mx-auto w-full max-w-workbench px-4 pt-6 pb-12 sm:px-8 sm:pt-8 lg:px-10">
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
