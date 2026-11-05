# Dolil — Know what you're signing before you buy

AI-powered **preliminary due-diligence assistant** for Bangladeshi property documents. Built solo for
*Ostad Presents YUNet AIgnite Buildathon 2026*. Dolil helps buyers and heirs understand documents, compare them,
and prepare questions for a lawyer. **It is not legal advice and does not verify title.**

## Status
Phase 6 prepared (deployable as one service; tested locally with a stubbed Google API; not yet deployed). See `Project Documentation/Memory.md` for the exact current state.

## Requirements
- Node.js 20+ (built and tested on Node 22)
- A Google AI Studio API key (https://aistudio.google.com/apikey) in `.env` as `GOOGLE_API_KEY` — never commit it or put it in the client

## Setup (Windows, PowerShell or Command Prompt)
```bat
npm install
copy .env.example .env
npm run dev
```
- Client: http://localhost:5173
- Server: http://localhost:8787 (`/api/health`, `/api/health/ai`)

To check your AI key, open http://localhost:8787/api/health/ai?probe=1 (makes one tiny real request).
Try the AI flow with the synthetic files in `samples/`.

Click **Try the sample case** to see the full journey with invented, synthetic data.

Official buildathon sticker: save the image as `client/public/buildathon-sticker.png` (it is picked up automatically).

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Start server (tsx watch) and client (Vite) together |
| `npm run typecheck` | Typecheck both workspaces |
| `npm test` | Client (checks engine, screens) and server (upload/parsing) tests |
| `npm run build` | Build server and client |
| `npm start` | Run the built server |

## Documentation
All project docs are in `Project Documentation/`. AI coding agents: read `CLAUDE.md` first.

## Deploy (Render, free plan)
1. Push this repository to GitHub. Make sure `.env` is NOT committed (it is in `.gitignore`).
2. In Render: **New → Blueprint**, pick the repo (it reads `render.yaml`). Or create a **Web Service** manually with:
   Build `npm install --include=dev && npm run build`, Start `npm start`, health check path `/api/health`.
3. Set environment variables in the Render dashboard: `NODE_ENV=production`, `TRUST_PROXY=1`, `GOOGLE_MODEL=gemma-4-31b-it`, and `GOOGLE_API_KEY` (secret).
4. When it is live, open `https://<your-service>.onrender.com/api/health/ai?probe=1` → expect `"reachable": true`.
5. Open the site in a fresh incognito window and run the journey with the files in `samples/`.

Free instances sleep after 15 minutes idle, and the first request afterwards can take 30–60 seconds. Open the site shortly before judging.
