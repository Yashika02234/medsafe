# Phase 0 Decision Register — MedSafe

> Purpose: Single source of truth for every unresolved architectural decision.
> Every open decision has an owner, a deadline, and a predetermined impact statement.
> When a decision is made, record the resolution here. Do not leave this document stale.
>
> Authority: Architecture Baseline (`.claude/outputs/architecture-baseline.md`)
> Research Plan: `.claude/outputs/phase-0-research-plan.md`
> Lock Checklist: `.claude/outputs/phase-0-lock-checklist.md`

---

## DECISION STATUS LEGEND

- 🔴 **OPEN — BLOCKING** — Must be resolved before the deadline. Phase 1 or Phase 3 cannot start without this.
- 🟡 **OPEN — CONDITIONAL** — Decision depends on a research result. Cannot be made before that result exists.
- 🟢 **OPEN — NON-BLOCKING** — Should be resolved, but Phase 1 can start without it.
- ✅ **RESOLVED** — Decision made, resolution recorded, architecture updated.

---

## DECISION TIERS

```
Tier 1 — Research-Dependent (requires Phase 0 experiment results)
  DEC-001  CDSCO Primary Data Source
  DEC-002  Resolution Rate Response (if 40-69%)
  DEC-003  Gemini Fallback Activation
  DEC-004  Rate Limit Mitigation
  DEC-005  Go/No-Go Master Architecture Decision

Tier 2 — Decidable Now, Blocking Phase 1
  DEC-006  Mobile Navigation Layout
  DEC-007  Email Confirmation Policy
  DEC-008  Consent Screen Text
  DEC-009  Medical Disclaimer Text and Locations

Tier 3 — Decidable Now, Blocking Phase 3
  DEC-010  Severity Color System
  DEC-011  Interaction Severity Display Default
  DEC-012  Month/Year Picker Approach
  DEC-013  check-batch Pair Ceiling Value

Tier 4 — Non-Blocking, Decide Before Launch
  DEC-014  App Name
  DEC-015  Design System Timing
  DEC-016  Error Monitoring Tool
  DEC-017  Privacy Policy Depth
  DEC-018  Synonym Table Initial Size Target
```

---

## TIER 1: RESEARCH-DEPENDENT DECISIONS

---

### DEC-001: CDSCO Primary Data Source

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Research Required** | R1 (complete before deciding) |
| **Deadline** | Before Phase 1 begins |
| **Decision Owner** | Developer |
| **Blocks** | Phase 2 medicine autocomplete, Phase 3 drug resolution |

**Question:** Which source provides the CDSCO brand→salt mapping dataset that powers medicine autocomplete and drug resolution?

**Option A: Pre-existing GitHub or Kaggle dataset**
Pros:
- Available in hours, not days. Search takes 1-2 hours max.
- Likely already partially cleaned and structured.
- Permissive license in most cases (MIT, CC-BY, or unlicensed).
- May already be larger than the 3,000-entry target.

Cons:
- Data freshness unknown — may be 2-3 years old.
- Coverage gaps unknown until audited.
- Combination drug representation uncertain.
- May need significant normalization regardless.

**Option B: data.gov.in government datasets**
Pros:
- Official government source. Clear legal status (OGDL — open, permissive).
- Most authoritative for Indian pharmaceutical data.
- Attribution to official source strengthens portfolio narrative.

Cons:
- Dataset may not exist in usable format (CDSCO may only publish PDFs or web pages).
- Transformation from PDF/HTML to structured JSON could take 2-3 sessions.
- Coverage may be limited to approved new drugs, not the full historical register.

**Option C: Scrape CDSCO website**
Pros:
- Most comprehensive source (~70,000+ registered drugs).
- Most current data.
- Gives full control over data format.

Cons:
- Website structure changes periodically — scraper breaks without warning.
- Time-intensive: 4-8 hours to write, test, and run a reliable scraper.
- Rate limiting on CDSCO may require slow scraping over multiple sessions.
- Legal gray area (government data but no explicit scraping permission stated).
- High fragility — if scraper breaks in 3 months, data goes stale with no easy refresh.

**Option D: Manually curate top-200 medicines**
Pros:
- Guaranteed quality — every entry verified by hand.
- Fastest time to a minimal working dataset.
- Can focus on exact medicines most likely to be in Indian household.

Cons:
- 200 entries is below MVP quality threshold. Users will hit "not found" frequently.
- Labor-intensive to expand. 200→3,000 entries is a multi-day effort.
- Only viable as emergency fallback if all other options fail.

**Evidence Required:** Complete R1 (source discovery). Results from all strategies tried, entry counts from each source found.

**Decision Criteria:**
- If Option A yields ≥ 3,000 entries with combination drugs: choose A.
- If Option A yields 1,500-2,999: choose A but plan expansion as Phase 2 background task.
- If Option A fails and Option B has structured data: choose B.
- If both A and B fail: choose C (scraping) unless time is critically short, then D as last resort.

**Impact if Wrong:**
Choosing a source that yields <1,500 entries means most users see "not found" on autocomplete for their medicines. The product feels broken on first use. Recovery requires sourcing a better dataset mid-Phase 2, which requires updating the static JSON file and redeploying — technically simple but psychologically demoralizing.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________
- Reason: ___________
- Entry count achieved: ___________

---

### DEC-002: Resolution Rate Response Strategy (if 40-69%)

| Field | Value |
|-------|-------|
| **Status** | 🟡 OPEN — CONDITIONAL |
| **Depends On** | R4 resolution rate (if result falls in 40-69% range) |
| **Deadline** | Before Phase 3 begins |
| **Decision Owner** | Developer |
| **Blocks** | Phase 3 interaction engine scope |

**Question:** If the RxNorm resolution rate after synonym substitution lands between 40-69%, how much additional synonym table investment is made before proceeding to Phase 3?

