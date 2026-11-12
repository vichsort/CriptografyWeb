import 'server-only';
import { request } from '@/data/http';
import { parse } from './client';
import { StatusDto } from './schemas';

export interface ApiStatus {
  name: string;
  status: string;
  version: string;
}

/**
 * The API's name, status and version. `GET /` sends no CORS headers, so only the server can read
 * it; this module refuses to be bundled for the browser.
 */
export async function getApiStatus(signal?: AbortSignal): Promise<ApiStatus> {
  const body = await request({ method: 'GET', path: '/', ...(signal && { signal }) });
  return parse(StatusDto, body);
}
