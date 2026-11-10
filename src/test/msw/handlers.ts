import { http, HttpResponse, type RequestHandler } from 'msw';
import catalog from '../fixtures/catalog.json';

function url(path: string): string {
  return new URL(path, process.env.NEXT_PUBLIC_API_URL).toString();
}

// Default handlers shared by every test. Tests add their own with `server.use(...)`.
export const handlers: RequestHandler[] = [
  http.get(url('/api/algorithms'), () => HttpResponse.json(catalog)),
  http.get(url('/'), () =>
    HttpResponse.json({ name: 'Criptografy API', status: 'healthy', version: '1.0.0' }),
  ),
];