**Context:** A 40-69% resolution rate means RxNorm knows many Indian drug names but misses a meaningful subset. The root cause is name convention differences (Paracetamol/Acetaminophen, Salbutamol/Albuterol, etc.) — these are fixable with synonyms. The question is how much synonym work is done versus accepted as "known coverage gap."

**Option A: Commit 1 additional dedicated session to synonym expansion**
Estimated improvement: +10-15 percentage points on resolution rate.
Pros:
- Relatively small investment for meaningful accuracy gain.
- Synonym table becomes a durable asset that improves the engine permanently.
- Target becomes 55%+ → 65%+ → potentially crossing the 70% threshold.

Cons:
- Delays Phase 3 start by 1 session.
- Returns diminish quickly — common name differences are found first, rare ones take longer.

**Option B: Commit 2-3 additional sessions, target 70%+ before Phase 3**
Pros:
- Higher confidence in the interaction engine's coverage.
- Avoids building Phase 3 with known data quality problems.

Cons:
- Significant delay (2-3 extra sessions).
- May not reach 70% even with sustained effort if some drugs are genuinely unresolvable via RxNorm.
- Better to ship Phase 3 with 60% coverage and known gaps than delay indefinitely.

**Option C: Accept the rate and proceed with documented coverage gap**
Pros:
- Fastest path to shipping Phase 3.
- Users with unresolvable medicines see a clear "data unavailable" message.
- Coverage expands organically as synonym table grows post-launch.

Cons:
- 30-60% of medicines in a user's cabinet may show "data unavailable."
- Portfolio demo impact: if the test medicines aren't in the resolved set, the interaction engine can't be demonstrated.
- Users may perceive the product as unreliable rather than as "data gap."

**Decision Criteria:**
- If resolution rate is 65-69% after initial synonyms: 1 additional session (Option A) to try to cross 70%.
- If resolution rate is 55-64%: 2 sessions of synonym work (Option B), then proceed regardless.
- If resolution rate is 40-54%: accept the rate (Option C), document it prominently, and add synonym expansion as an ongoing Phase 3 background task.

**Evidence Required:** R4 final resolution rate (with initial synonym table from B-3).

**Impact if Wrong:** Proceeding with too low a resolution rate means the interaction engine works for fewer medicines than the portfolio narrative claims. Investing too much time in synonyms delays the MVP and may not improve coverage beyond a ceiling set by RxNorm's data scope.

**Resolution:**
- Date decided: ___________
- R4 resolution rate: ___________
- Option chosen: ___________
- Synonym sessions committed: ___________

---

### DEC-003: Gemini Fallback Activation

| Field | Value |
|-------|-------|
| **Status** | 🟡 OPEN — CONDITIONAL |
| **Depends On** | R4 (if rate < 40%) AND R8 (Gemini accuracy validation) |
| **Deadline** | Before Phase 3 begins (only if triggered) |
| **Decision Owner** | Developer |
| **Blocks** | Phase 3 resolution service architecture |

**Question:** If RxNorm resolution rate is below 40%, should Gemini Flash API be activated as a fallback interaction source?

**Context:** The `interactions_cache` table already has a `source` field supporting "rxnav" or "gemini." No schema changes are needed to activate this. The decision is purely about whether to add the Gemini code path and what disclaimer treatment it receives.

**Option A: Activate Gemini fallback with strong disclaimer**
Pros:
- Interaction engine covers drugs that RxNorm cannot resolve — wider coverage.
- Gemini knows Indian brand names directly (no CDSCO bridge needed for fallback path).
- Free tier: adequate for MVP scale.
- Resume talking point: "multi-source interaction engine with confidence-weighted results."

Cons:
- LLMs hallucinate. For drug interactions, a false warning or missed warning has real consequences.
- Non-deterministic: same query may return different results on different calls.
- "AI-generated" label may confuse or alarm users who don't understand what it means.
- Adds complexity: two code paths (RxNav and Gemini), two disclaimer states.
- Not appropriate for a real medical product. Suitable for a portfolio project with appropriate guardrails.

**Option B: Accept low coverage, show "data unavailable" for unresolvable drugs**
Pros:
- Simpler codebase — one code path (RxNav only).
- No hallucination risk — what you don't know, you say you don't know.
- More honest to the user about the system's limitations.
- Medically safer than showing potentially incorrect AI-generated warnings.

Cons:
- Lower feature completeness for portfolio demo.
- Users with predominantly Ayurvedic or Indian-specific medicines see mostly "unavailable."
- Coverage gap is visible and may be perceived as product failure rather than data limitation.

**Option C: Build manual interaction database for top-50 Indian drug pairs**
Pros:
- Covers the most clinically significant Indian-specific drug interactions with verified data.
- No hallucination risk — manually verified, source-cited.
- Strong portfolio signal: "built a curated safety database for Indian-specific medicines."

Cons:
- 5-8 hours of research and data entry to create and verify.
- Requires pharmacist-verified sources for each interaction (Drugs.com, published studies).
- 50 pairs covers a narrow but important slice. All other unresolvable drugs still show "unavailable."

**Recommended Decision Logic:**
- If R4 ≥ 40%: this decision is moot. Skip.
- If R4 < 40% AND R8 shows Gemini passes accuracy thresholds: activate Option A.
- If R4 < 40% AND R8 shows Gemini fails accuracy thresholds: choose between B and C based on available time. Option B is safer; Option C is a meaningful upgrade if time allows.

**Evidence Required:** R4 resolution rate AND R8 Gemini accuracy test (if R4 < 40%).

**Impact if Wrong:** Choosing Gemini when it's inaccurate puts incorrect interaction warnings in front of users. Choosing no fallback when coverage is below 30% makes the interaction engine barely functional. Either error is recoverable — Gemini can be disabled, manual pairs can be added — but both require Phase 3 rework.

