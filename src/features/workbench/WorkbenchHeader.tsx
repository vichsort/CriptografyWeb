import { algorithmContent, familyContent, securityLevelCopy, workbench } from '@/content';
import type { Algorithm } from '@/domain';
import { IconTile } from '@/ui';

/** Family, intent, "name · level", and a short description; content first, then the API. */
export function WorkbenchHeader({ algorithm }: { algorithm: Algorithm }) {
  const content = algorithmContent[algorithm.id];
  const subline = [
    algorithm.name,
    securityLevelCopy[algorithm.securityLevel],
    ...(algorithm.requiresKey ? [workbench.keyRequired] : []),
  ].join(' · ');

  return (
    <header>
      <p className="text-eyebrow text-label-tertiary">{familyContent[algorithm.family].title}</p>
      <div className="mt-2 flex items-center gap-3">
        <IconTile
          size="lg"
          glyph={content?.glyph ?? algorithm.name.slice(0, 2)}
          color={content?.color ?? 'neutral'}
        />
        <h1 className="min-w-0 text-large-title text-label">{content?.intent ?? algorithm.name}</h1>
      </div>
      <p className="mt-2 text-callout text-label-secondary">{subline}</p>
      <p className="mt-2 max-w-prose text-body text-label-secondary">
        {content?.description ?? algorithm.description}
      </p>
    </header>
  );
}
