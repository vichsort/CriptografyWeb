import Link from 'next/link';
import { pageColumn } from './layout';

interface NotFoundViewProps {
  title: string;
  body: string;
  href: string;
  linkLabel: string;
}

/** A missing page in the app's own look: a large title, why, and the way back. */
export function NotFoundView({ title, body, href, linkLabel }: NotFoundViewProps) {
  return (
    <div className={pageColumn}>
      <h1 className="mt-1 text-large-title text-label">{title}</h1>
      <p className="mt-3 max-w-prose text-body text-label-secondary">{body}</p>
      <Link
        href={href}
        className="mt-6 inline-flex h-11 items-center rounded-md bg-tint px-5 text-body font-semibold text-on-tint shadow-control hover:brightness-110"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