**Resolution:**
- Date decided: ___________
- R4 rate: ___________
- R8 result: ___________
- Option chosen: ___________
- Disclaimer text (if Option A): ___________

---

### DEC-004: Rate Limit Mitigation Approach

| Field | Value |
|-------|-------|
| **Status** | 🟡 OPEN — CONDITIONAL |
| **Depends On** | R5 (rate limiting test) |
| **Deadline** | Before Phase 3 begins |
| **Decision Owner** | Developer |
| **Blocks** | check-batch endpoint implementation in Phase 3 |

**Question:** If RxNorm/RxNav rate limiting is observed during R5 testing, what mitigation is added to the check-batch endpoint?

**Option A: No mitigation needed (if no throttling observed)**
Decision by default — proceed with the current design. Serial calls with no artificial delay.

**Option B: Add inter-request delay (if throttling begins at 20+ req/min)**
Add `await new Promise(r => setTimeout(r, 100))` between RxNav calls.
Impact on ceiling: add (N-1) × 100ms to total execution time.
New ceiling at p95=500ms with 100ms delay: floor(9000 / 600) = 15 (unchanged — delay is small).

**Option C: Add longer delay (if throttling begins at 10-20 req/min)**
Add 300-500ms delay between calls.
New ceiling at p95=500ms with 300ms delay: floor(9000 / 800) = 11.
Check-batch constant must be updated to 11.

**Option D: Batch into smaller sub-batches with delay between batches**
If throttling is severe (triggers at 5-10 req/min): send 5 pairs, wait 5 seconds, send 5 more.
This still fits in 10 seconds for the first batch only (5 × 500ms + 5000ms delay = 7,500ms).
Second batch of 5 pairs requires a second client-side check-batch call.
Impact: interaction checking requires more client iterations, but never times out.

**Evidence Required:** R5 rate limit test results.

**Decision Criteria:**
- No throttling: Option A.
- Throttling at 20+ req/min: Option B.
- Throttling at 10-20 req/min: Option C (update batch ceiling to 11).
- Throttling at < 10 req/min: Option D (batches of 5).

**Impact if Wrong:** Missing rate limit mitigation causes 429 errors during interaction checks. The check-batch silently fails for some pairs. Some interactions are never checked. The UI shows "complete" when it isn't, because the pairs failed silently.

**Resolution:**
- Date decided: ___________
- Rate limit observed: YES / NO
- Throttling threshold (if observed): ___________
- Option chosen: ___________
- Delay added (ms): ___________
- Updated batch ceiling: ___________

---

### DEC-005: Go/No-Go Master Architecture Decision

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Depends On** | DEC-001, DEC-002, DEC-003, DEC-004 + all R1-R7 results |
| **Deadline** | End of Day 5 of Phase 0 research |
| **Decision Owner** | Developer |
| **Blocks** | Phase 1 start. Nothing proceeds without this. |

**Question:** After all Phase 0 research, does the planned architecture proceed as specified in the baseline, with modifications, or does it require a fundamental pivot?

**Option A: GO — Proceed exactly as planned**
Criteria:
- CDSCO dataset ≥ 3,000 entries ✓
- RxNorm resolution rate ≥ 70% with synonyms ✓
- RxNav detection ≥ 7/10 known pairs ✓
- API latency p95 < 650ms ✓
- No rate limiting observed ✓

**Option B: GO WITH MODIFICATIONS — Proceed with documented changes**
Possible modifications:
- Reduced batch ceiling (if latency > 650ms)
- Extended synonym work before Phase 3 (if resolution 55-69%)
- Rate limit delay added to check-batch (if throttling observed)
- Dataset expansion planned as Phase 2 background task (if entries 1,500-2,999)
- Gemini fallback activated (if resolution < 40%)

**Option C: PIVOT — Architecture requires fundamental change before proceeding**
Trigger conditions (any one of):
- CDSCO dataset < 1,000 entries after all strategies — drug resolution chain too narrow to be useful
- RxNorm resolution rate < 20% even with Gemini — interaction engine has no viable data source
- RxNav false positive rate ≥ 3/5 — interaction engine actively harms users with false warnings
- API timeout from India (p95 > 2,000ms) — check-batch fundamentally unworkable

If pivoting: the most likely pivot is narrowing the MVP to expiry tracking only (no interaction engine) and rebuilding the interaction feature on a different data source (potentially a commercial API if budget changes, or a fully manual curated database).

**Evidence Required:** Complete results from R1-R7, B-4 decision document populated.

**Decision Document Must Contain:**
- Actual measurement for each criterion
- Which option (A/B/C) was chosen
- For Option B: complete list of every modification to the baseline
- Updated architecture baseline (if modifications exist)
- Updated project backlog (if scope changed)
- Date, signed off

**Impact if Wrong:** Making a GO decision with data that should have triggered a pivot means building Phase 1-3 on a broken foundation. The interaction engine ships with unacceptably low coverage or inaccurate data. Recovery requires stopping development, redesigning the interaction engine, and rewriting Phase 3 — effectively losing 2-4 weeks of work.

**Resolution:**
- Date decided: ___________
- Decision: GO / GO WITH MODIFICATIONS / PIVOT
- If Option B: modifications listed in `.claude/outputs/phase-00/go-no-go-decision.md`
- If Option C: pivot plan documented in same file
- Phase 1 start authorized: YES / NO

---

## TIER 2: DECIDABLE NOW — BLOCKING PHASE 1

---

### DEC-006: Mobile Navigation Layout

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Depends On** | Nothing — decide immediately |
| **Deadline** | Before P1-T5 (dashboard layout shell) |
| **Decision Owner** | Developer |
| **Blocks** | Dashboard layout component structure in Phase 1 |

**Question:** What is the primary navigation pattern on mobile?

