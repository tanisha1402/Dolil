# Phases — master roadmap (source of truth)

Status: `[ ]` not started · `[x]` completed · `[!]` blocked/at risk.
Estimates: normal / compressed (if the submission cutoff is within ~1 day; deadline **unconfirmed**).
Rule: no phase starts until the previous one meets its acceptance criteria and its ZIP is created and checked.

## Phase 1 — Competition analysis, validation, MVP finalization  (done)
Objective: decide whether and how to build Dolil. Est: 1h / 30m.
- [x] Summarize competition requirements
- [x] Critically evaluate Dolil (B2C fit, differentiation, risks)
- [x] Define positioning, journey, MVP / optional / excluded
- [x] Verify resources (KhatianDoc exists, public; hosted Gemma IDs seen in secondary sources only)
- [x] Recommendation: proceed, narrowed (typed/synthetic docs, deterministic checks core)
Acceptance: concept, scope, feasibility documented → met. Fallback: n/a.

## Phase 2 — Documentation, architecture, foundation  (done)
Objective: documented, runnable skeleton. Est: 1.5h / 45m.
Files: docs, CLAUDE.md, AGENTS.md, root/client/server config, `server/src/{index,lib/env,routes/health,services/ai/*}`, `client/src/{App,layouts,components/StickerBadge,pages/FoundationStatus,services/api}`.
Dependencies: Phase 1.
- [x] PRD, Architecture, Design, Phases, Memory written
- [x] CLAUDE.md, AGENTS.md, copilot-instructions, README, .env.example, LICENSE, .gitignore
- [x] npm workspaces, client (Vite/React/TS/Tailwind/Lucide), server (Express/TS/Zod)
- [x] `npm run typecheck` and `npm run build` pass (sandbox, Node 22)
- [x] Server verified: `/api/health`, `/api/health/ai`, 404, invalid-env exit
- [x] AI provider boundary + Ollama status check (existing Ollama untouched)
- [x] Ollama verification dropped: user chose Google AI Studio only (D-07)
Acceptance: project installs, runs, and reports AI backend status. Fallback: run client and server in two terminals.

## Phase 3 — UI/UX and core frontend  (done in sandbox; sticker + on-device view pending)
Objective: complete core journey UI against real local state. Est: 4h / 1.5h.
Files: `client/src/{App.tsx,index.css,layouts/AppLayout.tsx,pages/{Landing,CasePage}.tsx,components/{StickerBadge,LangToggle,LimitationBanner,StepRail,FindingCard,DocForm}.tsx,hooks/useCase.ts,lib/{types,docs,normalize,checks,i18n}}`, tests `lib/checks.test.ts`, `ui.smoke.test.tsx`.
Dependencies: Phase 2; official sticker image from organizers.
- [x] Design tokens (paper/ink/mouza/stamp), fonts incl. Bangla, ledger-line background
- [x] Navbar with sticker slot (auto-uses `client/public/buildathon-sticker.png`; text badge fallback)
- [!] Official sticker image not yet supplied — placeholder text badge in use
- [x] Landing, case setup + checklist, documents form, findings view, printable report
- [x] EN/BN toggle (persisted); responsive layout; 44px targets; focus styles; reduced-motion
- [x] Browser persistence of case (localStorage), storage failures handled
- [x] Deterministic checks (plot/khatian numbers, seller name, share arithmetic, share validity, deed date) with evidence + bilingual text
- [x] File upload shown as disabled/"Not available yet" (arrives Phase 4–5); manual entry + synthetic sample work
- [x] 15 tests pass (8 checks-engine, 7 server-render screen tests EN/BN)
- [!] Not viewed in a real browser (none in sandbox) — visual QA on user's device needed
Acceptance: full journey usable with real state; every visible control works or is marked unavailable → met in tests; visual check pending. Fallback: n/a.

## Phase 4 — Backend, document processing  (done in sandbox; scope narrowed, see notes)
Objective: receive, validate, and read documents safely. Est: 4h / 1.5h.
Files: `server/src/{app.ts,index.ts,lib/{env,errors}.ts,middleware/{upload,errorHandler}.ts,schemas/documents.ts,services/documents/{detect,sanitize,parse}.ts,controllers/documents.ts,routes/documents.ts}`, `server/test/{documents.test.ts,make-fixtures.py,fixtures/*}`.
- [x] `POST /api/documents/parse` (multipart `file`, optional `docType`): memory-only, 8 MB limit, one file
- [x] `POST /api/documents/parse-text` (JSON `{text, docType?}`) for pasted text
- [x] Content-based type detection (PDF / PNG / JPEG / WebP / UTF-8 text); file name and MIME ignored
- [x] Text-PDF extraction (unpdf), 30-page limit, 20 s timeout, encrypted PDF → clear error
- [x] Text sanitization: NFC, control/invisible chars removed (ZWJ/ZWNJ kept for Bangla), 20,000-char cap, injection-phrase warning
- [x] Security: helmet, CORS to `CLIENT_ORIGIN`, rate limit (30 / 10 min / IP on `/api/documents`), no document text in logs, no disk writes (test-enforced)
- [x] Scanned PDFs and images are accepted but flagged `needsVision:true` with empty text (nothing is invented)
- [x] 17 server tests pass (real HTTP against the Express app), including a synthetic Bangla PDF fixture
- [!] Image / scanned-PDF reading: no OCR engine added (Bengali OCR language data download could not be verified here). Plan: send images to hosted Gemma in Phase 5 **if** Google confirms vision support for the chosen model — unverified
- [ ] Field-level normalization/validation of AI-extracted fields → moves to Phase 5 with extraction (client already has `lib/normalize.ts`)
- [!] Not verified on Windows or with real-world Bangladeshi PDFs (legacy-font PDFs may extract as gibberish)
Acceptance: valid doc → sanitized text; invalid → clear error; no file persisted → met in tests. Fallback: paste text only.

