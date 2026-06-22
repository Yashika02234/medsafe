# Defects — MedSafe

> This file logs repeated mistakes and their fixes.
> Claude reads this to avoid making the same mistake twice.
> Update after ANY repeated error pattern.

---

## Format

### [DATE]

**Problem:** What went wrong

**Cause:** Why it happened

**Rule:** What to do instead, going forward

---

## Logged Defects

### 2026-06-22 (Phase 6 — service worker cache fallback would have bypassed auth redirects)

**Problem:** The first draft of `public/sw.js` (P6-T5, PWA config) used a network-first-then-cache-fallback strategy for *all* page navigations: on fetch failure, serve whatever was last cached for that URL. Caught before shipping, not after: a service worker's `fetch` handler runs entirely client-side, before any request reaches the Next.js middleware that enforces auth redirects — so a cached copy of `/dashboard` or `/medicines` (a real medicine list) would still render from the SW cache even after the user logged out, or for a different user on a shared/public device, since the cache fallback never re-checks auth state at all.

**Cause:** Service workers intercept navigation at the browser layer, fully in front of (not behind) the server's own auth logic. A caching strategy that's perfectly safe for a stateless marketing site silently becomes a cross-session data leak the moment any cached route holds per-user data — this isn't obvious from reading the SW code in isolation, since the code "looks correct" (network-first is the recommended pattern for dynamic content) and the actual risk only shows up when reasoning about *which URLs* get cached, not the caching strategy itself.

**Rule:** Any service worker (or other client-side cache layer that can serve a response without hitting the server) must explicitly exclude every authenticated/protected route from caching and from cache-fallback — check the route against the same `PROTECTED_PREFIXES` list `middleware.ts` already uses, and route those requests straight to the network with no fallback. Only genuinely public, stateless pages should ever get offline-tolerance caching. Before adding or expanding any caching layer (this includes a future move to `next-pwa`/Workbox), audit it against this list first.

### 2026-06-19 (Phase 6 — bottom sheets rendering behind BottomNav, two wrong diagnoses before the real one)

**Problem:** User reported the submit button in `AddFamilyMemberSheet` was invisible and unreachable by scrolling. First fix attempt (add `overflow-y-auto max-h-[88vh]` to match the existing medicine sheets) didn't help. Second fix attempt (restructure to a flex layout with the button in a `flex-shrink-0` footer outside the scroll area, switch to `dvh` units) *also* didn't help — user reported "still same issue." Only a screenshot revealed the real cause: the button wasn't below the fold at all, it was rendering directly **behind** `BottomNav` — both used `z-50`, and since `BottomNav` renders later in the DOM (a sibling after `{children}` in the dashboard layout), it painted on top of the sheet's bottom edge. No amount of scrolling can fix an opaque fixed bar permanently covering part of the screen.

