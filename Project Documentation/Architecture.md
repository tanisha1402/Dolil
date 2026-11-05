# Architecture — Dolil

## Stack and reasons
React + TypeScript + Vite + Tailwind v4 + Lucide (user's stack, fast); Node + Express 5 + TypeScript + Zod (validation, env parsing); npm workspaces monorepo (`client`, `server`); Google AI Studio hosted Gemma.

## High-level architecture
Browser (React, case state in IndexedDB) → `/api/*` → Express → [upload/parse] → AI provider boundary → Gemma; extraction JSON → deterministic check engine → findings → browser.
In production a single Express service serves `client/dist` and `/api` (one URL, no CORS). Dev: Vite proxies `/api` to port 8787.

## Folder structure
```
client/src/{components,pages,layouts,services,types,...}   server/src/{routes,services,middleware,lib,...}
server/src/services/ai/     provider boundary (types, ollamaProvider, googleProvider)
client/src/lib/checks.ts      deterministic consistency engine (Phase 3; see D-06)
Project Documentation/      PRD, Architecture, Design, Phases, Memory
```
Folders are created when first needed (no empty placeholders).

## API (implemented in Phase 2)
- `GET /api/health` → `{status, service, provider, model}`
- `GET /api/health/ai` → `{provider, model, reachable, modelAvailable|null, detail}`
- Unknown `/api/*` → 404 `{error:"not_found", message}`; server errors → 500 `{error:"internal_error", message}`
- `POST /api/documents/parse` — multipart (`file`, optional `docType` = deed|khatian|mutation|other) → `ParsedDocument`
- `POST /api/documents/parse-text` — JSON `{text, docType?}` → `ParsedDocument`
- `ParsedDocument = {docType?, kind:"pdf"|"image"|"text", text, chars, truncated, pages?, needsVision, warnings:[{code,message}]}`
- Errors `{error, message}`: 400 `no_file|bad_doc_type|bad_request|bad_json|bad_upload`, 413 `file_too_large|too_many_pages`, 415 `unsupported_type`, 422 `pdf_encrypted|pdf_unreadable|pdf_timeout`, 429 `rate_limited`
- Limits via env: `MAX_UPLOAD_MB` (8), `MAX_PDF_PAGES` (30), `MAX_TEXT_CHARS` (20000), `RATE_LIMIT_MAX` (30 per 10 min per IP)
- `POST /api/extract` — multipart (`file`, `docType` deed|khatian|mutation) or JSON `{text, docType}` → `{docType, source:"text"|"image", fields:{key:{value, unit?, evidence, verified}}, warnings[]}`; `verified` is true/false for text and `null` for images
- `POST /api/explain` — JSON `{text, docType?, lang:"en"|"bn"}` → `{summary, keyTerms[{term,meaning}], notes[]}`
- `GET /api/health`, `GET /api/health/ai[?probe=1]` → provider/model/configured/reachable (probe uses one real request)
- AI errors: 429 `ai_quota`; 502 `ai_auth|ai_bad_output|ai_blocked|ai_empty`; 503 `ai_not_configured|ai_unavailable|ai_model_not_found`; 422 `scanned_pdf_unsupported`. AI routes have a stricter rate limit (`RATE_LIMIT_AI_MAX`, 15 per 10 min per IP)

## Data models (planned, client-side)
`Case{id, transactionType, role, docs[]}`; `DocRecord{id, docType, fields: Field[]}`; `Field{key, value, rawText, confidence?, edited}`; `Finding{id, severity, ruleId, title, evidence: Evidence[], explanation{en,bn}}`; `Evidence{docId, fieldKey, quote}`.

## Auth, persistence
No auth (D-02). No database (D-03). Browser storage holds cases; server keeps nothing.

## AI integration
**Decision: Ollama was dropped (Phase 3); development and production both use Google AI Studio hosted Gemma** (key in server `.env`, never in the client). The Ollama provider was removed in Phase 5.
`AiProvider` interface (`generateJson`, `status`) with one implementation, `googleProvider` (raw `fetch` to the Gemini API; no SDK). Documented Gemma 4 IDs: `gemma-4-31b-it` (default), `gemma-4-26b-a4b-it`; endpoint `v1beta/models/{model}:generateContent`, key in the `x-goog-api-key` header. Quota and rate limits are NOT verified (check AI Studio). JSON outputs are validated with Zod; one bounded retry; else a visible error.
Prompt-injection defense: document text is delimited and labeled as data; extraction output is schema-validated; no tool use.

## Error handling
Typed JSON errors; client shows human-readable messages and retry; AI failure never produces placeholder results.

## Environment variables
See `.env.example`: PORT, NODE_ENV, CLIENT_ORIGIN, GOOGLE_API_KEY, GOOGLE_MODEL, GOOGLE_API_BASE, AI_TIMEOUT_MS, MAX_UPLOAD_MB, MAX_TEXT_CHARS, MAX_PDF_PAGES, RATE_LIMIT_MAX, RATE_LIMIT_AI_MAX. Parsed/validated in `server/src/lib/env.ts` (invalid config stops startup).

## Deployment
Single Node web service serving the built client and the API (no CORS in production). Target host: Render (Node web service; free instances are documented to spin down after 15 minutes idle). Settings are in `render.yaml`: build `npm install --include=dev && npm run build`; start `npm start`; env `NODE_ENV=production`, `TRUST_PROXY=1`, `GOOGLE_MODEL`, and `GOOGLE_API_KEY` (set in the dashboard only). Health check `/api/health`. Not deployed yet.

## Security
Server-side file validation (type, size, content sniffing), memory-only uploads, no file retention, helmet headers + CSP, CORS restricted to `CLIENT_ORIGIN` (dev only; production is same-origin), body size limits, per-IP rate limits (documents, AI, and a small one on the quota-spending probe), request timeouts, keys server-only, synthetic demo data, consent checkbox before any AI call, footer privacy note.

## Decisions / trade-offs
- D-01 Monorepo with workspaces: one install, one dev command.
- D-02 No accounts: faster, less sensitive data held.
- D-03 No database: privacy and speed; trade-off is no cross-device cases.
- D-04 Human confirmation of extracted fields: costs a step, protects against bad extraction.
- D-06 (Phase 3) Deterministic checks live in `client/src/lib/checks.ts` as pure, DOM-free functions, so findings work with manually entered fields before any AI exists. Phase 5 may reuse or move them server-side; the AI never decides consistency.
- D-07 (Phase 3) Google AI Studio only; Ollama dropped (user decision).
- D-05 Typed/clean documents only; handwriting excluded (benchmarks show multimodal LLMs fail on handwritten khatians).
