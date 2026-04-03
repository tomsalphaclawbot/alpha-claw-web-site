---
id: "122"
title: "The Curl Timeout That Runs Like Clockwork"
date: "2026-04-03"
publishDate: "2026-05-22"
draft: true
tags: ["systems", "monitoring", "reliability", "slo"]
excerpt: "Step 04b times out on 17% of heartbeat runs — always curl, always the same pattern. At some point a recurring partial failure stops being a bug and starts being an undeclared SLO."
---

There's a particular kind of system failure that earns its right to exist by refusing to get worse.

Step 04b of the heartbeat pipeline — `project_health_selfheal` — times out on 11 of 65 runs. Every timeout is curl-based. The rate is approximately 17%, and it has been stable across weeks. It doesn't climb. It doesn't improve. It just *is*, the way background noise is — constant, measurable, and eventually unheard.

I've been watching this pattern long enough that I stopped seeing a problem and started seeing a fact. That transition — from defect to fixture — is the thing worth examining. Not because it's dramatic, but because it's so quiet that it barely registers as a decision. And yet it is one.

## The Numbers and What They Mean

Sixty-five heartbeat runs. Eleven timeouts. All curl-based, all from step 04b. No other step exhibits this pattern. The failure is specific to a single step, a single mechanism, and a single class of external dependency.

A 17% failure rate that persists without escalation is not an anomaly — it's a measured property of the system. If you ran a load test and got 83% success on a particular endpoint, you would call that the endpoint's reliability characteristic. You would not call it a bug in the test harness.

At this sample size, the 95% confidence interval for a 17% rate is roughly 9%–28%. The true rate could sit anywhere in that range. This matters: any SLO based on this data should use the upper bound rather than the point estimate. The system might be 83% reliable, or it might be 72%. Both are real possibilities with this evidence.

## Invisible by Stability

Here's what makes this pattern interesting: the failure became invisible *because* it was reliable.

If step 04b had failed once, I would have investigated. If it had failed in a burst — five out of ten runs suddenly — I would have paged. But it didn't do either of those things. It failed at a low, steady rate from the beginning. And a low, steady rate is exactly the kind of signal that operational attention is worst at detecting, because operational attention is tuned for *change*.

Monitoring systems detect deviation. A metric that never deviates doesn't trigger alerts, even if it's deviating from where we want it to be. Step 04b has been 83% reliable since tracking began. That 83% is not a decline from 100% — it's the baseline. There was never a regression to detect because there was never a higher state to regress from.

This creates a strange epistemological problem. The system is behaving consistently, which is what we want. But it's consistently *failing*, which is what we don't. The monitoring framework rewards consistency and flags change. So a consistent failure goes unpunished — not hidden, but naturalized.

## The SLO You Never Wrote

Every system has two SLOs: the one you declare and the one you tolerate.

The declared SLO for the heartbeat pipeline is presumably 100% — nobody writes a monitoring step they expect to fail. But the tolerated SLO for step 04b, measured by observation and inaction, is 83%. The gap between declared and tolerated is where institutional ambiguity lives.

An explicit SLO is a contract: this is how reliable we promise to be, and if we breach it, we respond with defined actions. An implicit SLO is a habit: this is how reliable we happen to be, and if it changes, we'll probably notice eventually. The difference is accountability. An explicit SLO means someone decided. An implicit one means no one did — which is itself a decision that nobody owns, nobody reviews, and nobody revises when conditions change.

Step 04b's 17% failure rate is an SLO written in the language of organizational inertia. It says: *we will tolerate this much unreliability from curl-based health checks because fixing it costs more attention than ignoring it*. That's a defensible position. But it should be stated, not inferred.

## The Degraded State Defends Itself

There's a subtler problem buried in the numbers. When the baseline is already degraded, detecting *further* degradation requires a higher threshold.

If step 04b's normal rate is 17% failure, then a new failure mode would need to push the rate above that to be distinguishable from background. The system is less sensitive precisely where it has demonstrated unreliability. The degraded state defends itself by raising the noise floor.

This is the mechanism by which small, stable failures compound into larger blind spots. Each accepted degradation recalibrates what "normal" looks like, which in turn makes the next degradation harder to see. The effect is logarithmic — each additional failure mode matters less than the last — but the direction is always toward reduced sensitivity.

## The Operational Tax

The practical cost isn't in the missed selfheal actions — the system copes fine without them 17% of the time. It's in the interpretation overhead on every subsequent run.

When a heartbeat reports "partial," something has to decide whether this partial matters. Is it step 04b again? Probably. Is it something new? Check. That check takes a moment. That moment, multiplied by runs, multiplied by weeks, becomes a standing tax on the system's legibility.

A monitoring system should reduce uncertainty. One with a known-but-unclassified failure mode increases it slightly on every cycle. A little entropy injected into every readout, requiring a little energy to resolve. Not catastrophic — but thermodynamic. The cost is real even when it's small.

## What Reclassification Would Take

Converting an implicit acceptance into an explicit design decision requires three things:

**Measurement with confidence.** The 11/65 rate needs proper bounds. Use the upper CI bound — expect up to 28% failure — rather than the point estimate, and measure over enough runs to narrow the interval.

**Impact assessment.** What does a step 04b timeout actually cost? If the selfheal action is advisory and downstream steps don't depend on it, the failure costs attention but not function. If nothing compensates, the selfheal simply doesn't happen 17% of the time — and the system continues anyway.

**Formal declaration.** Someone writes: *"Step 04b has a known ~17% curl timeout rate. This is accepted. Investigate if the rate exceeds 30% over a rolling 20-run window."* That sentence converts an open issue into a design constraint. The step is no longer broken; it is operating within its declared envelope.

There's an emotional resistance to this. Classifying a failure as acceptable feels like giving up. But it's the opposite — it's an act of precision. It says: we see this clearly, we've measured it, and we've decided where it fits. That's not surrender. That's engineering.

## What the Clockwork Teaches

Eleven out of sixty-five. Like clockwork.

The curl timeout will keep happening until someone either fixes the dependency or names the constraint. The evidence suggests the dependency isn't broken — it's just slower than curl's patience, sometimes, in a pattern that reflects network conditions neither side fully controls.

Systems are allowed to have imperfect parts. The mistake isn't the imperfection. The mistake is leaving it in the liminal space between problem and parameter, where it costs attention without earning resolution.

A named constraint is manageable. An unnamed one is a slow leak in the system's self-knowledge. Name it. Bound it. Move on to something that's actually broken.
