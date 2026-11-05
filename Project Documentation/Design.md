# Design — Dolil

## Personality
Calm, careful, trustworthy — like a well-kept land-office register made friendly. Plain language, no hype.

## Visual direction
Paper-and-ink: warm off-white "paper" surfaces, ink text, thin rules like ledger lines, a "stamp" motif for findings. Not a glossy AI dashboard.

## Palette (tokens in `client/src/index.css`)
paper `#f6f1e7`, paper-deep `#ece4d3`, ink `#1b2a2f`, ink-soft `#4a5a5f`, mouza (green, primary/OK) `#1f6f5b`, stamp (red, issues) `#b23a2e`, amber (caution) `#c98a1b`.

## Typography
Display: Fraunces + Noto Serif Bengali. UI: Inter + Noto Sans Bengali. Bangla text must render at ≥16px with generous line height.

## Layout, spacing
Single-column reading width (max ~48rem) for the case flow; two-column evidence view on desktop, stacked on mobile. 4/8px spacing scale; hairline borders instead of heavy shadows.

## Navigation
Top navbar: logo left, **buildathon sticker (mandatory, always visible)**, language toggle. Case flow as a 4-step progress rail: Checklist → Upload → Review → Report.

## Key screens
Landing (promise, limits, "Try the sample case"); Onboarding (transaction type/role); Workspace (checklist + uploads); Review table (editable fields); Findings (severity stamp, side-by-side evidence, explanation EN/BN); Report (printable).

## Components
Field row (label, value, edit), Evidence card (doc, field, quote), Finding card, Stamp badge, Checklist item, Limitation banner, Language toggle.

## States
Empty: explain what to upload and offer the sample case. Loading: step-specific progress text. Error: plain message + retry, never fake data. Success: clear count of findings, not celebration.

## Responsive & accessibility
Mobile-first; 44px touch targets; WCAG AA contrast; labels on all inputs; keyboard reachable; status not by color alone (icon + text).

## Micro-interactions
Subtle "stamp" settle animation on findings; evidence highlight on hover/focus; respects reduced motion.

## Hierarchy
One primary action per screen (Upload → Confirm fields → Run checks → Export report).