**Option A: Bottom tab bar (recommended)**
Structure: 4 fixed tabs at screen bottom — Cabinet, Interactions, Family, Settings.
Pros:
- Industry-standard mobile health app pattern (similar to: Apple Health, MyFitnessPal, Medisafe).
- Thumb-reachable for one-handed phone use.
- 4 tabs fits the navigation surface exactly (Cabinet + Interactions + Family + Settings).
- shadcn/ui has no bottom nav — requires a simple custom component, not difficult.
- Less JavaScript than a collapsible drawer.

Cons:
- Loses screen vertical space (typically 56-64px).
- Does not translate well to desktop — need separate desktop layout.
- shadcn's default components are header-first, requiring some layout override.

**Option B: Top header + sidebar drawer**
Structure: Persistent header with hamburger → slide-in sidebar navigation.
Pros:
- shadcn/ui sidebar component exists — less custom code.
- Works on both mobile and desktop with minimal layout changes.
- Standard web app pattern — no learning curve.

Cons:
- Hamburger menus test poorly on mobile health apps — users don't know what's behind it.
- Drawer swipe gestures conflict with app scroll gestures.
- The app's target demographic (parents, elderly) is more familiar with iOS/Android tab patterns.

**Option C: Top navigation tabs (horizontal scroll)**
Structure: Horizontal tab strip at the top of the dashboard.
Pros:
- Visible navigation without hamburger ambiguity.
- Works on both mobile and desktop.

Cons:
- No standard shadcn implementation for this.
- Horizontal scrolling for tabs is poor UX on touch.
- Less thumb-friendly than bottom tabs for key actions.

**Recommended:** Option A. The user base (families, elderly, parents) is most familiar with tab bar navigation from native health apps. The 4-tab structure fits perfectly. Accept the modest custom component cost.

**Evidence Required:** None. This is a pure UX decision.

**Impact if Wrong:** Navigation is embedded in `/(dashboard)/layout.tsx`. Changing from bottom nav to sidebar after Phase 1 means rewriting the layout shell, updating all page route structures, and adjusting all padding/spacing that accounts for the bottom bar. 2-3 hours of rework, but more frustrating than dangerous.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________
- Reason: ___________

---

### DEC-007: Email Confirmation Policy

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Depends On** | Nothing — decide immediately |
| **Deadline** | Before P1-T3 (auth API) |
| **Decision Owner** | Developer |
| **Blocks** | Supabase auth configuration and signup flow |

**Question:** Should email confirmation be required before users can access the dashboard?

**Option A: Email confirmation DISABLED (recommended for MVP)**
Pros:
- Zero signup friction — user creates account and immediately starts adding medicines.
- Eliminates the most common MVP user dropout point (confirmation email not received, lands in spam, user gives up).
- No dependency on email deliverability for core product use.
- Simpler auth flow — no "check your email" screen.
- Can be enabled later once email delivery is verified reliable.

Cons:
- Anyone can sign up with any email address, including fake ones.
- No verified ownership of the email address used for expiry alerts — alerts go to whatever was entered.
- Minor security concern: if session tokens are stolen, attacker can fully access account without a confirmation barrier.

**Option B: Email confirmation ENABLED**
Pros:
- Verified email means expiry notifications actually reach the account owner.
- Prevents fake account creation.
- Standard security practice.

Cons:
- Confirmation email may land in Spam, especially from Supabase's default email domain.
- Many Indian email providers (Yahoo Mail India, Rediffmail) are aggressive spam filters.
- User abandonment rate on "check your email" screens is 20-40% in practice.
- For an app targeting elderly and non-technical users: adding this friction is harmful to adoption.

**Recommended:** Option A (disabled) for MVP. Enable in Phase 6 once email deliverability is verified. Add a note in the product roadmap to revisit.

**Evidence Required:** None. This is an experience/risk tradeoff.

**Impact if Wrong:** Disabling confirmation: low risk. Some fake emails in the database, but no real harm for MVP scale. Enabling confirmation: real risk of abandonment before the app is even used, making all other work moot.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________
- Reason: ___________

---

### DEC-008: Consent Screen Exact Text

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Depends On** | Nothing — write now |
| **Deadline** | Before P1-T4 (auth UI) |
| **Decision Owner** | Developer |
| **Blocks** | Consent screen implementation in Phase 1 |

**Question:** What exact text appears on the consent screen, and what data collection is disclosed?

**Why the text must be decided before building the screen:** DPDPA 2023 requires that consent be informed and specific. A vague "we collect some data" is not valid consent. The text must enumerate what is collected and why. Once the screen is built, changing the text is trivial — but the developer must know what to write before starting P1-T4.

**Minimum required disclosures:**
1. Category of data: medicine names and expiry dates, family member names, email address
2. Purpose for each category: interaction checking, expiry alerts, account access
3. Storage location: servers in India (Mumbai)
4. Retention: until account deletion
5. Third parties: not shared or sold
6. Deletion: available in Settings at any time

**Option A: Minimal consent text (recommended)**
Example text:
```
Before you start, here's what MedSafe collects and why:

• Medicine names and expiry dates — to check for drug interactions
  and alert you before medicines expire
• Family member names — if you choose to manage medicines for your family
• Your email address — to send expiry alerts and access your account

Your data is stored on secure servers in Mumbai, India.
We never sell or share your information.
You can delete all your data anytime from Settings.

[I understand and consent]  [No thanks — sign out]
```
Pros: Short enough to read. Specific enough to be valid. Non-intimidating.
Cons: May be considered insufficient by a strict legal reading — no mention of data processor (Supabase).

**Option B: More detailed consent with data processor disclosure**
Adds: "We use Supabase (supabase.com) to store your data. Their privacy policy applies to data storage."
Pros: More legally complete.
Cons: Technical language about "data processors" may confuse non-technical users (the target demographic). Longer = fewer people read it.

**Recommended:** Option A for MVP. The distinction between data controller and data processor matters for enterprise contexts; for a student project with a small user base, Option A satisfies the spirit of DPDPA without creating an intimidating wall of text.

