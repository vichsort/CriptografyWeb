import { learn } from '@/content';
import { NotFoundView } from '@/ui';

/** What an unknown article address shows. */
export function ArticleNotFound() {
  return (
    <NotFoundView
      title={learn.notFound.title}
      body={learn.notFound.body}
      href="/learn"
      linkLabel={learn.back}
    />
  );
}
