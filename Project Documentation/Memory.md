# Memory — Dolil (update after significant work)

## Product
Dolil: AI preliminary due-diligence assistant for Bangladeshi property documents (not legal advice). Solo entry, Ostad Presents YUNet AIgnite Buildathon 2026. Primary round 1–5 Nov 2026; final 27 Nov 2026 (top 20).

## Status
Phase 6 prepared and tested locally; **NOT deployed** and **never run against real Google** (no key/hosting access from the sandbox). Next: user deploys (README "Deploy"), verifies the live probe, then Phase 7 (polish, deck, submission). **Submission cutoff unconfirmed — ask the user.**

## Verified so far (sandbox, Node 22)
- `npm install`, `npm run typecheck`, `npm run build` succeed.
- Server starts; `GET /api/health` → ok; unknown route → 404; invalid env stops startup with a clear message. (Real-process smoke in Phase 5 used a FAKE local Google endpoint, not real Google.)
- `npm test`: 15 client + 45 server tests pass (AI paths use a stubbed Google API; run `npm run build` first because the e2e test serves `client/dist`). Client: 15/15 pass (checks engine; server-rendered Landing/Checklist/Documents/Findings/Report in EN and BN).
## NOT verified
- **Everything that needs a real Google call**: key validity, quota, latency, JSON mode on Gemma, vision on Gemma, extraction accuracy on real Bangla text. Check first with `GET /api/health/ai?probe=1`.
- Real-world Bangladeshi PDFs (legacy fonts may extract as gibberish); Windows run; client is not yet wired to the new endpoints.
- Anything on the user's Windows machine; visual appearance in a real browser (built and server-render tested only); print/PDF output; Google AI Studio (not yet integrated).

## What exists
Client (Phase 3): landing; 4-step case flow (Checklist → Documents → Findings → Report); EN/BN toggle; case persisted in localStorage (`dolil.case.v1`); deterministic checks engine; synthetic sample case; printable report; upload button shown disabled. Sticker auto-loads `client/public/buildathon-sticker.png`, else **placeholder text badge**.
Phase 6 added: production mode serves `client/dist` from the Express app (SPA fallback), `render.yaml`, TRUST_PROXY, probe rate limit, `server/test/e2e.test.ts`, footer privacy note.
Phase 5 added: `googleProvider` (raw fetch), `/api/extract` (text/file/image → fields with evidence + `verified` guard), `/api/explain`, a per-document AI panel with consent checkbox in the client, `samples/*.txt` synthetic demo documents. Ollama removed.
Server (Phase 4): `createApp()` in `server/src/app.ts` (helmet, CORS, rate limit); `/api/health*`; `/api/documents/parse` and `/parse-text` (memory-only upload, content-based detection, text-PDF via unpdf, sanitization, injection-phrase warning); provider boundary (ollama status check; google stub, not implemented). Client does not call the server yet; its upload button stays disabled until Phase 5.
Key client files: `client/src/lib/{checks,docs,normalize,i18n,types}.ts`, `pages/{Landing,CasePage}.tsx`, `components/*`, `hooks/useCase.ts`; tests `lib/checks.test.ts`, `ui.smoke.test.tsx`.
Server files: `server/src/index.ts`, `server/src/lib/env.ts`, `server/src/routes/health.ts`, `server/src/services/ai/*`, `client/src/{App.tsx,layouts/AppLayout.tsx,components/StickerBadge.tsx,pages/FoundationStatus.tsx,services/api.ts}`.

## Endpoints / data flow
`POST /api/documents/parse`, `POST /api/documents/parse-text` → `ParsedDocument` (see Architecture.md). Scanned PDFs/images return `needsVision:true`, empty text.
`/api/health`, `/api/health/ai` (see Architecture.md). Vite dev proxy `/api` → `localhost:8787`.

## Model / inference config
Google AI Studio only. `.env`: `GOOGLE_API_KEY` (user creates it; never commit or paste in chat), `GOOGLE_MODEL` (default `gemma-4-31b-it`; alt `gemma-4-26b-a4b-it`). IDs, endpoint, image input and system instructions are confirmed from Google docs; quota is unverified. Candidate IDs `gemma-4-31b-it`, `gemma-4-26b-a4b-it` and ~1,500 free requests/day came from secondary sources — **verify**.

## Key decisions
D-01 workspaces monorepo; D-02 no auth; D-03 no database (browser storage); D-04 human confirmation of extracted fields; D-06 deterministic checks are client-side pure functions (work without AI); D-07 Google AI Studio only; D-05 no handwritten OCR (KhatianDoc: LLMs fail on handwritten RS khatians and base-16 Ana-Ganda fractions). Deterministic code for arithmetic/comparisons.

## Known limitations / risks
Official sticker image not yet supplied (placeholder). No OCR engine: images and scanned PDFs cannot be read until a vision-capable hosted model is verified (Phase 5). Katha/bigha units unsupported (vary by region); ana-ganda shares must be converted by the user; name comparison can't match Bangla vs English spellings. No real or lawyer-validated documents; checklist is general guidance. Local model ≠ hosted model. Free-tier data-use terms unchecked. Deadline risk.

## Failed approaches
`mkdir -p a/{b,c}` under `/bin/sh` creates a literal `{b,c}` folder (sandbox only; irrelevant on Windows).

## Next concrete task
User: put the official sticker at `client/public/buildathon-sticker.png`, create a Google AI Studio API key (do not paste it in chat), view `npm run dev` in a browser, share the submission cutoff. Phase 7 first task: after the user deploys, verify the live URL from a fresh incognito window (sticker visible, sample journey works, `/api/health/ai?probe=1` reachable). Before that, user runs `GET /api/health/ai?probe=1` with their key, then tries `samples/*.txt` through the AI panel; fix whatever the real model does differently (JSON shape, Bangla accuracy). Then deploy as one Node service.

## Verification command
`npm run typecheck && npm run build && npm test` → all exit 0 (32 tests); then `npm run dev`, open http://localhost:5173, click "Try the sample case" → Findings should show 2 issues (plot number, area vs share).