**Evidence Required:** None.

**Impact if Wrong:** Too-vague consent text is a DPDPA compliance gap. Too-long consent text is a UX friction point. The optimal text is brief, honest, and specific — Option A meets this bar.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________
- Final text committed to: `.claude/outputs/phase-00/consent-screen-text.md`

---

### DEC-009: Medical Disclaimer Text and Locations

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Depends On** | Nothing — decide immediately |
| **Deadline** | Before Phase 3 begins (interaction UI requires it) |
| **Decision Owner** | Developer |
| **Blocks** | Interaction warning UI components in Phase 3 |

**Question:** What is the exact medical disclaimer text, and in which locations does it appear?

**Why this must be decided before Phase 3:** The interaction warning component (`InteractionWarningCard`) must include a disclaimer. If the text isn't decided, the component cannot be finalized. Changing disclaimer text after Phase 3 means updating 6+ components.

**Option A: Single short disclaimer, repeated in multiple locations (recommended)**
Text:
"For informational purposes only. Drug interaction data may be incomplete. Always consult your doctor."

Locations:
- Dashboard footer (every page — persistent, small)
- Each interaction warning card
- "No interactions detected" state
- "Data unavailable" state
- Landing page footer
- Login page footer

Pros: Short enough to be readable anywhere. Not intimidating. Covers the core legal concern.
Cons: Doesn't cover all possible claims. May miss edge cases.

**Option B: Full disclaimer on first interaction view, shorter reminder elsewhere**
Full text (shown first time user sees interaction results):
"MedSafe is not a medical device. Interaction data comes from NIH databases and may not cover all medicines. Results do not account for dosage, individual health conditions, or other factors. Never stop or change a medication based on this information alone. Always consult your doctor or pharmacist."

Short reminder (all other locations): "For informational use only. Consult your doctor."

Pros: More thorough legal coverage. Users get full context when it matters most.
Cons: Full disclaimer is verbose and may be dismissed without reading. Two-tier system adds complexity.

**Option C: No disclaimer on every card — just a global footer disclaimer**
Single persistent dashboard footer disclaimer only. No per-card text.
Pros: Cleaner UI. Less repetitive.
Cons: Legally weaker. If a user acts on a false interaction warning and claims the app didn't warn them, the argument "it was in the footer" is weak.

**Recommended:** Option A. The disclaimer must be on every interaction card — not just the footer. A user who screenshots an interaction warning and shares it needs the disclaimer to be in the screenshot. The short text fits on a card without visual disruption.

**Evidence Required:** None.

**Impact if Wrong:** A disclaimer that's too short or placed only in the footer is a legal vulnerability. A disclaimer that's too long makes users click through without reading. Discovering the optimal text after the interaction UI is built in Phase 3 means updating 6+ components.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________
- Final disclaimer text: ___________
- Locations confirmed: ___________

---

## TIER 3: DECIDABLE NOW — BLOCKING PHASE 3

---

### DEC-010: Severity Color System

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Depends On** | Design system approach (I-1 / DEC-015) |
| **Deadline** | Before P3-T6 (interaction warning UI) |
| **Decision Owner** | Developer |
| **Blocks** | InteractionWarningCard and InteractionBanner components |

**Question:** What are the exact Tailwind color classes for each severity level and status indicator?

**Why this is a blocking decision, not a style choice:** Severity colors carry semantic meaning in a medical context. Red must mean "severe danger." If a mild interaction shows in red, users will over-react. If a severe interaction shows in a soft color, users will under-react. These colors must pass WCAG AA (4.5:1 contrast ratio minimum) or they fail accessibility standards — a requirement for any health app.

**Required color decisions:**

| Status | Background | Text/Border | Badge Label |
|--------|------------|-------------|-------------|
| Severe interaction | ? | ? | "Severe" |
| Moderate interaction | ? | ? | "Moderate" |
| Mild interaction | ? | ? | "Mild" |
| No interactions | ? | ? | "No interactions" |
| Data unavailable | ? | ? | "Unknown" |
| Expiry: safe | ? | ? | "Safe" |
| Expiry: expiring soon | ? | ? | "Expiring Soon" |
| Expiry: expired | ? | ? | "Expired" |

**Option A: Tailwind default semantic palette**
- Severe: `bg-red-100 border-red-500 text-red-800`
- Moderate: `bg-amber-100 border-amber-500 text-amber-800`
- Mild: `bg-yellow-100 border-yellow-400 text-yellow-800`
- Safe/no interaction: `bg-green-100 border-green-400 text-green-700`
- Unavailable: `bg-slate-100 border-slate-300 text-slate-600`
- Expiry safe: `bg-green-100 text-green-800`
- Expiring soon: `bg-amber-100 text-amber-800`
- Expired: `bg-red-100 text-red-800`

Must verify all combinations pass 4.5:1 contrast at `webaim.org/resources/contrastchecker/`.

**Option B: Custom palette matching design system**
Only viable if DEC-015 (design system timing) chooses Option B (full design system now).
If design system is finalized, colors come from there, not Tailwind defaults.

**Recommended:** Decide Option A now and verify contrast. If the design system is later finalized with different colors, updating severity colors is a 20-minute change. Do not block Phase 3 waiting for a design system.

**Evidence Required:** Contrast checker verification for all 5 severity/status pairs.

**Impact if Wrong:** Colors that fail WCAG AA contrast are an accessibility failure. Colors that don't visually differentiate severity levels cause users to misread urgency. Colors that clash when the design system is finalized in Phase 6 require updating 3-4 components.

**Resolution:**
- Date decided: ___________
- Each color combination: ___________
- Contrast ratios verified: ___________

---

### DEC-011: Interaction Severity Display Default

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Depends On** | R6 (false positive data) |
| **Deadline** | Before P3-T6 (interaction warning UI) |
| **Decision Owner** | Developer |
| **Blocks** | InteractionList default filter state |

