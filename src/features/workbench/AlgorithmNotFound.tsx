import { site, workbench } from '@/content';
import { NotFoundView } from '@/ui';

/**
 * What an unknown algorithm address shows, inside the same column as the workbench. The catalog
 * is known only in the browser, so the page cannot answer 404; React hoists the title and the
 * noindex meta into the head instead.
 */
export function AlgorithmNotFound() {
  return (
    <>
      <title>{`${workbench.notFound.title} · ${site.name}`}</title>
      <meta name="robots" content="noindex" />
      <NotFoundView
        title={workbench.notFound.title}
        body={workbench.notFound.body}
        href="/algorithms"
        linkLabel={workbench.notFound.link}
      />
    </>
  );
}
