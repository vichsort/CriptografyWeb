import { joinCatalog, type CatalogEntry } from '@/content';
import { getCatalog } from '@/data/api';

/** The fixture catalog, read through the real client from the default MSW handler, then joined. */
export async function fixtureEntries(): Promise<CatalogEntry[]> {
  return joinCatalog(await getCatalog());
}
