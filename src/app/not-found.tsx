import { notFoundPage } from '@/content';
import { NotFoundView } from '@/ui';

export default function NotFound() {
  return (
    <NotFoundView
      title={notFoundPage.title}
      body={notFoundPage.body}
      href="/"
      linkLabel={notFoundPage.link}
    />
  );
}
