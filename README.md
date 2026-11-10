# Criptografy Web

Web frontend (Next.js) for the **Criptografy API**, an educational REST API for experimenting with cryptography: classical ciphers, modern authenticated encryption, hash functions and encodings.

A hub for trying out cryptography, in the spirit of CyberChef and Boxentriq, with a calmer, iOS-like interface: pick a goal ("hide a message", "fingerprint a text"), get a result in seconds, and learn what just happened.

Current state: a bare `create-next-app` scaffold (App Router, TypeScript, Tailwind, ESLint). No feature has been built yet.

| Document | What it covers |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Layers, requests, caching, persistence, routes, API coverage, quality bar |
| [docs/DESIGN.md](docs/DESIGN.md) | Design tokens, typography, components, motion, theming, iOS details, accessibility |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases to v1, what each one ships, known risks, done criteria |

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

> This Next.js version has breaking changes compared to older releases. The guides bundled in `node_modules/next/dist/docs/` are the reference for its APIs.

---

## The backend: `../Criptografy` (read-only)

The API lives in a sibling folder, `/home/vitor/Projects/Criptografy` (GitHub: `vichsort/Criptografy`).

**From this repository the backend is read-only**: its code is a reference for how the API behaves, but changes to it happen only in its own repository, which has its own workflow (protected `master`, changes only through pull requests with green CI). Needs the API does not cover yet are listed in [docs/ARCHITECTURE.md § Backend wishlist](docs/ARCHITECTURE.md#15-backend-wishlist).

Good places to read when in doubt:

| What | Where |
|---|---|
| Overview, architecture, workflow | `../Criptografy/README.md` |
| Routes | `../Criptografy/routes/api.php` |
| HTTP error mapping | `../Criptografy/bootstrap/app.php` |
| Request validation | `../Criptografy/app/Http/Requests/Cryptography/CryptographyOperationRequest.php` |
| Each algorithm (logic, options schema, metadata) | `../Criptografy/app/Cryptography/{Algorithm}/` |
| Exact error messages | `../Criptografy/app/Cryptography/*/*Exception.php` |
| Behavior examples | `../Criptografy/tests/` (the Feature tests show real requests and responses) |

### Stack and design

- Laravel 13, PHP 8.3, API only: **stateless**, no database, no sessions, no cookies, no authentication.
- Each algorithm is a class registered in a central `Registry` under a stable id (`caesar`, `aes-256-gcm`, ...). Each one describes itself (metadata plus a JSON Schema of its options), so **the frontend should build its UI from `GET /api/algorithms`** instead of hardcoding the list or the forms.
- Every API text (messages, names, descriptions) is in English.
- Quality: 100% line coverage, mutation testing, PHPStan at level max. The behavior described below is pinned down by tests.

### Running the API locally

```bash
cd ../Criptografy
composer install
cp .env.example .env
php artisan key:generate
php artisan serve          # http://localhost:8000
```

Or with Docker (the same image used in production):

```bash
cd ../Criptografy
docker build -t criptografy-api .
docker run --rm -e PORT=8080 -p 8000:8080 criptografy-api   # http://localhost:8000
```

Keep the base URL in an environment variable (suggested: `NEXT_PUBLIC_API_URL=http://localhost:8000` in `.env.local`) so it can point to the deployed API later without code changes.

---

## API contract

All requests and responses are JSON (`Content-Type: application/json`).

| Method | Path | Body | Success (200) |
|---|---|---|---|
| `GET` | `/api/algorithms` | none | `{ "data": [metadata, ...] }` |
| `POST` | `/api/encrypt` | `{ "algorithm", "input", "options" }` | `{ "result": "..." }` |
| `POST` | `/api/decrypt` | `{ "algorithm", "input", "options" }` | `{ "result": "..." }` |
| `POST` | `/api/hash` | `{ "algorithm", "input" }` | `{ "result": "..." }` |
| `POST` | `/api/encode` | `{ "algorithm", "input" }` | `{ "result": "..." }` |
| `POST` | `/api/decode` | `{ "algorithm", "input" }` | `{ "result": "..." }` |
| `GET` | `/` | none | `{ "name": "Criptografy API", "status": "healthy", "version": "1.0.0" }` |
| `GET` | `/up` | none | health check (used by the host) |

Request body rules:

- `algorithm`: required string, an `id` from the catalog.
- `input`: required string; the empty string `""` is valid. **Whitespace is never trimmed**: leading and trailing spaces are part of the data, in `input` and in the options.
- `options`: optional JSON object. Only the encryption algorithms use it.

### Algorithm metadata (`GET /api/algorithms`)

```json
{
  "id": "caesar",
  "name": "Caesar",
  "category": "encryption",
  "description": "Substitution cipher that shifts the alphabet by a fixed amount, based on modular arithmetic (C = (P + shift) mod 26).",
  "supportsEncryption": true,
  "supportsDecryption": true,
  "supportsHashing": false,
  "requiresKey": true,
  "securityLevel": "educational",
  "options": {
    "type": "object",
    "properties": {
      "shift": { "type": "integer", "title": "Shift", "description": "Number of positions each letter is shifted. ..." }
    },
    "required": ["shift"],
    "additionalProperties": false
  }
}
```

- `category` is `encryption`, `hashing` or `encoding`, and decides which endpoints apply:
  - `encryption`: `/encrypt` and `/decrypt`;
  - `hashing`: `/hash`;
  - `encoding`: `/encode` and `/decode`.

  Calling an endpoint the algorithm does not support returns 422.
- `securityLevel` is `educational` (classical ciphers, breakable), `modern`, or `not-applicable` (encodings). It is worth showing in the UI.
- `options` is a **JSON Schema** of the options object. It only uses keywords that work in both draft-07 and 2020-12 and does not declare `$schema`, so it works with `react-jsonschema-form` and its default AJV validator. Each property has a `title` and a `description` ready to use as label and help text. Algorithms without options expose an empty, closed object (`"properties": {}`).
- The schema cannot express every rule (e.g. "the Hill matrix must be square and invertible mod 26"). The backend has the final say, so always handle a 422 even when the form validates.
- `requiresKey` is true exactly when `options.required` is not empty.

### Algorithms

| id | Category | Options | Notes for the UI |
|---|---|---|---|
| `caesar` | encryption | `shift`: integer (required) | Rotates only ASCII letters `A-Z`/`a-z`, keeping their case. Accents, digits, symbols and emoji pass through unchanged. Any integer works (only its value mod 26 matters). |
| `vigenere` | encryption | `key`: letters only, `^[A-Za-z]+$` (required) | Handles characters like Caesar. Non-letters do **not** advance the key position. The key is case-insensitive. |
| `hill` | encryption | `key`: square integer matrix from 2x2 to 6x6, e.g. `[[3,3],[2,5]]` (required) | The output is **uppercase letters only**: spaces, punctuation and accents are removed, and the last block is padded with `X`. So `decrypt(encrypt(x))` returns the normalized text, not `x`. The determinant must be coprime with 26, otherwise the API returns 422 and the message gives the determinant. The ciphertext's letter count must be a multiple of the matrix size. |
| `aes-256-gcm` | encryption | `key`: any non-empty string (required) | The output is `base64(nonce . tag . ciphertext)` and is **different on every call** (random nonce). A wrong key or an altered ciphertext gives 422 "Decryption failed...". The key is derived with SHA-256, a documented educational simplification. |
| `sha-256` | hashing | none | 64 lowercase hex characters. |
| `sha-512` | hashing | none | 128 lowercase hex characters. |
| `base64` | encoding | none | Encodes the UTF-8 bytes of `input`. Decoding is strict: invalid Base64 gives 422. |
| `hex` | encoding | none | Encoding outputs lowercase hex. Decoding accepts upper or lower case and needs an even number of `0-9a-fA-F` characters. |

**Binary results**: when a decode (or decrypt) yields bytes that are not valid UTF-8 (e.g. `hex` decode of `"ff"`), the API cannot put them in JSON and answers **422** ("The operation result is not valid UTF-8 text..."). Show this as "the result is binary data", not as a generic failure.

Integer options (`shift`, Hill matrix entries) also accept numeric strings such as `"3"` or `"-1"`. They reject `"--3"`, `"3.0"`, fractions, and floats outside the safe integer range (|v| > 2^53 - 1).

### Errors

Errors are always JSON with a `message`, even for requests without `Accept: application/json`, so a plain `fetch()` works:

```json
{ "message": "The \"shift\" option is required for the Caesar algorithm." }
```

Request validation errors (422) also carry `errors` per field:

```json
{
  "message": "The algorithm field is required.",
  "errors": { "algorithm": ["The algorithm field is required."] }
}
```

| Status | When |
|---|---|
| `404` | unknown algorithm id, or unknown route |
| `405` | wrong HTTP method |
| `422` | invalid request body; invalid options or key; operation the algorithm does not support; non-UTF-8 result |
| `429` | rate limit exceeded |

The 422 messages from the algorithms are written for end users and can be shown as they are.

### CORS and rate limit

- CORS is open (`*`) on `/api/*`, without credentials, so the frontend can call the API straight from the browser on any domain. Do not use `credentials: "include"`.
- POSTs with a JSON body trigger a CORS preflight (`OPTIONS`). The preflight cache is currently `max_age: 0`, so each operation costs two requests until that is changed in the backend.
- Rate limit: **60 requests per minute per client IP** on `/api/*` (configurable on the server). Above that the API returns 429. Avoid sending a request on every keystroke; debounce, or use an explicit button.

---

## Deploy plan

- **Frontend**: Cloudflare, deployed independently from the backend.
- **Backend**: Render (Docker web service, health check `/up`), possibly a home server later. Not deployed yet.
- Render's free tier sleeps after about 15 minutes without traffic, so the first request after that can take close to a minute. The UI needs a clear loading state (e.g. "waking up the server...") and a generous timeout. `GET /` is a cheap request for waking it up.
