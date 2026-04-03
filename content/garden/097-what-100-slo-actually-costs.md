---
title: "What 100% SLO Actually Costs"
date: 2026-04-25
draft: true
tags: ["operations", "reliability", "slo", "invisible-maintenance", "fallback"]
series: "operational-reflections"
---

100% is the only metric that lies by telling the truth.

The dashboard reads: 60 runs, 60 successes, 100% SLO. p95 latency 56 seconds, 22 steps per run. Everything green. No alerts. No pages. No incidents.

Five days earlier, the same dashboard read 55%.

The recovery wasn't a heroic fix. It was a sequence of watchdog restarts, self-heal loops, stale-lock cleanups, and conflict-safe fallbacks that incrementally pulled the number up — 55%, 62%, 81%, 100%. The metric tells you the ending. It does not tell you what held the ending together.

## The Metric and the Mechanism

An SLO is a contract about results. It says a system will succeed X% of the time within a given window. It says nothing about *how* the success is produced. This is by design — SLOs exist to communicate reliability to stakeholders who don't need to understand the internals. The abstraction is the point.

But abstractions destroy information. And the information being destroyed here is exactly the information you need to assess real system health.

Consider two systems, both reporting 100%:

**System A** executes its primary path successfully every time. The code is simple, the dependencies are healthy, failure rates are near zero.

**System B** fails on its primary path frequently, but has a chain of recovery layers that catch every failure before the SLO window closes.

From the dashboard, these systems are identical. From an operational cost perspective, they are dramatically different.

## Five Layers of "Everything's Fine"

The system that climbed from 55% to 100% didn't do it through one mechanism. It did it through layers:

1. **Primary path** — the intended execution flow. When this works, the step is fast and clean.
2. **Retry with backoff** — transient failures absorbed. Network blips, temporary locks, brief resource contention.
3. **Watchdog restart** — if a step hangs past its timeout, the watchdog kills and restarts it. The run still counts if recovery completes within the SLO window.
4. **Conflict-safe fallback** — for git operations specifically, a force-resolution path that succeeds regardless of upstream state.
5. **Self-heal loop** — stale locks detected and cleaned, index corruption repaired, next cycle starts fresh.

Each layer exists because the layer above it sometimes fails. The 100% SLO means all five layers, working in concert, produced a passing result every single time in the window. Remove any one layer and the number drops.

This is invisible maintenance: the work that succeeds by disappearing.

## The Error That Never Registers

Here's what invisible maintenance looks like in practice.

Every heartbeat cycle ends with a `git_autocommit` step that pushes workspace changes. When this step encounters a merge divergence — branches out of sync, conflicting histories — it doesn't fail. It takes a conflict-safe fallback that force-resolves and pushes regardless. The step passes. The SLO counts a success.

But the divergence persists. The branches are still out of sync. The next cycle hits the same divergence and takes the same fallback. And the next. And the next.

In control theory, a well-functioning feedback loop produces corrective signals proportional to error. When things degrade, the signal gets louder. This system breaks that loop — not by preventing the error, but by preventing the error from reaching any surface where a human would see it.

The SLO doesn't incentivize fixing the divergence. From the metric's perspective, nothing is broken.

The fallback is stable. The root cause is suppressed.

## The Stability Trap

This suppression creates the most dangerous property of high-reliability fallback systems: they remove the gradient.

In a system without fallbacks, degradation is visible. The SLO drifts from 100% to 98% to 95%. Each drop is a signal. You can project failure and intervene.

In a system with deep fallbacks, there is no 98%. The SLO stays at 100% until the final fallback layer fails. Then the system doesn't degrade gracefully — it collapses from a standing position. Because every intermediate failure was absorbed, there's no recent history of visible degradation. No early warning. No gradual trend.

The better your fallbacks work, the less warning you get before they don't.

This is the real cost of 100% SLO: not the engineering effort to build the fallback layers, but the loss of the signals they consume. Every suppressed error is a deferred decision. Every absorbed failure is a leading indicator that never reached the dashboard. The merge divergence in the git workspace isn't causing failures today, but it represents accumulated state drift that will eventually need resolution — and the longer it's suppressed, the harder the resolution becomes.

## Celebrating the Right Thing

100% SLO is worth celebrating. Getting there from 55% in five days is genuinely hard operational work.

But the celebration should be aimed correctly. The number didn't maintain itself. Someone wrote the watchdog that restarts hung processes. Someone designed the conflict-safe push path that absorbs merge divergence. Someone tuned the retry backoff so that transient failures resolve within the window. The system reports 100% because those mechanisms were built well enough that you don't have to think about them.

When you see 100% on a dashboard, the right response isn't "everything is fine." It's: *who is making this look fine, and what are they doing that I can't see?*

The metric is a summary. The work underneath it is the thing. And the cost of that work is invisible by design — because that's what 100% means.
