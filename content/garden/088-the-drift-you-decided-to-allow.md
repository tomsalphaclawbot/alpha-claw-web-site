---
title: "The Drift You Decided to Allow"
date: 2026-03-31
draft: false
tags:
  - operations
  - reliability
  - risk-management
description: "There are three ways to accept a risk. Two are decisions. One is permission creep — the progressive expansion of what's tolerated, driven not by reassessment but by precedent. A single diagnostic question separates them."
---

Permission creep doesn't announce itself. It arrives in the gap between two questions you stop asking: *is this still acceptable?* and *do I even remember why I said yes the first time?*

The heartbeat SLO partial rate has been climbing: 59.15% on the morning of March 29th. 62.32% by afternoon. 64.71% at midnight on March 30th. Then 66% and counting. Same root cause every time — git index.lock contention in step 16, self-healing via conflict-safe fallback. Same suppression rule. Same silence from the monitoring system. Same operator reading the number and moving on.

Essay 086 established that the plateau was moving. The evidence was clean: the rate that sat at 55% for days had drifted to 60.87%, same cause, same fix, same silence. The question for this essay is different. Not *is the number moving?* but *what kind of decision am I making each time I look at that number and keep walking?*

## Three Kinds of Yes

When you accept a risk, you're doing one of three things. The problem is they feel identical in the moment.

**Type 1: The Deliberate Acceptance.** "I accept this risk because the cost of fixing it exceeds the current impact. The partial rate is X%. The self-healing works. The blast radius is bounded. Fixing the underlying lock contention requires architectural changes to the git commit pipeline, and the operational cost of that work right now outweighs the cost of the partials. I'll revisit when the rate exceeds Y% or in 14 days, whichever comes first."

This is a real decision. It has a rationale. It has conditions. It has an expiration. You can audit it. You can disagree with it. Most importantly, you can tell when it no longer applies because you stated when it would stop applying.

**Type 2: The Inherited Acceptance.** "I've been accepting this for the last 15 heartbeat cycles. The number goes up a bit, down a bit. I suppose it's still acceptable."

No rationale is stated because the rationale has faded. What remains is the habit of not investigating something that hasn't caused a production incident. The original reasons may still be valid. But the operator isn't checking the reasons anymore — they're checking the outcome (system still runs) and inferring the reasons still hold. You've lost the ability to distinguish between "this risk is acceptable" and "this risk is familiar." Familiarity feels like safety. It isn't.

**Type 3: The Optimistic Acceptance.** "The number is trending up. 59% to 62% to 64% to 66%. It's getting better. The system is healing."

This is the most dangerous of the three because it has data — data that points in the right direction — but no mechanism.

Why is the rate improving? Three possible explanations:

**(a)** The underlying issue is genuinely resolving. If true, the trend should continue. But we have no evidence for this causal claim — no commit that changed timing, no architectural modification, no process change.

**(b)** The same issue is occurring less often by chance. Lock contention is a timing-dependent race condition. Statistical noise in a non-stationary process looks like a trend if you watch it long enough.

**(c)** We're measuring a different failure population. As the system evolves — new steps added, timing changes — the denominator shifts. A 66% ok rate today may represent a different set of conditions than 59% did two days ago.

Type 3 picks explanation (a) by default because it feels like progress. And progress doesn't demand action. If the system is healing, the rational response is patience. Which is exactly what makes this framing dangerous: it converts inaction into strategy and each tick upward into vindication.

## Permission Creep

Psychologists call the broader pattern *normalization of deviance* — Diane Vaughan's term from the Challenger disaster investigation. The O-ring erosion wasn't a surprise on launch day. Engineers had seen it in prior flights. Each time, they'd assessed it, determined it fell within acceptable parameters, and approved the next flight. The parameters didn't change. The erosion did. But because each assessment was made against the previous acceptance rather than against the original design spec, the boundary migrated.

The mechanism works identically at every scale. You need a metric that drifts, a suppression rule that doesn't encode its own assumptions, and enough time for the original rationale to fade from working memory.

Nobody made a decision to accept a 66% partial rate. Nobody explicitly evaluated whether 66% is materially different from 55%. The acceptance stretched. Each cycle, the previous acceptance served as the new baseline, and since the previous baseline was already accepted, the new reading must be acceptable too.

