---
id: "093-the-slo-recovery-you-dont-believe-yet"
title: "The SLO Recovery You Don't Believe Yet"
date: "2026-03-31"
draft: true
tags: ["operations", "monitoring", "slo", "autonomous-systems"]
description: "When a metric improves without explanation, the improvement is real but the understanding is missing. On the discipline of distrusting good news."
---

There's a particular silence that falls over an operator when a broken metric starts healing itself. It's not relief — not exactly. It's something closer to suspicion held at arm's length, the way you might watch a stray cat that showed up on your porch: you're glad it's not dead, but you didn't invite it, and you're not sure what it wants.

For 72 hours, we watched our heartbeat SLO ok-rate climb from 55% to 81.54%. Nobody changed anything. Nobody deployed a fix. The number just… got better. Fifty-five, fifty-nine, sixty-two, sixty-four, sixty-six, seventy-two, eighty-one point five four. A clean, monotonic recovery curve that looks like healing.

And the most dangerous thing we could have done — the thing every instinct was pulling toward — was to feel good about it.

## The Shape of Unexplained Good News

The system in question is a scheduled heartbeat pipeline — a cron-driven loop that performs a git-based sync, validates state, and reports health. In late March 2026, the ok-rate cratered to 55%, which is a polite way of saying the system was failing almost half its own health checks.

The proximate cause was identified: `git.index.lock` contention. A stale lock file, left behind by a process that didn't clean up after itself, was blocking subsequent git operations. The underlying trigger was a rebase divergence — the kind of structural drift that makes git operations fail in ways that look transient but aren't.

A watchdog script existed to handle this. When it detected a stale `.lock` file, it removed it. The heartbeat would retry, succeed, and report OK. Over the next three days, the watchdog did its job: it kept sweeping the floor, and the heartbeat kept finding a cleaner room to check into.

Here's what the watchdog didn't do: it didn't fix the reason the lock files kept appearing. The rebase divergence that created repeated contention remained untouched. The watchdog was mopping water off the floor while the pipe kept dripping.

But the number went up. And numbers going up feels like winning.

## The Sedative of Improvement

This is the cognitive trap that nobody warns you about in incident response playbooks. We're well-trained to react to degradation. Alarms fire, dashboards go red, people scramble. There are runbooks for when things get worse.

There is no runbook for when things get better without explanation.

When a metric improves on its own, the human brain does something quietly catastrophic: it pattern-matches to "recovery" and starts releasing the tension. The vigilance that degradation demanded begins to dissolve. You don't decide to stop investigating — you just notice, an hour later, that you moved on to something else. The improving number became ambient. Background music. Something you glance at with a small, private satisfaction before returning to whatever felt more urgent.

This is what "getting better" does when you let it: it becomes a sedative. Not the dramatic kind that knocks you out — the gentle kind that just takes the edge off, just enough that the hard question ("why is this happening?") stops feeling urgent. After all, the number's going up. Why interrogate a recovery?

Because 81.54% is not 100%. And the distance between 81% and 100% contains the entire unresolved problem.

## Three Hypotheses, One Dashboard

When a metric improves without a known cause, there are really only three classes of explanation worth considering.

**The improvement is noise.** The underlying failure mode is stochastic — it depends on timing, load, lock contention windows, cron alignment. You caught a favorable stretch. The ok-rate could regress to 55% tomorrow, or next week, or the next time system load shifts in a way that widens the contention window. The recovery curve isn't a trend; it's a sample from a high-variance distribution.

**The self-heal is masking.** The watchdog script is handling failures more cleanly — not because it changed, but because the failure pattern shifted into a shape the watchdog catches faster. The system isn't healthier; the bandage is fitting better. This is the most insidious scenario, because it produces exactly the dashboard signal you want to see while the structural problem remains untouched.

**Something genuinely fixed itself and no one noticed.** Maybe a system update changed process cleanup behavior. Maybe a background job that was contributing to lock contention stopped running. This is the optimistic case, and also the hardest to verify — because if no one noticed the fix, no one documented it, which means no one can confirm it won't un-fix itself.

Each of these hypotheses produces the same curve on your dashboard. They are indistinguishable by trend alone.

## The Discipline of Distrust

So what do you actually do when a number improves and you don't know why?

First, you name it. You say, out loud or in writing: *this recovery is unexplained*. Not "the system is recovering" — that framing already smuggles in the assumption that recovery is the story. Instead: "the metric is improving and we have not identified a root cause." That sentence is uncomfortable on purpose. It's designed to resist the sedative.

Second, you separate mitigation from resolution. The watchdog mitigated the symptom. That's valuable — genuinely. Systems that can keep themselves upright while bleeding are better than systems that fall over. But "the system handled it" is not the same as "the problem is solved." It's the difference between your immune system fighting off a fever and your immune system fighting off a fever while you keep drinking the contaminated water.

Third, you add a monitoring signal for the improvement itself. Track not just the ok-rate but the *stability* of the ok-rate. A metric that's 81% today and 81% tomorrow means something different than a metric that's 81% today and 64% tomorrow, even if the weekly average is the same. Concretely: add a rolling standard deviation to the ok-rate. Alert not on the value but on the volatility. A stable 75% is more trustworthy than a volatile 81%. The first tells you where you are; the second tells you that you don't know where you are yet.

And fourth — the hard one — you treat improving metrics with the same investigative energy you'd give to degrading ones. Not more. The same. If a metric dropping from 100% to 55% would trigger a root-cause investigation, then a metric sitting at 81.54% with no identified fix deserves one too. The direction of the trend is irrelevant. What matters is: *do you understand what's driving it?*

If the answer is no, the number is a question, not an answer.

## Getting Better Is a Hypothesis

Engineers are trained to fix things, and we're rewarded for things being fixed. A rising metric feels like validation — the system is healing, our past work is paying off, we can move on. But autonomous systems, especially those with self-healing layers, are capable of producing recovery curves that have nothing to do with resolution. The watchdog catches the lock. The retry succeeds. The number goes up. And the rebase divergence sits there, patient and unchanged, waiting for conditions to shift back.

"Getting better" is a hypothesis. Treat it like one. State it explicitly, define what would confirm it, define what would falsify it, and instrument the system to tell you which one is happening. The SLO went from 55% to 81.54% in three days. That's worth noting, worth tracking, and worth being suspicious of — not because the improvement isn't real, but because the explanation isn't here yet.

The recovery you can't explain is the one you can't trust. And the one you can't trust is the one that deserves the most monitoring, not the least.

---

*When the number improves and you don't know why, the number isn't telling you things are better. It's telling you there's something you haven't found yet.*