**Question:** By default, does the interaction panel show ALL severity levels (severe + moderate + mild), or only severe + moderate?

**Option A: Show all interactions by default (recommended)**
Pros:
- More complete information. No interaction is hidden from the user by default.
- Simpler implementation — no filter toggle UI needed.
- If RxNav's "mild" interactions are trivially minor, users learn to judge severity from the badge.

Cons:
- Mild interactions often include warnings like "avoid grapefruit juice" — potentially noise that dilutes attention on severe warnings.
- Higher visual density with many mild interactions.

**Option B: Show only moderate + severe by default, "Show all" toggle reveals mild**
Pros:
- Draws clear attention to actionable interactions.
- Reduces interaction clutter for users with many medicines.
- Standard medical reference UI pattern.

Cons:
- Requires a toggle component — more code.
- Users may not discover mild interactions exist.
- "Show all" is a confusing label if users don't know what "all" means.

**Option C: Show all, but order by severity (severe first, mild last)**
Same as Option A but with explicit severity ordering.
Pros: Complete + organized. Users see most urgent first.
Cons: Same as Option A.

**Recommended:** Decide after R6 results. If RxNav produces 0-1 mild interactions in the 10-pair test, the volume is not a problem — use Option A (show all). If RxNav produces 5+ mild interactions per pair, the noise problem is real — use Option B.

**Evidence Required:** R6 test: how many "mild" interactions does RxNav return per pair on average?

**Impact if Wrong:** If showing all interactions and mild interactions are noisy, users dismiss all warnings (including severe ones). If hiding mild interactions and the hidden interaction is the clinically relevant one for an Indian drug combination, users miss important information.

**Resolution:**
- Date decided: ___________
- R6 finding (mild interaction count): ___________
- Option chosen: ___________

---

### DEC-012: Month/Year Picker Implementation

| Field | Value |
|-------|-------|
| **Status** | 🔴 OPEN — BLOCKING |
| **Depends On** | Nothing — research within 1 hour |
| **Deadline** | Before P2-T3 (Add Medicine Form) |
| **Decision Owner** | Developer |
| **Blocks** | Add Medicine form expiry date input |

**Question:** Should the month/year expiry date picker be built from scratch or assembled from existing components?

**Why this is a decision:** Medicine strips show expiry as MM/YYYY, not a full date. Standard date pickers show a full calendar with day selection — wrong UX for this use case. Options range from building a simple custom component to configuring an existing library.

**Option A: Research and use an existing shadcn/ui configuration or Radix UI primitive**
Spend 30 minutes searching for: "shadcn date picker month year only" and "radix ui month year picker."
Pros: Less custom code, consistent with existing component system.
Cons: May not exist in exactly the right form — shadcn's DatePicker is a full calendar by default.

**Option B: Build a simple custom component with two Select dropdowns**
Structure: `<Select>` for month (Jan-Dec) + `<Select>` for year (current year through current year + 10).
Pros: Trivial to build (30 minutes). Zero dependency on library versions. Fully controllable. Works on all devices.
Cons: Less polished than a date picker. No keyboard navigation between dropdowns automatically.

**Option C: Adapt an existing date picker to only show month/year**
Some date picker libraries (react-datepicker, date-fns) can be configured to show month/year selection only.
Pros: Better visual polish.
Cons: Adds a dependency. More configuration complexity.

**Recommended:** Research Option A first (15 minutes). If a clean solution exists with shadcn, use it. If not, use Option B — two selects is the pragmatic choice. Do not import a new date picker library just for this one input.

**Evidence Required:** 15-30 minutes of component research.

**Impact if Wrong:** Choosing a library approach and later discovering the library breaks on mobile browsers means replacing the component mid-Phase 2. Building a custom component has no such risk — it's just HTML selects.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________
- Specific component or approach: ___________

---

### DEC-013: check-batch Pair Ceiling Value

| Field | Value |
|-------|-------|
| **Status** | 🟡 OPEN — CONDITIONAL |
| **Depends On** | R3 (latency) + R5 (rate limiting) |
| **Deadline** | Before P3-T4 (interaction engine) |
| **Decision Owner** | Developer |
| **Blocks** | check-batch endpoint max pairs constant in Phase 3 |

**Question:** What is the exact `MAX_BATCH_PAIRS` constant in the check-batch endpoint?

**Current baseline assumption:** 15 pairs (based on assumed 500ms p95 latency).

**Calculation after research:**
```
If R5 shows no rate limiting:
  MAX_BATCH_PAIRS = floor(9000ms / R3_p95_latency)

If R5 shows throttling requiring Dms delay between calls:
  MAX_BATCH_PAIRS = floor((9000ms) / (R3_p95_latency + Dms))
```

**This is a calculated value, not a judgment call.** But the decision must be recorded formally because changing it after Phase 3 requires updating the API route, the client-side orchestration (which uses the batch size to chunk pairs), and any tests that use the constant.

**Evidence Required:** R3 p95 latency measurement + R5 rate limit finding.

**Impact if Wrong:** Setting the ceiling too high causes Vercel timeouts. Setting it too low means more client-side iterations per interaction check — slower UX but not a failure. If in doubt, round down by 2 pairs from the calculated maximum.

**Resolution:**
- Date decided: ___________
- R3 p95 latency: ___________
- R5 rate limit delay (if any): ___________
- MAX_BATCH_PAIRS value: ___________
- Update architecture baseline at: `.claude/outputs/architecture-baseline.md` (Part 4)

---

## TIER 4: NON-BLOCKING — DECIDE BEFORE LAUNCH

---

### DEC-014: App Name

| Field | Value |
|-------|-------|
| **Status** | 🟢 OPEN — NON-BLOCKING |
| **Depends On** | Nothing |
| **Deadline** | Before Phase 1 deploys to a public Vercel URL |
| **Decision Owner** | Developer |
| **Blocks** | Landing page copy, email templates, URL structure |