**Cause:** Two wrong assumptions made before looking at a screenshot. First assumed it was a height/overflow problem (matched existing sheets, which turned out to share the same latent bug — they just hadn't had a user notice yet). Second assumed it was a mobile-keyboard/viewport-unit problem. Neither hypothesis was checked against an actual screenshot of the broken state before being implemented — both were guesses based on "what usually causes this," not direct observation. The screenshot, which the user provided only on the second "still broken" report, immediately showed the actual cause (a sliver of the button peeking out from behind the opaque nav bar).

**Rule:** When a UI bug report doesn't resolve after one fix attempt, ask for a screenshot *before* attempting a second fix — don't guess again. A screenshot of broken layout state is almost always faster than reasoning about CSS in the abstract, especially for anything involving fixed/sticky positioning, stacking contexts, or z-index, where the failure mode is often invisible from reading the code alone (two `z-50` values look "fine" individually; only a render shows they collide). Also: when one fixed-position component is found to collide with another, audit every other fixed-position element in the app for the same collision before calling it fixed — found and fixed the identical `z-50` collision between `BottomNav` and `CameraCapture` (the OCR scanner) in the same pass, which had not yet been reported but had the same bug (capture button only 40px from the bottom, well within the nav's 82px height).

### 2026-06-19 (Phase 5 — new /scan route missing from middleware allowlist)

**Problem:** `src/middleware.ts` protects routes via a hardcoded `PROTECTED_PREFIXES` array, not a "protect everything except an explicit public list." When the new `/scan` route (P5-T5, camera capture UI) was added, it was never added to that array. Confirmed via curl that an unauthenticated request to `/scan` returned 200 (the full camera UI rendered) while every other dashboard route correctly 307-redirected to `/login`. Not caught by `tsc`, `eslint`, or `next build` — only found by manually curling the new route post-build.

**Cause:** Adding a new top-level route under `(dashboard)/` does not automatically inherit auth protection in this codebase — protection is opt-in per route prefix, not the default. Built the page, the proxy API route (which *was* correctly protected via `requireAuth()`), and the UI flow, but didn't think to also check `middleware.ts` since it's a separate file with no obvious connection to a new page route.

**Rule:** Same root-cause shape as the Session 16 IDOR finding below — whenever a new top-level page route is added under `(dashboard)/`, explicitly add it to `PROTECTED_PREFIXES` in `src/middleware.ts` and verify with an unauthenticated curl request (expect 307, not 200) before considering the route done. Don't assume a new route is protected just because the API route it calls is — the UI route and the API route are gated independently in this codebase.

### 2026-06-17 (Phase 5 — Tesseract line_num grouping bug)

**Problem:** `parse_medicine_name`'s "biggest-font line" heuristic grouped OCR words by `line_num` alone. On a real two-line strip image (brand name + expiry date), it returned both lines concatenated together (`"DOLO 650 EXP: 09/2027"`) instead of just the brand name. The existing parametrized test suite didn't catch this — its assertion was `brand.split()[0] in medicine_name`, a substring check that's still true even when the expiry line is wrongly appended.

**Cause:** Tesseract's `image_to_data` hierarchy is `block_num > par_num > line_num > word_num` — `line_num` resets to 1 within each new block, so two words from *different* blocks can share the same `line_num` while being completely unrelated lines. Grouping by `line_num` alone silently merged them.

**Rule:** When grouping Tesseract `image_to_data` output into lines, always key on the composite `(block_num, par_num, line_num)`, never `line_num` alone. Caught via a manual curl smoke test with a real two-line image — the pytest suite's assertions were too loose (substring match) to catch the actual bug despite the test "passing." When testing text-extraction/grouping logic, assert what should NOT be present (e.g. `expiry_line not in medicine_name`), not just that the expected substring is present — a loose positive assertion can pass even when the output is subtly wrong.

### 2026-06-17 (Phase 5 — created a file, never committed it, asked user to deploy from it)

**Problem:** Created `backend/Dockerfile` (needed so Render could `apt-get install tesseract-ocr`, since the native Python runtime has no apt access) but never ran `git add`/`commit`/`push`. Told the user to deploy it on Render anyway. Every deploy attempt failed with "Dockerfile not found." Spent multiple rounds guessing at Render UI field semantics (Dockerfile Path, Docker Build Context Directory, Root Directory prefix interactions) and even told the user to create an entirely new Render service — all before checking the one thing that actually mattered: whether the file was in the repo Render was cloning. It wasn't. `git log --oneline -- backend/Dockerfile` showed zero commits.

**Cause:** Assumed that creating a file locally meant it was "done" and ready to deploy. Skipped the basic check (`git status`/`git log`) before sending the user into an external dashboard to debug what was actually a local oversight.

**Rule:** Before telling the user to deploy, redeploy, or otherwise act on a file in an external system (Render, Vercel, etc.), verify it's actually committed and pushed (`git log --oneline -- <path>` or `git status`) — don't assume a `Write` tool call means the file is live anywhere outside the local working tree. If a deploy fails identically across multiple different configuration attempts, check whether the file exists in the remote repo *before* re-guessing UI settings.

### 2026-06-17 (Phase 5 — OCR deskew angle normalization)

**Problem:** `image_preprocessor._deskew` worked on a multi-line, rotated test image but completely erased the text (resulting in a blank white output) on a wide, single-line, *already-upright* image — exactly the common case for a real medicine strip photographed roughly straight.

**Cause:** `cv2.minAreaRect`'s angle (OpenCV 4.5+ convention) comes back near 90° — not near 0° — for a wide rectangle with little/no skew, because the convention reports the angle of whichever box edge it picks as the reference, not "deviation from upright." The deskew correction formula (`-(90+angle) if angle < -45 else -angle`) was copied from older deskew tutorials written for OpenCV's pre-4.5 angle convention and never triggers its `< -45` branch in this version, so a true-zero-skew case got "corrected" with a spurious ~90° rotation, rotating the single line of text out of the frame entirely.

**Rule:** When using `cv2.minAreaRect` for deskew, normalize the angle into (-45°, 45°] first (`if angle > 45: angle -= 90`) before negating — don't trust angle-correction formulas from tutorials without checking which OpenCV angle convention they assume. Caught by testing a wide single-line upright image, not just a rotated one — **always test the "no correction needed" case explicitly**, since deskew bugs often only show up when the input *shouldn't* be rotated. Added as a permanent regression case in `backend/tests/test_image_preprocessor.py`.

### 2026-06-17 (Phase 3 — drug-class detection severity keywords)

**Problem:** Live-tested the new opioid-class detection (Diazepam + Codeine — a textbook severe interaction, "CNS dep SEVERE" per the Phase 0 validation report) and it classified as MILD. The matched FDA text said "increases the risk of respiratory depression" — a severity term not in the keyword list.

**Cause:** Same root cause as the earlier Warfarin+Aspirin bug: the severity keyword list was built from the spec document's examples, not validated against every real label phrase encountered. "Respiratory depression" and "coma" are common opioid/benzodiazepine boxed-warning terms that simply weren't in the original list.

**Rule:** Reinforces the existing rule in this file — every new detection path (class-term matching, rule-based pairs, anything that surfaces new label text) must be live-tested against a real, known-severity pair before trusting the classifier, not just checked for "did it detect" — detection and correct severity are separate things to verify. Added "respiratory depression" and "coma" to `SEVERE_KEYWORDS` in `src/lib/services/interactionEngine.ts`.

### 2026-06-17 (Phase 2/3 wrap-up — dashboard never wired to real data)

**Problem:** `src/app/(dashboard)/dashboard/page.tsx` (the actual visible Dashboard screen) had its own separate, duplicated Prisma queries for `total`/`expiringSoon` instead of using `/api/dashboard/summary`, and its "Alerts" stat card was hardcoded to the literal string `"—"` — it never called the interaction engine at all. This meant that even after the entire Phase 3 interaction engine was built, tested, and wired into `/api/interactions` and `/api/dashboard/summary`, the dashboard a user actually sees never reflected it. The dead `/api/dashboard/summary` route (built in Phase 2, confirmed zero call sites) masked this — its existence created a false impression that "dashboard integration" was done.

**Cause:** When wiring a new computed value (interaction count) into "the dashboard," only the obvious API route was updated. The actual page component fetches its own data independently (a Next.js Server Component pattern — direct Prisma calls, no client-side fetch to its own API route) and was never checked.

**Rule:** When adding a new data source meant to surface on a page, grep for *every* place that page's data could come from before declaring it wired up — don't assume the API route with the matching name is actually consumed by the page. For Server Component pages in this codebase, check the page file itself for inline Prisma queries, since the established pattern here is direct server-side fetching, not client calls to internal API routes.

**Resolution:** Updated `dashboard/page.tsx` to call `checkAllInteractions` directly (same as `/api/interactions` does) and deleted the now-confirmed-dead `/api/dashboard/summary` route rather than maintaining two parallel implementations of the same query.

### 2026-06-17 (Phase 3 — interaction severity classification)

**Problem:** The first OpenFDA severity classifier used exact multi-word phrases as keywords (e.g. `"significant bleeding"`, `"monitor closely"`). Live testing against a real, known-severe pair (Warfarin + Aspirin, validated SEVERE in the Phase 0 report) classified it as MODERATE — the actual FDA label text said "closely monitor" (reversed word order) and "risk of Bleeding" (not the bigram "significant bleeding").

**Cause:** The Phase 0 validation report's severity keyword table was a human-written approximation of the kind of language FDA labels use, not verbatim strings guaranteed to appear. Matching on exact bigrams is brittle against real-world text variance.

**Rule:** When classifying severity from FDA label text, match on single significant terms (`"bleeding"`, `"hemorrhage"`, `"monitor"`, `"contraindicat"` as a stem) rather than fixed multi-word phrases — real label text varies in word order and surrounding phrasing. Always verify any new keyword set against at least one real, known-severity pair before trusting it, not just against the spec document. See `src/lib/services/interactionEngine.ts`.

**Also note:** `checked_pairs`/`interactions_cache` pair ordering is `rxcui_a < rxcui_b` lexicographically as **strings**, which does not match numeric ordering (e.g. `"11289" < "1191"` as strings, even though 1191 < 11289 numerically). Any manual DB query/cleanup against these tables must compare as strings, not assume numeric intuition — got this backwards once during verification and silently deleted zero rows.

### 2026-06-17 (Phase 2 — IDOR + RLS audit)

**Problem:** `POST /api/medicines` accepted an optional `family_member_id` from the request body and used it directly without verifying it belonged to the authenticated user — an IDOR. A malicious caller could attach a medicine to another user's family member.

**Cause:** Ownership verification was implemented for `GET`/`PUT`/`DELETE` (all filter/check via `family_member.user_id`), but the `POST` code path's optional explicit-`family_member_id` branch was added without the same check. Not exploitable via the current UI (which never sends this field — Family Mode ships in Phase 6), but live in the API regardless.

**Rule:** Every endpoint that accepts a foreign-key ID from the client (not derived server-side from the session) must verify ownership before use — never assume "the UI doesn't send this" is sufficient protection. When adding Family Mode in Phase 6, audit every new family-member-scoped endpoint for this same pattern.

**Also confirmed during this audit:** Prisma connects via `DATABASE_URL`/`DIRECT_URL` (a direct Postgres connection), so **Postgres RLS policies do not apply to any Next.js API route** — all isolation in this app is enforced by the `user_id`/`family_member` filters in application code, not by `rls-policies.sql`. RLS would only matter if a client-side Supabase call were ever made directly (none currently exist). Don't rely on "RLS is enabled" as evidence of isolation when auditing routes that go through Prisma — check the `where` clause instead.

### 2026-06-10

**Problem:** RxNav Drug Interaction API (`rxnav.nlm.nih.gov/REST/interaction/`) returns 404 for all endpoints.

**Cause:** The interaction service has been decommissioned from rxnav.nlm.nih.gov. The base API (RxNorm name resolution) still works, but the interaction subpath no longer exists — it is absent from the full resource list returned by `GET /REST/`.

**Rule:** Never use `rxnav.nlm.nih.gov/REST/interaction/` — it does not exist. Use `api.fda.gov/drug/label.json` for drug interaction data instead (text mining approach, validated 7/10 detection, 0 false positives). See: `.claude/outputs/phase-00/interaction-validation-report.md`.

---

## Common Pitfalls to Watch For

### 1. Supabase Auth Token Mistakes
Do NOT generate custom JWTs. Use Supabase's built-in session token verification.
(Learned from SOLACE project — caused 401 Unauthorized errors.)

### 2. Duplicated Validation Logic
Validation must live in a shared schema layer (Zod for frontend, Pydantic for backend).
Never duplicate validation in components AND API routes.

### 3. Premature Abstraction
Do not create abstract base classes, factory patterns, or generics until
the same pattern appears 3+ times in actual code.

### 4. Adding Packages Without Justification
Every new npm/pip package must be justified. Check if the functionality
can be achieved with existing dependencies first.

### 5. Overengineering Error Handling
Simple try/catch with user-friendly messages. No custom error class hierarchies at MVP stage.
