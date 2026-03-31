## cuakl — Seed v1

A concise, high-signal seed for how we build, what we sell, and what we ship next.

### 1) Thesis

- **Mission**: Deliver useful software fast without sacrificing UX or maintainability.
- **Vision**: A product studio powered by reusable pods that composes delightful products quickly.
- **Edge**: Balance speed, UX, and code quality via Tidy Architecture + Pod Pattern.
- **Audience**: Early-stage founders, SMBs, and teams needing MVPs or modernization.

### 2) What we offer (Service menu)

- **MVP builds**: 2–8 week engagements shipping a usable v1 with measured outcomes.
- **Modernization**: Rebuild, migrate, or re-platform legacy sites/apps (see AI workflow below).
- **Productized pods**: Auth, notifications, simple CMS/Pages, basic analytics, billing, files.
- **Dedicated iteration**: Ongoing improvements, SLO-backed support, and growth experiments.

Deliverables emphasize: clear docs, instrumentation, and handover quality.

### 3) How we build (Operating model)

- **Tidy Architecture** (see `context/ideas/@cuakl/tidy-architecture-*`): simple core, clear adapters, evolve when needed.
- **Pods** (see `context/ideas/@cuakl/pod-architecture.md` and `context/already-built/@cuakl/auth-service.md`): framework-agnostic cores with thin adapters (Next/Express), extension points, and config.
- **Tooling**: Next 15/React 19, TypeScript, Tailwind v4, Mongo/Prisma, Stripe, Resend/Nodemailer, Vercel.
- **Quality bar**: typed contracts, zod validation, error model, metrics, basic e2e paths, and docs.

### 4) Portfolio and in-flight

- **Public website**: Marketing site scaffolding with contact flow and UI primitives.
- **Auth-Service**: JWT auth, RBAC, metrics; migrating to pod-first architecture.
- **day.party**: Neurospicy-friendly, gamified focus/tasks app; next-steps defined.
- **dxgt1**: F1 companion app (Expo) — portfolio.
- **bruma.club**: Events site — portfolio.

See `context/already-built/OVERVIEW.md` for status and links.

### 5) Platform strategy (Pods)

- Build and harden a small set of reusable pods: `auth`, `notifications`, `cms/pages`, `files`, `analytics-basic`, `billing`.
- Keep cores framework-agnostic with simple adapters for Next/Express.
- Publish as internal packages first; extract to public OSS or source-available as they mature.

### 6) qweek.pro — where it fits (decision)

- **What**: A suite of “real-world” tools for solo businesses: QR/links analytics, bookkeeper (light billing/booking), micro CMS/landings, loyalty/fanbase.
- **Options**:
  - Separate brand operated by cuakl (strong GTM positioning for SMBs).
  - Integrate as the cuakl “Blueprints” program (productized stacks we can deploy per client).
- **Decision**: Ship under cuakl Blueprints now (brand split later if useful). Ship a thin vertical: QR/Links Analytics + simple landings and contact-to-email. Prove usage, then layer bookkeeper.

### 7) AI workflow for upgrading client websites (PoC → productized service)

Goal: turn any existing public site into a structured spec and an actionable rebuild plan, then implement with AI-human loop.

1. **Acquire**: Crawl/scrape public site (HTML, CSS, assets). Respect robots.txt; capture sitemap and routes.
2. **Analyze** (LLM): Generate markdown docs:
   - UI/UX map: pages, sections, flows, nav, states.
   - Brand voice, copy tone, IA structure, color and typographic tokens.
   - Functional inventory: forms, search, filters, integrations, SEO patterns.
   - Tech inference: frameworks/CMS hints from DOM, headers, assets.
3. **Assess & Improve**:
   - Heuristics review (accessibility, performance, content clarity).
   - Opportunity list with ROI/effort tags; ideation prompts for client workshops.
4. **Rebuild plan**:
   - Target stack (Next 15, pods); sitemap, components, content model; API surfaces.
   - End-to-end specs with prompts for Cursor/codegen tasks; acceptance criteria per page/flow.
   - Migration plan for SEO and redirects.
5. **Implementation** (AI-assisted):
   - Generate pages/components from the spec; wire forms/APIs; brand tokens.
   - Manual polish passes; visual diffs; content QA.
6. **Measure success**:
   - Baseline vs. new: performance (LCP/INP), accessibility, SEO (core pages indexed), conversion (contact form completion), and engagement.
   - Define thresholds for “ship” and a 2-week follow-up iteration.

Artifacts (all markdown + JSON where relevant): `01-discovery.md`, `02-ui-ux-map.md`, `03-tech-inference.md`, `04-improvements.md`, `05-rebuild-spec.md`, `06-acceptance-checklist.md`, `99-summary.md`.

Pilot sites: `susanaescolar.com` and `arteyterapia.art` (permission confirmed).

### 8) Near-term roadmap (0–12 weeks)

- Weeks 0–2: Finalize public website copy/cases; publish; enable contact intake.
- Weeks 0–3: Extract and publish `AuthPod` (express+next adapters) with examples.
- Weeks 2–5: Build AI website-upgrade PoC and run 2 pilot migrations (susanaescolar.com, arteyterapia.art).
- Weeks 3–8: day.party MVP slice (UI rework, notes/markdown, rewards marketplace seed).
- Weeks 5–9: qweek Blueprints v0 (QR/links analytics + simple landings + contact email).
- Weeks 8–12: Choose 1 “quick-win MVP” from ideas/others and ship.

### 9) Pricing v0

- Services: fixed-scope MVPs from €4.5k–€18k; modernization from €2.5k–€12k depending on scope; retainers from €1.5k/mo.
- Products (indicative): qweek core €4.99/mo; add-ons €1.11/mo; day.party target €8.88/mo with parity pricing.

### 10) Risks and mitigations

- Over-scoping pods → keep MVP surfaces minimal; add via extension points.
- Dilution across ideas → enforce 2 concurrent tracks max (client + internal) with WIP limits.
- Client migration unknowns → start with static pieces; feature-flag risky bets; preserve SEO via redirects.

### 11) Immediate next actions

- Add `context/already-built/OVERVIEW.md` (status index) and `context/ideas/others/OVERVIEW.md` (categorization). ✅
- Draft marketing copy variants and a compact one-pager deck.
- Select two pilot sites for the upgrade workflow; get permission to crawl.
- Cut first `AuthPod` release with README and Next.js example route.
