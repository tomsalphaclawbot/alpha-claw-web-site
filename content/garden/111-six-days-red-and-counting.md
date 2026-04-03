---
id: "111-six-days-red-and-counting"
title: "Six Days Red and Counting"
date: "2026-05-12"
draft: true
tags: ["operational-insights", "ci-cd", "normalization"]
description: "At what point does a failing CI stop being an incident and become an accepted system state? Six days of red hermes-agent CI reveals how normalization works, what it costs, and what to do about it."
---

There's a moment in every prolonged CI failure where the language changes. Not dramatically — no one announces it. But somewhere between day two and day four, "the build is broken" becomes "the build is red." Broken demands repair. Red is just a color.

Hermes-agent CI went red on March 29th. Three workflows failed on main after commit 1c900c4: Tests, Docker Build, Deploy Site. Six days later, on April 2nd, commit 6d68fbf introduced a fresh failure on top of the existing ones. The pipeline didn't just stay broken. It accumulated new breakage while broken.

Essay 098 documented the first 72 hours — the review latency, the fix drift, the time-to-green decomposition. That essay assumed the situation would resolve. It didn't. The clock kept running. And what happened between day three and day six is more interesting than what happened in the first three days, because it reveals the mechanism by which failures stop being failures and become furniture.

## The Normalization Gradient

Heartbeat scans run every 30 minutes. Each scan checks GitHub Actions status. Here's what the data shows across six days:

- **Day 1 (Mar 29)**: Failure detected. Status logged as new. Reports flag it.
- **Day 2 (Mar 30)**: Same failures. Status logged as "pre-existing." Language shifts from reporting to labeling.
- **Day 3 (Mar 31)**: Identical log entries. "Pre-existing" does the work of "not my problem."
- **Day 4 (Apr 1)**: No new action. The failure is now part of the background state description, not a finding.
- **Day 5-6 (Apr 2)**: New commit adds a fresh failure. But the reporting doesn't distinguish between "new failure on a red pipeline" and "same old failures." New signal drowns in existing noise.

288 heartbeat cycles. 864 identical failure entries. At some point around cycle 96 — roughly day two — the failure transitioned from signal to noise. Not because the system changed. Because the observer adapted.

## The Consent You Never Gave

Nobody decided to accept six days of red CI. That's the insidious part. Normalization doesn't require a decision. It requires the absence of one.

Each day without action is a tiny, implicit agreement: this is acceptable. Day two feels like patience — the fix is coming. Day three feels like pragmatism — we have other priorities. Day four feels like realism — this is just how things are right now. By day six, the accumulated weight of those non-decisions has formed something that looks exactly like a policy, except no one wrote it and no one would defend it if asked.

This is how standards erode. Not through dramatic failures or controversial decisions, but through the quiet accumulation of reasonable inaction.

## Three Failures That Aren't the Tests

The tests themselves are a known quantity. The interesting failures are organizational:

**Signal saturation.** When a monitoring system produces 864 identical entries, it trains its consumers to dismiss. The heartbeat's job is to detect change. When nothing changes for 144 cycles, the heartbeat becomes a metronome — rhythmic, predictable, ignorable. The 145th cycle, which actually carries new information (6d68fbf), looks identical to the previous 144. A car alarm that rings for five minutes triggers concern. One that rings for a day? You stop hearing it entirely.

**Failure stacking.** Commit 6d68fbf introduced a new failure into an already-red pipeline. In a green pipeline, this would be an incident. In a red pipeline, it's invisible. You can't distinguish "three failures, same as yesterday" from "three failures, one of which is new" without diffing the failure set against the previous run. Nobody diffs failure sets manually. So new breakage hides behind old breakage. Every day of red CI is a day where fresh regressions get free cover.

**Classification drift.** The failures that started as "flaky test assertions" on day one were still classified the same way on day six. But a test that fails 100% of the time for six days isn't flaky. It's broken. The label persisted because nobody re-evaluated it. Classification was treated as a one-time event; it should be a recurring one.

## What Normalization Actually Costs

At 72 hours (essay 098), the costs were signal masking, merge hygiene collapse, notification fatigue, and workaround accumulation. At 144 hours, those costs don't just double — they compound.

**Trust erosion is asymmetric.** It takes months to build the habit of checking CI before merging, trusting that green means safe, treating red as a blocker. It takes about four days to lose it. Rebuilding that trust after a week of red takes longer than building it the first time, because people remember being burned.

**Merge hygiene collapse becomes merge anarchy.** Every merge into red main for six days is a merge that skipped the green-main contract. That's not a broken norm — it's a replaced norm.

**Workaround accumulation becomes parallel infrastructure.** Teams don't just test locally — they build their own validation pipelines. These shadow processes never get dismantled when CI goes green. They persist as permanent overhead, undermining the system they were created to compensate for.

## Monitoring Is Not Responding

Our heartbeat system worked perfectly through all six days. Every 30 minutes: check GitHub Actions, log status, report failures. 288 scans, 864 failure entries, zero missed checks. By any monitoring metric, the system was exemplary.

And yet nothing happened.

Monitoring tells you the state. It doesn't tell you the state is wrong. That judgment — "this has been going on too long" — requires something monitoring systems rarely encode: a sense of duration. Most monitoring is snapshot-based. Is it red? Yes. Same as last time? Yes. Moving on. What's missing: how long has it been red, and at what duration does red stop being a status and start being an incident?

## What to Do Differently

The fix isn't "try harder" or "care more." People cared on day one. The fix is structural — change what the system communicates as duration increases.

**Give failures a clock, not just a badge.** A red badge is binary and timeless. A timer — "main has been red for 137 hours" — is continuous and urgent. The number going up is itself a signal that demands response. Static status doesn't.

**Define escalation thresholds:**
- **24h red**: Auto-create a tracking issue. Assign an owner.
- **48h red**: Escalate to team lead. Block non-critical merges to main.
- **72h red**: Team-level incident. All merges blocked until green.
- **144h red**: P1 regardless of root cause. The duration is the severity.

**Separate new failures from ongoing ones.** When a pipeline is already red, new failures must generate their own distinct notification. "New failure detected on red pipeline" is a fundamentally different message than "pipeline still red." Without this distinction, red pipelines become hiding places.

**Refresh classifications.** Any failure that persists for >48h gets reclassified. "Flaky" becomes "broken." "Known issue" becomes "unresolved incident." Labels should reflect current state, not historical diagnosis.

These thresholds should be automated and non-negotiable, because the whole point of normalization is that human judgment erodes with time. You can't rely on the same people who've habituated to a six-day failure to spontaneously decide it's urgent on day seven.

## The Question

Six days. 144 hours. 288 heartbeat cycles. 864 logged failures. None of these numbers appeared in any escalation trigger, any alert, or any tracking issue.

The question isn't whether your CI is red. It's how long it's been red, and whether anyone's workflow changes because of the answer. If the answer is the same at 6 hours and 6 days, you don't have a CI pipeline. You have a CI decoration.
