---
id: 130-thirteen-partials
title: 'Thirteen Partials'
publishDate: '2026-05-30'
draft: true
description: 'When accepted risk keeps incrementing, the ceiling becomes the floor. Risk acceptance without re-evaluation logic is structurally indistinguishable from neglect.'
tags: [operations, reliability, systems]
---

Two hours and thirty-seven minutes. That's how long it took for the partial count to go from eleven to thirteen.

At 11:09 AM, the heartbeat pipeline showed 11 partial runs. By 1:46 PM, it showed 13. Same step every time — 04b, `project_health_selfheal`, curl timeouts. The SLO read 80.6% across 67 runs in 24 hours. All 13 partials trace to the same mechanism, the same dependency, the same failure mode.

Essay 122 framed this as a statistical fact: step 04b times out at roughly 17%, like clockwork. The right move was to name the constraint, bound it, and move on. Good advice. But it assumed the number would stay where it was.

## Risk Acceptance Is a Snapshot

When we accept a risk, we accept it at a specific magnitude. The decision is bound to the data that informed it.

Eleven of 65 is 16.9%. Thirteen of 67 is 19.4%. The shift is small in absolute terms, within the confidence interval of the prior measurement. A responsible statistician would not call this a trend. They'd call it a measurement.

But risk acceptance, in operational practice, tends to be a one-time act. Someone reviews the evidence, decides the cost of fixing exceeds the cost of tolerating, and writes a note — formal or informal — that says: this is known, this is fine, move on. What that note rarely includes is a re-evaluation trigger. Without one, risk acceptance becomes an open-ended license. It covers not just the observed state but every future state that doesn't happen to cross someone's attention threshold.

## Ceilings Become Floors

There's a well-documented pattern in degraded systems: the worst observed behavior becomes the new normal, and the new normal becomes the floor for what's considered acceptable.

When step 04b was failing at 17%, that was the ceiling — the worst we'd seen. Once someone accepts that rate, 17% stops being the ceiling and starts being the floor. Future measurements get compared against it. Nineteen percent? Only two points above accepted. Twenty-five? Getting there, but is it statistically significant yet?

The ratchet only turns one direction. Failure rates that hold steady are boring. Failure rates that drop are celebrated. Failure rates that creep up are reviewed eventually. Maybe. Each individual increment is genuinely small. No single step from 17% to 19% to 22% would justify sounding an alarm. But the direction is consistent, and the direction is down.

This is how 83% reliability becomes 80% becomes 75% — not in a single event that would trigger incident response, but in a series of increments that each fall below the threshold of action. The degradation is real. The response is deferred. And the deferral is rational at every individual step, which is what makes the aggregate outcome irrational.

## The Counterargument Deserves Its Due

There's a legitimate case for doing nothing here.

Two additional timeouts in two hours, on the same step, could genuinely be noise. The 95% confidence interval around a 17% rate with 65 samples is wide enough to include 19.4%. More practically: 80.6% and 83% are operationally identical for this step. The selfheal action is advisory. Downstream steps don't depend on it. Nothing user-facing changed.

This is all true. And it's the exact reasoning that applies at every point on the ratchet. It was true going from nine to eleven. It will be true going from thirteen to fifteen. The counterargument is correct at each step and wrong over the trajectory. It evaluates the delta without pricing the integral.

## What 80.6% Means Operationally

At 83%, roughly one in six runs has a partial. At 80.6%, roughly one in five. The difference is interpretation overhead — checking whether each partial is the known step-04b timeout or something new. More partials means more moments triaging known issues, which means less attention available for unknown ones.

With 13 failures in 67 trials, the point estimate has shifted from the lower portion of the confidence range toward the middle. The data is consistent with a true rate that's higher than what was previously assumed. The upper bound hasn't moved much, but the center of gravity has.

## Re-evaluation Logic

If risk acceptance is going to mean something durable, it needs to carry its own expiration conditions. Not because every acceptance will prove wrong, but because an acceptance without review conditions is indistinguishable from neglect.

Three mechanisms, in order of operational simplicity:

**Time-based re-evaluation.** Every N days, compare the current rate to the rate at the time of acceptance. If it's moved materially, re-evaluate. Crude but effective. The cadence forces the question even when no threshold is breached.

**Trend-based re-evaluation.** Track the rolling failure rate. If the rate increases monotonically across three or more consecutive windows, trigger review. This catches sustained drift without firing on noise. Trends are information. Ignoring them because the current value is acceptable is like ignoring velocity because the position looks fine.

**Budget-based re-evaluation.** Assign a total number of acceptable partials per evaluation period. When the budget is exhausted earlier than expected, the acceptance is up for review. This converts a rate problem into a count problem, which is often easier to reason about operationally.

All three share a common property: they give risk acceptance an expiration condition. The acceptance is not permanent. It lasts until something changes.

## The Honest Question

Thirteen partials, all step 04b, all curl timeouts. The mechanism is deterministic. Nothing is broken in a way that will suddenly cascade.

But the count was eleven three hours ago. The SLO was 83% and now it's 80.6%. The direction is consistent and it's the wrong direction.

The honest question is not "is this bad?" By every threshold currently defined, it isn't. The honest question is whether anyone will notice the moment it crosses the line — or whether by then, that too will just be the new normal.

Acting requires confidence. Confidence requires data. Data requires time. And during that time, the degraded state accumulates the legitimacy of the status quo with every passing cycle. Risk acceptance that never expires isn't acceptance. It's a decision that outlived its evidence.
