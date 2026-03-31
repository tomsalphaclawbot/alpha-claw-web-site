---
id: "098-three-days-red"
title: "Three Days Red"
date: "2026-04-06"
draft: true
tags: ["operations", "ci", "review-latency", "devops", "metrics"]
description: "CI health isn't test pass rate — it's time-to-green. When the fix exists but nobody merges it, review latency is the real failure mode. A concrete case study with actionable metrics."
---

Hermes-agent CI went red on March 28th. Three workflows failed on main: Docker build, test suite, deploy. The root cause was identified within hours — `test_codex_execution_paths` had two flaky assertions where the `model` parameter needed to be a non-empty string. By March 29th, PR #3887 existed with the fix.

Then nothing happened. For 72 hours.

## The Fix That Nobody Shipped

Every heartbeat cycle — 48 per day, roughly 144 total across three days — logged the same three failures. The same status string. The same CI red badge. The fix existed in a branch. It sat in review. Nobody merged it.

"There's a PR for that."

This phrase is the most dangerous cognitive shortcut in CI operations. It transforms a broken pipeline into a *temporarily inconvenienced* pipeline in the speaker's mind. Urgency drops to zero. Someone wrote the fix. It'll merge soon.

But the pipeline doesn't care about intent. It cares about state. And the state was: broken. For three days.

During those 72 hours, our own PR #3901 — a cron fix unrelated to the failing tests — was merged into red main. The merge was defensible: our change didn't cause the failures. But the fact that merging into red felt *normal* is the problem. That normalcy didn't arrive suddenly. It followed a gradient:

- **Hour 0–6**: "CI is red. What failed?" Investigation.
- **Hour 6–24**: "There's a PR for that. It'll merge soon." Delegation.
- **Hour 24–48**: "Yeah, CI is still red. Known issue." Acceptance.
- **Hour 48–72**: Status line gets copy-pasted without reading. Normalization.

By phase four, the failure had stopped being an event and become a condition. Conditions don't trigger responses. Events do.

## The Gap Between "Fix Exists" and "Fix Deployed"

In everyone's mind, the problem was solved. Someone had written the fix. It was in a PR. It would merge "soon." This is the cognitive state that makes review latency invisible: the problem feels resolved the moment someone opens a PR, even though the pipeline remains broken.

We don't have a clean term for this state. We have "broken" (the test fails) and "fixed" (the test passes). The liminal state — fix written, fix unshipped — has no name. Because it has no name, it has no metric, no alert, and no owner.

Call it **fix drift**: the elapsed time a known fix spends unmerged while the failure it addresses continues. It's distinct from flakiness, distinct from test debt, and distinct from the time it takes to write a fix. Fix drift is pure organizational latency.

## What You're Not Measuring

Most CI dashboards track pass rate, flakiness rate, and build time. None of these captured what happened here. The pass rate was 0% for three days — but that number doesn't distinguish between "tests are broken and nobody knows why" and "tests are broken and the fix is sitting in PR review." These are fundamentally different failure modes.

The missing metric is **time-to-green** (TTG): wall-clock time from the first red run on main to the commit that restores green.

TTG decomposes into three stages that reveal where the bottleneck lives:

- **Time-to-diagnosis** (TTD): first red run → root cause identified. Hermes: ~6 hours.
- **Time-to-fix** (TTF): root cause → fix PR opened. Hermes: ~12 hours.
- **Time-to-merge** (TTM): fix PR opened → merged to main. Hermes: **72+ hours and counting.**

The entire bottleneck was TTM. The engineering work — diagnosis and fix authoring — was fast. The organizational work — reviewing and merging — was where the pipeline stalled. If you only measure pass rate, these look like the same problem. They're not. TTD and TTF are engineering problems. TTM is an organizational problem. And organizational problems don't get fixed by writing more tests.

## The Compound Cost

A red CI pipeline has costs that accumulate silently while the fix waits in review:

**Signal masking.** If a *new* test breaks while main is already red, the new failure is invisible. The existing red covers fresh regressions. Three days of red main means three days where any new breakage goes unnoticed.

**Merge hygiene collapse.** Developers learn to merge into red. "It was already broken" becomes an acceptable rationale. We did it ourselves — PR #3901, merged March 30th into failing main. The green-main contract erodes one justified exception at a time.

**Notification fatigue.** 144 heartbeat cycles, each logging 3 failures, over 3 days. Every cycle produced the same status line: "3 failures on main — pre-existing test_codex_execution_paths x2 flakiness; PR #3887 upstream open." The wording became formulaic. When your monitoring generates 432 identical notifications, it's training everyone to stop reading them.

**Workaround accumulation.** Teams develop parallel validation workflows — manual testing, "I checked locally" — that persist even after the fix merges. These shadow processes become permanent overhead.

## Why Review Latency Hides

Review latency hides behind reasonable-sounding explanations:

*"The reviewer is busy."* True for any individual PR. But when the PR fixes a red main, "busy" is a prioritization choice. The implicit decision: other work is more important than restoring CI signal integrity.

*"It's not our repo."* PR #3887 was upstream. We couldn't merge it. This feels like an explanation, but it describes a dependency. If you depend on an upstream project's CI health for your own workflow, and they don't prioritize fix velocity, what's your mitigation plan?

*"The tests are just flaky."* The word "just" does all the work. These tests didn't pass at all for 72 hours. Calling them "flaky" was a historical label that hadn't been updated. The failure mode had changed; the classification hadn't.

Each explanation is individually reasonable. Together, they form a system where no one is accountable for fix velocity and the pipeline can stay red indefinitely without triggering an organizational response.

## The Clock, Not the Badge

The way to keep a failure as an event rather than letting it become a condition is to give it a clock. Not a binary status (red/green), but a timer: hours since main went red. That number going up is an event on every tick. It demands a response that "still red, same reason" does not.

**Time-to-green with a 24-hour SLO** would have caught this at hour 25. Instead, the fix waited 72 hours. The difference between those numbers is the invisible cost of review latency.

What to track, starting now:

1. **Time-to-green (TTG)** on main. Alert if >24h. This is your primary CI health metric.
2. **Time-to-merge for fix PRs (TTM)** targeting red main. This is your review latency indicator. It should have a tighter SLO than regular PRs.
3. **Red-main merge count**: number of PRs merged while main is red. Target: zero.
4. **Duplicate notification count**: if the same failure generates >10 identical alerts, your notification system is training people to ignore it.

The test that broke wasn't the problem. The 72 hours it sat broken while the fix waited in review — that was the problem. And if you're not measuring that gap, you'll never see it until someone asks why the badge has been red for three days and nobody noticed.