**Question:** What is the final app name?

**Option A: MedSafe (current working name)**
Pros: Descriptive, professional, memorable.
Cons: The name "MedSafe" may conflict with existing apps (verify on Play Store, App Store, and Google). "MedSafe is not a medical device" disclaimer sounds circular and confusing. Domain may not be available.

**Option B: CabinetMD**
Pros: "Cabinet" evokes the medicine cabinet metaphor. "MD" signals medical context.
Cons: The MD suffix may imply medical credentials. Could be misread as a doctor-facing app.

**Option C: SafeScript**
Pros: "Safe" + "Script" (prescription). Memorable.
Cons: "Script" means prescription — may imply the app manages prescriptions, which it doesn't.

**Option D: Davakar** (Hindi: "medicine giver" or "medicine keeper")
Pros: India-specific, culturally resonant, unique, likely available as domain.
Cons: Non-English name requires explanation in an English UI. May reduce discoverability.

**Option E: MedCabinet**
Pros: Clear metaphor (medicine cabinet). Descriptive. No medical credentialing implied.
Cons: Less distinctive. Domain availability uncertain.

**Evidence Required:** 15-minute check: search each candidate name on Google Play Store, Apple App Store, and a domain registrar.

**Impact if Wrong:** Name chosen and then changed: update all UI strings, component names, email templates, domain references, landing page copy. Estimate: 2-3 hours of find-and-replace. Not catastrophic. But naming friction is emotionally costly when you're deep in development.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________
- Domain availability: ___________
- Play Store conflicts found: ___________

---

### DEC-015: Design System Timing

| Field | Value |
|-------|-------|
| **Status** | 🟢 OPEN — NON-BLOCKING |
| **Depends On** | Nothing |
| **Deadline** | Before Phase 6 begins (but ideally confirmed before Phase 1) |
| **Decision Owner** | Developer |
| **Blocks** | Phase 6 polish scope estimate |

**Question:** Is a full design system generated before Phase 1 (Claude Design, Google Stitch, Figma), or is the shadcn/ui default styling used as a placeholder through Phase 5 with a design pass planned for Phase 6?

**Option A: Placeholder → full design in Phase 6 (recommended)**
Pros: Ship the interaction engine first. Don't delay functional development for aesthetic work. shadcn/ui defaults are clean and functional. Design polish can be applied after the product works.
Cons: Phase 6 design pass will touch every component. Estimate 2-3 sessions for a comprehensive design update.

**Option B: Generate design system now, apply before Phase 1 UI work begins**
Pros: All UI components are built against the final design from the start. No visual rework in Phase 6.
Cons: Design before a product exists is premature — you don't know which components matter until they're built. Design tools (Claude Design, Google Stitch) require time and iteration. Blocks Phase 1 start while design is iterated.

**Recommended:** Option A. The product's value is in the interaction engine and expiry tracking, not in its visual polish. Ship it working first.

**Impact if Wrong:** Option A: Phase 6 has more work. Option B: Phase 1 is delayed, and the design may not fit the actual components that emerge from development.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________

---

### DEC-016: Error Monitoring Tool

| Field | Value |
|-------|-------|
| **Status** | 🟢 OPEN — NON-BLOCKING |
| **Depends On** | Nothing |
| **Deadline** | Before Phase 1 first production deploy |
| **Decision Owner** | Developer |
| **Blocks** | Error tracking setup in P1-T7 |

**Question:** Which error monitoring tool is used?

**Option A: Sentry (recommended)**
Free tier: 5,000 errors/month, 14-day retention, source maps, performance monitoring.
Pros: Industry standard. Next.js SDK is excellent. One-line integration. Alerts via email on new errors.
Cons: Requires creating an account and DSN configuration.

**Option B: Vercel Analytics**
Built into Vercel dashboard.
Pros: Zero configuration for page-level errors.
Cons: Limited error detail. No stack traces. No alerts. Not useful for API route errors.

**Option C: No error monitoring (just Vercel logs)**
Pros: Zero setup.
Cons: Logs are not searchable or aggregatable. Finding a production bug requires manually scanning timestamped log entries. You will not know when something breaks unless a user tells you.

**Recommended:** Option A (Sentry). The 30-minute setup cost in Phase 1 pays for itself the first time a production error is caught automatically.

**Impact if Wrong:** No error monitoring means production bugs are discovered through user complaints (or not at all). For a health app with safety implications, this is unacceptable.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________
- DSN stored: YES / NO

---

### DEC-017: Privacy Policy Depth

| Field | Value |
|-------|-------|
| **Status** | 🟢 OPEN — NON-BLOCKING |
| **Depends On** | Nothing |
| **Deadline** | Before sharing the app with any external users |
| **Decision Owner** | Developer |
| **Blocks** | `/privacy` page content |

**Question:** How comprehensive is the privacy policy?

**Option A: Minimal but honest (recommended for student project)**
1-2 pages covering: what data, why, where stored, how long, how to delete, contact email.
Pros: Actually read by users. Proportionate to a student project's scale and risk.
Cons: May not cover all DPDPA edge cases.

**Option B: Comprehensive policy**
Full DPDPA-compliant policy covering: data controller identity, data processor (Supabase), legal bases for processing, data subject rights (access, correction, erasure, portability), breach notification procedure, cross-border transfers.
Pros: Full legal coverage.
Cons: Most users won't read it. Overkill for a student project. Takes significant time to draft correctly.

**Recommended:** Option A. The key requirement is that the policy is honest about what data is collected and how users can delete it. That is achievable in one focused writing session.

**Evidence Required:** None.

**Impact if Wrong:** A privacy policy that misrepresents data practices is worse than no privacy policy. The policy must be accurate even if brief.

**Resolution:**
- Date decided: ___________
- Option chosen: ___________

---

