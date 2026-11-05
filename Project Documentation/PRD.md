# PRD — Dolil

## 1. Product
**Dolil** — AI-powered preliminary due-diligence assistant for Bangladeshi property documents.
Tagline: *Know what you're signing before you buy.*
Positioning: helps consumers **understand** documents, **compare** them, **spot possible inconsistencies**, and **prepare questions for professional verification**. It is NOT legal advice, title verification, or a safety guarantee.

## 2. Problem
Buying land or dealing with inherited property in Bangladesh involves several documents (deed/dolil, khatian, mutation, warish certificate, tax receipts). Ordinary people struggle to know what each says, whether documents agree with each other, what is missing, and what to ask a lawyer. Share notation and unit conversions are error-prone even for LLMs (see KhatianDoc findings in Memory.md).

## 3. Target audience and personas
- **Rafi, 29, first-time land buyer** (Dhaka): gets a bundle of papers from a seller/broker, cannot judge them.
- **Nusrat, 41, heir**: family property passed through a warish; wants to understand her share.
- **Kamal, 46, diaspora buyer** (abroad): cannot inspect papers in person; wants a clear, Bangla/English summary to bring to a local lawyer.
Primary target is individual consumers, not brokers, law firms, or banks.

## 4. Pain points
Opaque terms; fraction/unit confusion; no way to cross-check documents; no checklist of what is missing; fear of being misled; no lawyer-ready summary.

## 5. Solution and unique value proposition
A guided case workflow: choose transaction type → checklist → upload → review extracted fields → deterministic cross-document checks with evidence → questions-for-your-lawyer report.
Differentiators vs a general chatbot: (1) code, not the LLM, does arithmetic and comparisons; (2) every finding cites document + field; (3) guided, persistent case structure; (4) bilingual lawyer-ready output; (5) honest limitations.

## 6. Main user journey (demo journey)
1. Create case: "Buying land" (+ diaspora toggle optional).
2. See the document checklist; upload sale deed, khatian, mutation record (synthetic sample set available).
3. Review/correct extracted fields (human-in-the-loop).
4. Run checks → findings (e.g., seller's inherited share is smaller than the share sold; plot number mismatch).
5. Open a finding → see both source fields side by side + plain-language explanation.
6. Export/print the report with questions to ask a lawyer.

## 7. User stories
- As a buyer, I want to know which documents I should collect so I don't miss one.
- As a buyer, I want each document's key fields extracted so I can read them in plain language.
- As a buyer, I want mismatches between documents flagged with proof so I know what to ask about.
- As an heir, I want my share computed correctly so I understand what I own.
- As an overseas buyer, I want a Bangla/English report I can hand to a lawyer.

## 8. Functional requirements
**Must-have (MVP)**
- F1 Case creation with transaction type; checklist of typically relevant documents (general guidance, labeled non-legal).
- F2 Upload (text PDF / image / pasted text) with type+size validation; structured extraction to a Zod schema via Gemma.
- F3 Editable "confirm extracted fields" table before checks run.
- F4 Deterministic checks with evidence links: name match, plot/khatian identifier match, area consistency (with unit conversion), share arithmetic (fraction sums, sold-vs-owned), date plausibility.
- F5 Plain-language explanation of each finding and key terms (EN/BN).
- F6 Report: findings + evidence + questions to ask + limitations; printable.
**Optional**: PDF export styling; term glossary tooltips; saved multi-case list; sample-set one-click loader.
**Excluded from competition version**: handwritten khatian OCR; real government record lookup/portal integration; user accounts; payments; legal verdicts/fraud scores; model training; native app.

## 9. Non-functional requirements
Responsive; usable on mobile; first meaningful result < 60 s on hosted inference; clear error states; no fabricated AI output; accessibility basics (contrast, labels, keyboard); sticker visible.

## 10. Personalization
Language toggle (EN/BN); transaction type and role (buyer/heir/diaspora) tailor the checklist and report wording. No accounts.

## 11. AI requirements and role of the open-weight model
Hosted Gemma via Google AI Studio (Ollama was dropped) is central to: structured field extraction (schema-constrained JSON), plain-language explanation, and drafting lawyer questions. It never computes arithmetic or decides consistency; outputs are validated against schemas; failures surface as errors, never as invented results. Document contents are treated as untrusted (prompt-injection defense).

## 12. Data persistence
Cases stored in the browser (IndexedDB/localStorage). Server is stateless; uploads processed in memory and discarded. No database in MVP (see Architecture D-03).

## 13. Acceptance criteria (per core feature)
- F1: selecting a transaction type shows a checklist; marking docs as provided persists on reload.
- F2: invalid type/oversize rejected with a clear message; a valid synthetic doc yields schema-valid JSON or a visible error.
- F3: user can edit any field; checks use edited values.
- F4: on the synthetic demo set, planted discrepancies are found and clean sets raise none; each finding cites ≥2 evidence fields.
- F5: every finding has an explanation in EN and BN.
- F6: report renders all findings, questions, limitations; print view works.

## 14. Risks and assumptions
- No authentic documents or lawyer: demo is synthetic; checklist is general guidance, not validated legal advice.
- Small local model may extract poorly; mitigated by human confirmation step and typed documents.
- Hosted model ID/quota unverified until the start of Phase 5.
- Free-tier hosted inference may log/use data and be rate-limited; demo data only.
- Willingness to pay is an unvalidated hypothesis (free explanation; pay-per-report for multi-document comparison).
- **Submission deadline unconfirmed** (primary round 1–5 Nov 2026).

## 15. Definition of done
Public live URL with working hosted inference; full demo journey passes from a fresh browser; limitations visible; sticker visible; 5-slide deck ready; docs match implementation.
