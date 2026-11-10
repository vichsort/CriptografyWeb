import { FAMILIES, type Algorithm, type Family } from '@/domain';
import { algorithmContent, type IconColor } from './algorithms';
import { extras } from './extras';

/** One row of the home lists, the sidebar and the search index. */
export interface CatalogEntry {
  key: string;
  family: Family;
  title: string;
  subtitle: string;
  glyph: string;
  color: IconColor;
  href: string;
  synonyms: readonly string[];
  /** The catalog algorithm behind the row; `null` for frontend-only entries. */
  algorithm: Algorithm | null;
}

const CONTENT_ORDER = Object.keys(algorithmContent);

function firstSentence(text: string): string {
  const match = /^.*?[.!?](?=\s|$)/.exec(text.trim());
  return match ? match[0] : text.trim();
}

function toEntry(algorithm: Algorithm): CatalogEntry {
  const content = algorithmContent[algorithm.id];
  const href = `/algorithms/${algorithm.id}`;
  if (!content) {
    // An algorithm the frontend does not know yet still shows up, with the API's own words.
    return {
      key: algorithm.id,
      family: algorithm.family,
      title: algorithm.name,
      subtitle: firstSentence(algorithm.description),
      glyph: algorithm.name.slice(0, 2),
      color: 'neutral',
      href,
      synonyms: [],
      algorithm,
    };
  }
  return {
    key: algorithm.id,
    family: algorithm.family,
    title: content.intent,
    subtitle: content.subtitle,
    glyph: content.glyph,
    color: content.color,
    href,
    synonyms: content.synonyms,
    algorithm,
  };
}

function rank(algorithm: Algorithm): number {
  const index = CONTENT_ORDER.indexOf(algorithm.id);
  return index === -1 ? CONTENT_ORDER.length : index;
}

/**
 * Joins the API catalog with the content layer: families in display order, known algorithms in
 * content order, unknown ones after them, then the frontend-only extras of the family.
 */
export function joinCatalog(algorithms: readonly Algorithm[]): CatalogEntry[] {
  const ids = new Set(algorithms.map((a) => a.id));
  return FAMILIES.flatMap((family) => [
    ...algorithms
      .filter((a) => a.family === family)
      .map((a, index) => ({ a, index }))
      .sort((x, y) => rank(x.a) - rank(y.a) || x.index - y.index)
      .map(({ a }) => toEntry(a)),
    ...extras
      .filter((e) => e.family === family && (e.requires === null || ids.has(e.requires)))
      .map((e): CatalogEntry => ({
        key: e.key,
        family: e.family,
        title: e.title,
        subtitle: e.subtitle,
        glyph: e.glyph,
        color: e.color,
        href: e.href,
        synonyms: e.synonyms,
        algorithm: null,
      })),
  ]);
}