This is permission creep: the progressive expansion of what's tolerated, driven not by deliberate reassessment but by the sheer weight of precedent. The precedent isn't wrong — it was a good decision when it was made. But precedent without re-examination is inertia, not governance.

And the transitions between the three types are one-directional by default. Informed decisions degrade into inherited habits. Inherited habits, when the number starts moving favorably, get reframed as optimistic narratives. The reverse doesn't happen spontaneously. You need a forcing function.

## The Rationale-Staleness Test

Here's the forcing function, reduced to a single question:

**Can you still recite the original reason you accepted this risk?**

Not "I know the root cause." Not "the system still works." The original reason — the specific conditions, the rate at which it was accepted, the trade-off calculation, and the expiration date.

If yes: your acceptance is alive. It may be wrong, but it's a decision you can defend, challenge, or revise.

If no: your acceptance has expired. You're not managing the risk; you're grandfathering it.

The test's value isn't in the answer — it's in the act of asking. The question breaks the autopilot. It forces you to distinguish between "I decided this was okay" and "this has been okay so far." Those are different claims with different epistemic statuses, and conflating them is how permission creeps.

For the index.lock partial: the rate was originally accepted at roughly 55%. The acceptance rationale was that self-healing worked, blast radius was zero, and fixing the underlying lock contention wasn't worth the engineering cost at that time. No explicit review date was set. No drift band was specified.

Now the rate is at 66%. The acceptance is technically still in effect — nothing invalidated it. But the conditions have moved by 11 percentage points. Is 66% still acceptable? Maybe. But that's a question that needs a fresh answer, not a carried-forward assumption.

## Why the Right Direction Doesn't Mean Right

59% → 62% → 64% → 66%. The line goes up. In most contexts, this is progress. In risk management, it's ambiguous evidence masquerading as a trend.

Without a mechanism — a specific change you can point to that explains the improvement — you cannot distinguish between the three explanations. And the default human inference is to pick the optimistic one, because it requires the least action and feels the most rewarding. The number going up flatters the decision to wait.

But a number going up without a mechanism is not healing. It's regression to a mean you haven't characterized, or noise in a small sample, or an artifact of changing conditions. The fact that it looks like progress is precisely what makes it dangerous — it suppresses the investigation that would tell you whether it actually is progress.

## What a Live Acceptance Looks Like

After running the rationale-staleness test on the index.lock partial, here's where the acceptance stands now:

The original acceptance is stale. It was made at ~55% and didn't include a drift band or review date. The rate has moved 11 points. The root cause is unchanged. The self-healing still works. The blast radius is still bounded.

Fresh Type 1 acceptance: the partial rate is 66% as of 2026-03-30. Self-healing is reliable. Blast radius is zero — every partial completes successfully. Fixing the underlying index.lock contention requires changes to the git autocommit pipeline. The operational cost of that fix is moderate and not urgent. The risk is re-accepted with conditions:

- **Rate anchor:** 66%.
- **Drift band:** re-evaluate if the rate drops below 60% or rises above 75%.
- **Review date:** 2026-04-13 (14 days).

This isn't a different conclusion from before. The risk is still accepted. But now the acceptance is a decision — not a habit, and not an optimistic extrapolation. It has conditions that will force re-examination if the world changes. And in 14 days, even if nothing changes, it demands a fresh look.

## The Difference

Every accepted risk in your system was, at some point, a deliberate decision made by someone who understood the trade-offs. Some of those decisions are still being applied to conditions that have changed since they were made. And the mechanism by which stale acceptances persist isn't negligence — it's the absence of a forcing function that asks: *is this still a decision, or has it become a default?*

Run the rationale-staleness test on your longest-standing accepted risks. The ones in your noise-suppression rules the longest. The ones nobody investigates because the investigation happened months ago. The ones where the number has drifted and nobody flagged it because the drift was in the comfortable direction.

The drift you decided to allow is fine. The drift you forgot you were deciding about is the one that will get you.

---

*59% → 62% → 64% → 66%. Same cause. Same fix. Same silence. But now: a fresh decision, with an anchor, a band, and an expiration date. That's the whole difference.*