### DEC-018: Synonym Table Initial Size Target

| Field | Value |
|-------|-------|
| **Status** | 🟡 OPEN — CONDITIONAL |
| **Depends On** | R4 (resolution rate informs how many synonyms are needed) |
| **Deadline** | Before Phase 3 begins |
| **Decision Owner** | Developer |
| **Blocks** | Synonym table `rxnorm_synonyms.json` completeness target |

**Question:** How many entries should the synonym table contain before Phase 3 begins?

**Option A: 30 entries (current minimum in checklist)**
Covers the most obvious India/UK → US name differences.
Viable if R4 resolution rate ≥ 70% with 30 entries.

**Option B: 50-75 entries (moderate expansion)**
Adds less-common but still significant name differences.
Appropriate if R4 is 55-69% with 30 entries — more synonyms may push it above threshold.

**Option C: 100+ entries (comprehensive first pass)**
Covers a wide range of Indian pharmaceutical naming conventions vs US.
Appropriate if R4 is 40-54% — significant expansion effort needed before interactions are viable.

**Decision Criteria:** R4 resolution rate determines which option is needed. This is not a pre-decision — it flows from DEC-002.

**Evidence Required:** R4 final resolution rate.

**Impact if Wrong:** Too few synonyms → lower coverage, poorer interaction engine. Too many synonyms → delayed Phase 3 start. The cost of adding synonyms is time, not rework.

**Resolution:**
- Date decided: ___________
- R4 resolution rate: ___________
- Option chosen: ___________
- Target entry count: ___________

---

## DECISION STATUS SUMMARY

| ID | Decision | Status | Deadline | Depends On |
|----|----------|--------|----------|------------|
| DEC-001 | CDSCO Primary Data Source | 🔴 BLOCKING | Before P1 | R1 |
| DEC-002 | Resolution Rate Response (40-69%) | 🟡 CONDITIONAL | Before P3 | R4 |
| DEC-003 | Gemini Fallback Activation | 🟡 CONDITIONAL | Before P3 | R4 + R8 |
| DEC-004 | Rate Limit Mitigation | 🟡 CONDITIONAL | Before P3 | R5 |
| DEC-005 | Go/No-Go Master Decision | 🔴 BLOCKING | End of Phase 0 | All research |
| DEC-006 | Mobile Navigation Layout | 🔴 BLOCKING | Before P1-T5 | None |
| DEC-007 | Email Confirmation Policy | 🔴 BLOCKING | Before P1-T3 | None |
| DEC-008 | Consent Screen Text | 🔴 BLOCKING | Before P1-T4 | None |
| DEC-009 | Medical Disclaimer Text + Locations | 🔴 BLOCKING | Before P3 | None |
| DEC-010 | Severity Color System | 🔴 BLOCKING | Before P3-T6 | DEC-015 |
| DEC-011 | Severity Display Default | 🔴 BLOCKING | Before P3-T6 | R6 |
| DEC-012 | Month/Year Picker Approach | 🔴 BLOCKING | Before P2-T3 | None |
| DEC-013 | check-batch Ceiling Value | 🟡 CONDITIONAL | Before P3-T4 | R3 + R5 |
| DEC-014 | App Name | 🟢 NON-BLOCKING | Before P1 deploy | None |
| DEC-015 | Design System Timing | 🟢 NON-BLOCKING | Before P6 | None |
| DEC-016 | Error Monitoring Tool | 🟢 NON-BLOCKING | Before P1 deploy | None |
| DEC-017 | Privacy Policy Depth | 🟢 NON-BLOCKING | Before external users | None |
| DEC-018 | Synonym Table Size Target | 🟡 CONDITIONAL | Before P3 | R4 |

---

## DECISIONS THAT APPEAR OPEN BUT ARE ALREADY RESOLVED

These decisions were made in prior planning but are documented here to prevent reopening them.

| Topic | Resolution | Where Documented |
|-------|-----------|-----------------|
| Database client (Prisma vs Supabase JS) | Prisma — migration management required | tech-stack.md |
| OCR engine (Tesseract vs EasyOCR) | Tesseract only — EasyOCR OOM crashes Render | architecture-baseline.md ND-4 |
| Autocomplete search (server vs client) | Client-side Fuse.js — serverless cache unreliable | architecture-baseline.md ND-8 |
| Interaction endpoint design (single vs two) | Two endpoints — GET cache-only, POST batched | architecture-baseline.md ND-3 |
| FastAPI timing (Phase 1 vs Phase 5) | Phase 5 only — no Python need before OCR | architecture-baseline.md ND-1 |
| Supabase region | ap-south-1 Mumbai — DPDPA compliance | architecture-baseline.md ND-6 |
| medicines.rxcui vs rxcuis | TEXT[] array — combination drug support | architecture-baseline.md ND-5 |
| interactions_cache UNIQUE constraint | No UNIQUE — multiple interactions per pair | architecture-baseline.md ND-11 |
| Email notification provider | Resend — 3,000/month free, simple API | tech-stack.md |
| Auth method | Email + password only — no OAuth for MVP | architecture-baseline.md Part 7 |

---

## HOW TO USE THIS REGISTER

**When a new unresolved decision is discovered during development:**
1. Stop. Do not implement around it.
2. Add a new entry to this register.
3. Assign it a status, deadline, and owner.
4. Implement only after the decision is resolved and recorded.

**When a decision is made:**
1. Fill in the Resolution section of the decision entry.
2. Update the status to ✅ RESOLVED.
3. Update the affected documents (architecture-baseline.md, tech-stack.md, etc.).
4. Update _state.md Session Log.

**When research results arrive (R1-R8):**
1. Open the relevant conditional decisions (marked 🟡).
2. Apply the decision criteria to the result.
3. Record the resolution.
4. Update MAX_BATCH_PAIRS, synonym target, Gemini activation, or architecture baseline as appropriate.
