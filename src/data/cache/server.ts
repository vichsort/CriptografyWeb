import 'server-only';

// Reads that only the server makes: `GET /` sends no CORS headers, so a browser cannot read it.
export { getApiStatus } from '@/data/api';