## Phase 5 — AI integration and core intelligence  (done with stubs; NOT verified against real Google)
Objective: AI extraction and explanation working end to end. Est: 6h / 2.5h.
Files: `server/src/services/ai/{googleProvider,index,types}.ts`, `services/extraction/{schemas,prompts,extract}.ts`, `controllers/ai.ts`, `routes/{ai,health}.ts`, `app.ts`, `lib/{env,text}.ts`; client `services/api.ts`, `components/{AiAssist,DocForm}.tsx`, `pages/CasePage.tsx`; `samples/*.txt`; tests `server/test/ai.test.ts`.
- [x] Verified from Google's documentation: model IDs `gemma-4-31b-it`, `gemma-4-26b-a4b-it`; endpoint `v1beta/models/{model}:generateContent`; image input and system instructions are documented
- [!] NOT verified (no API key in sandbox): that the key works, free quota, real latency, JSON mode on Gemma, extraction accuracy on real Bangla documents
- [x] `googleProvider.generateJson()`: key in `x-goog-api-key` header, system instruction, JSON mode with automatic fallback, Zod validation, one retry, thought parts ignored, clear errors (401/403/404/429/5xx/timeout/blocked/empty)
- [x] Ollama removed; Google AI Studio only (D-07)
- [x] `POST /api/extract` (text, .txt/PDF with text, or image) → fields with verbatim evidence + `verified` flag (hallucination guard: quote and value must appear in the source text)
- [x] `POST /api/explain` → plain-language summary, key terms, questions (EN/BN), grounded in the text, no legal verdicts
- [x] Prompt-injection defenses: document delimited as untrusted data, closing tag stripped, strict schema, no tools, rules in system prompt
- [x] `GET /api/health/ai` (no quota used) and `?probe=1` (one tiny real request)
- [x] Client: per-document AI panel with consent checkbox, loading/error states, AI marks on fields (cleared when the user edits), explanation card
- [x] Deterministic checks and completeness checklist (Phase 3) consume the AI-filled fields
- [x] Synthetic demo documents in `samples/`
- [x] 54 tests pass (15 client + 39 server); AI paths tested with a stubbed Google API; one real-process HTTP smoke against a fake Google endpoint
- [ ] Lawyer questions are deterministic templates per finding (AI-drafted questions NOT implemented); AI only adds "ask your lawyer" notes in the explanation
- [!] Scanned PDFs are refused (upload a page photo instead); katha/bigha units unsupported
Acceptance: with a valid key, sample documents → fields → findings. **Pending: first live run with the user's key.** Fallback: manual entry (works without AI).

## Phase 6 — Integration, testing, deployment  (prepared and tested locally; NOT deployed)
Objective: public app with working hosted inference. Est: 5h / 2h.
Files: `server/src/{app,lib/env}.ts`, `server/test/e2e.test.ts`, `render.yaml`, `.env.example`, README (Deploy section), client footer privacy note.
- [x] Production mode: one Node service serves the built client + API, SPA fallback, immutable asset caching, `trust proxy` for correct per-IP limits
- [x] `render.yaml` Blueprint (Render Node web service, free plan, health check `/api/health`); build `npm install --include=dev && npm run build`, start `npm start`
- [x] End-to-end journey test over real HTTP: 3 synthetic documents → AI extraction (stubbed Google) → deterministic checks → exactly the 3 planted findings
- [x] Security: helmet CSP/headers verified, rate limits (documents 30, AI 40, probe 10 per 10 min per IP), request/upload limits, timeouts (slow AI → clear 503)
- [x] Real production process smoke (built dist, NODE_ENV=production) against a fake local Google: site, deep links, health, probe all work
- [x] Privacy note in footer; per-panel consent checkbox before any text/image is sent
- [x] 59 tests pass (15 client + 44 server)
- [!] NOT DONE — deployment itself: needs the user's GitHub repo + Render account + API key; I cannot do this from the sandbox
- [!] NOT VERIFIED — production inference with a real key/quota; real Bangla extraction accuracy; real-browser rendering, mobile layout, print output, performance
- [!] Free hosting sleeps after 15 min idle; first request can take 30–60 s (cold start). Mitigation: open the site just before judging; optional external uptime pinger on `/api/health` (unverified)
- [ ] User: deploy, then verify `/api/health/ai?probe=1` on the live URL and run the `samples/` journey from a fresh incognito window
Acceptance: journey passes on the public URL. Fallback: if hosted AI fails, manual entry + deterministic checks still work (demo this).

## Phase 7 — Polish, submission  (not started)
Objective: competition-ready package. Est: 4h / 1.5h.
- [ ] UI polish; verify every control; sticker visible on mobile+desktop
- [ ] README final; 5-slide deck; optional English demo video; pitch
- [ ] Fresh-browser check of live URL; final checklist
Acceptance: live link + deck submitted. Fallback: skip video, simplify deck.
