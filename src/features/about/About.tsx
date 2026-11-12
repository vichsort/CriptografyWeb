import { Suspense } from 'react';
import { about } from '@/content';
import { ActivityIndicator, GlassCard } from '@/ui';
import { ApiStatus } from './ApiStatus';

/** A large title, then glass cards: what the API is, its contract, its quality bar, its source. */
export function About() {
  return (
    <div className="mx-auto w-full max-w-workbench px-4 pt-6 pb-12 sm:px-8 sm:pt-8 lg:px-10">
      <h1 className="mt-1 text-large-title text-label">{about.title}</h1>
      <p className="mt-3 max-w-prose text-body text-label-secondary">{about.description}</p>

      <div className="mt-6 space-y-4">
        <GlassCard title={about.whatItIs.title}>
          <p className="text-body text-label-secondary">{about.whatItIs.body}</p>
        </GlassCard>

        <GlassCard title={about.contract.title}>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full text-left text-footnote">
              <thead>
                <tr className="text-label-tertiary">
                  {about.contract.headers.map((header) => (
                    <th key={header} scope="col" className="py-1 pr-4 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-mono text-mono-small text-label">
                {about.contract.endpoints.map(([method, path, body, success]) => (
                  <tr key={`${method} ${path}`} className="border-t border-separator">
                    <td className="py-2 pr-4 font-semibold">{method}</td>
                    <td className="py-2 pr-4 whitespace-nowrap">{path}</td>
                    <td className="py-2 pr-4 whitespace-nowrap text-label-secondary">{body}</td>
                    <td className="py-2 whitespace-nowrap text-label-secondary">{success}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-footnote text-label-secondary">{about.contract.note}</p>
        </GlassCard>

        <GlassCard title={about.quality.title}>
          <ul className="list-disc space-y-1 pl-5 text-body text-label-secondary">
            {about.quality.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard title={about.source.title}>
          <ul className="space-y-2">
            {about.source.links.map(({ label, href }) => (
              <li key={href}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-body font-semibold text-tint-text underline underline-offset-2"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </GlassCard>

        <GlassCard title={about.status.title}>
          {/* Read per request: the fallback ships in the static shell while the status streams. */}
          <Suspense
            fallback={
              <p className="flex items-center gap-2 text-callout text-label-secondary">
                <ActivityIndicator size="sm" decorative />
                {about.status.checking}
              </p>
            }
          >
            <ApiStatus />
          </Suspense>
        </GlassCard>
      </div>
    </div>
  );
}
