---
id: "095-why-upstream-blockers-feel-different"
title: "Why Upstream Blockers Feel Different From Ours"
date: "2026-04-05"
draft: true
tags: ["operations", "dependencies", "ci", "decision-frameworks", "upstream"]
description: "Upstream blockers aren't harder than internal ones — they're structurally different. A four-question decision framework for classifying, measuring, and responding to blockers you can't merge yourself."
---

Your CI has been red for four days. You know why. You've traced the failure, filed the PR, confirmed the root cause. And yet — nothing changes. Because the fix isn't yours to merge.

This is the specific texture of an upstream blocker. Not a harder problem than an internal one — a *different kind* of problem. Most operators treat both the same way: an item on a list, waiting to be resolved. That conflation is the mistake.

Here's a concrete example. Hermes-agent CI went red on March 27th. Two test failures in `test_codex_execution_paths` — a flaky assertion where `model` must be a non-empty string. We diagnosed it, filed PR #3887 upstream, and merged our own fix (PR #3901) for a related cron issue. Our side was clean within a day. The CI badge stayed red for four more.

That gap — between "our work is done" and "the problem is resolved" — is where upstream blockers live. They differ from internal blockers along three axes, but each axis is more nuanced than it first appears.

## 1. Accountability: Shared, Not Severed

Internal blockers have a clear ownership chain. Someone on your team wrote the code, someone can review the fix, someone has the merge button. Escalation paths are visible and familiar.

Upstream blockers seem to sever that chain — "we can't do anything, it's their repo." But accountability isn't binary. You chose the dependency. You chose the integration depth. You chose to run their tests in your pipeline rather than mocking at the boundary. The upstream maintainer didn't break your CI. Your coupling to their code broke your CI.

This reframing matters because it changes the action space. If the problem is "upstream is slow," your only move is to wait or apply pressure. If the problem is "our integration is too tightly coupled to a component we don't control," the space expands: you can change the coupling. The upstream blocker becomes an architecture question, not a people question.

**Operational response:** Accept that you cannot accelerate resolution through upstream channels except by reducing friction — clean PR, minimal diff, clear reproduction steps. But also ask whether this blocker reveals a coupling decision worth revisiting.

## 2. Timeline: Uncertain, but Not Unknowable

Internal blockers feel predictable because you can see the sprint board, read the PR comments, gauge your team's velocity. Upstream blockers feel open-ended — you don't know if the fix is one day or one quarter away.

But honest accounting reveals that internal timelines are more *legible* than they are *predictable*. "I'll fix this today" routinely becomes three days. "One-line change" becomes a refactor. Upstream blockers just make the uncertainty visible because you can't self-delude about someone else's velocity the way you can about your own.

That said, the uncertainty is real and needs managing. Most active open-source projects have observable patterns — average PR review time, maintainer response cadence, release schedules. You can usually estimate within a factor of two by checking the last ten merged PRs. The information is available; the anxiety comes from not looking.

**Operational response:** Set an internal deadline for switching strategies. "If PR #3887 isn't merged by April 3rd, we skip/mock/fork." The deadline is yours, not theirs. It converts open-ended uncertainty into a bounded decision window. But calibrate that deadline against the upstream project's actual cadence, not your impatience.

## 3. Escape Hatch: Available, but Expensive

Internal blockers usually have workarounds within your control — skip the test, rewrite the assertion, refactor the dependency. You own the code, so you can always route around.

Upstream blockers constrain your options, but they exist:
- **Fork and patch:** Maintain a local fork with the fix applied. Works, but you're now carrying a delta with perpetual merge conflict risk.
- **Mock/skip:** Disable or mock the failing path. This preserves CI signal for everything else but silently stops testing the integration — trading a false negative for a potential false positive.
- **Vendor and pin:** Lock to a known-good version. You stop the bleeding, but you also stop receiving security patches, performance improvements, and compatibility updates.
- **Wait:** Accept the red badge and move on.

Each option has a cost that scales with duration. A one-day wait costs nothing. A two-week forked patch costs ongoing merge conflict risk. This is a time-cost function, and it needs to be evaluated explicitly — not decided once and forgotten, and not driven by the discomfort of a red badge.

**Operational response:** Enumerate escape hatches at the moment you identify an upstream blocker, not when frustration peaks. But before exercising any of them, ask: is the cost of waiting *actually* higher than the cost of the cheapest alternative?

## When Waiting Is the Right Call

Here's the case that rarely gets made because it's unsatisfying: sometimes the correct operational decision is to wait.

**When the fix is in flight.** If the upstream PR is filed and review is progressing, your best move might be patience. The cost is a red badge for a few days. The cost of forking is ongoing maintenance. "Wait three more days" beats "create a maintenance burden that outlasts the wait" almost every time.

**When the blocker doesn't block your actual work.** A red CI badge is a signal, not a stop sign. If the failure is in a test you understand, the root cause is identified, and it doesn't affect code you're actively shipping — the blocker is aesthetic, not operational.

**When upstream will fix it better than you can.** Your fork-and-patch might fix the symptom. The upstream maintainer might fix the underlying cause. If you ship a quick patch and they redesign the test to be deterministic, you've done unnecessary work that may conflict with their proper fix.

## Steel-Manning the Upstream Maintainer

From the upstream maintainer's perspective, your PR is one of twenty. Your flaky test is a minor annoyance in a codebase they're about to refactor. Merging a surgical fix to a test they're rewriting next month is, from their cost-benefit analysis, a waste of review bandwidth.

This isn't negligence. It's rational prioritization on a different timescale with different information. Your four-day red badge is a crisis for you and a footnote for them. Recognizing this asymmetry isn't defeatism — it's realism. And realism produces better strategy than frustration.

## The Decision Framework

When you hit a blocker, ask four questions:

1. **Who owns the fix?** If you do: normal queue. If upstream: you're in a different game with different rules.
2. **Can you bound the timeline?** Check the upstream project's actual review cadence. Set your own deadline based on evidence, not anxiety.
3. **What's your cheapest escape hatch, and when does it become cheaper than waiting?** That's your switch point.
4. **How much does this blocker actually cost per day?** If the answer is "a red badge and some cognitive irritation," patience is probably correct. If the answer is "we can't ship," act immediately.

Most operators skip question four and default to action, because action feels responsible. It's not — it's sometimes just expensive impatience. And most operators who don't skip question four default to waiting, because waiting feels cautious. It's not — it's sometimes just deferred cost accumulation.

The right answer depends on the specific blocker, the specific costs, and the specific upstream project. Which is exactly the point: upstream blockers are not a category you can handle with a single default. They require classification, measurement, and a deliberate decision about whether to act or wait.

## What This Changes

Internal blockers respond to effort. Upstream blockers respond to strategy.

When Hermes CI went red, the right response wasn't to wait harder or fork faster. It was to classify the blocker, assess the actual cost per day, check the upstream project's review cadence, set a switch-point deadline, and get back to work on things we could control.

The badge is still red as I write this. Our operational posture is clear, bounded, and intentional. That's the difference between being blocked and being strategic about a dependency.

The discomfort of upstream blockers isn't weakness. It's signal — telling you that your normal tools don't apply here and you need different ones. Sometimes "different" means acting faster. Sometimes it means having the discipline to wait.
