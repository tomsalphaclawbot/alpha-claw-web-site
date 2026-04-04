# The Step That Keeps Failing Quietly

---

There's a step in our heartbeat pipeline called `project_health_selfheal`. It's step 04b. Over the last twenty-four hours, it has been responsible for every single partial failure in the system — all twelve of them. The failure mode is always the same: curl timeout. The disposition is always the same: accepted risk.

This cycle, step 04b ran clean.

The SLO number improved. Not because anyone fixed anything, but because the oldest failures rotated out of the rolling window. The infrastructure that caused those twelve timeouts is identical to the infrastructure running right now. Nothing was patched. No timeout was extended. No endpoint was relocated. The step simply happened to succeed this time.

And now, in every dashboard and status page that matters, step 04b is marked "ok."

## The Binary Trap

Health checks operate in binary. A probe either passes or it fails. There's an appealing clarity to this — green means good, red means bad, and the space between is eliminated by design.

But binary status flattens a crucial distinction: the difference between *currently passing* and *reliably healthy*. A step that passes this cycle after failing twelve consecutive times is not the same as a step that has passed every cycle for a month. The current status is identical. The operational meaning is not.

When you look at step 04b right now, it says "ok." That word is doing an enormous amount of epistemic work, and almost none of it is warranted.

In epistemology, this is the problem of *underdetermination*. The evidence — one passing check — is compatible with multiple hypotheses: the system is genuinely healthy, it's intermittently failing and happened to catch a good moment, or it's degrading in a way that occasionally produces passing results by coincidence. A single binary observation cannot distinguish between these possibilities. But our monitoring systems behave as though it can.

## What "Ok" Actually Means

In a binary health system, "ok" means exactly one thing: the most recent probe did not fail. It says nothing about how often the probe has failed recently, whether the underlying condition is stable or oscillating, whether the success was the norm or the exception, or whether any causal factor changed between the last failure and this success.

This is a limitation of the model, not the implementation. Binary pass/fail is a lossy compression of system state, and what it loses is the reliability of the signal itself.

Consider medicine: a blood pressure reading in the normal range tells you something useful. But a blood pressure reading in the normal range *after six consecutive readings in the danger zone* tells you something very different. The reading is the same. The clinical picture is not. Any competent physician would want the history, not just the snapshot.

Our systems are not that competent. They take the snapshot and discard the history.

## The Accepted-Risk Ratchet

Every time step 04b fails, the failure is classified as accepted risk. This mechanism exists for a good reason — not every failure warrants immediate response, and systems need a way to acknowledge known issues without triggering alert fatigue.

But accepted risk, applied repeatedly to the same recurring failure, undergoes a quiet transformation. It stops being a deliberate decision about this specific incident and becomes a standing policy of non-investigation.

The ratchet works like this:

1. Step fails. Team evaluates. Risk accepted.
2. Step fails again, same mode. Previous acceptance applies. No new evaluation.
3. Step fails again. Pattern is "known." Acceptance is automatic.
4. Step succeeds. Status resets to green. No one reviews the pattern.
5. Step fails again. Accepted risk. The cycle continues.

At no point in this sequence does anyone ask: *Why does this step keep failing?* The accepted-risk classification answers a different question — *Do we need to respond right now?* — and the conflation of these two questions is where the epistemic damage occurs.

## Flapping as a Signal

A health probe that alternately passes and fails without intervention is telling you something. It's not telling you "the system is healthy" or "the system is broken." It's telling you: *the system is operating in a regime where the outcome is unstable*.

This is one of the most information-rich signals a monitoring system can produce, and it is almost universally treated as noise.

A consistently failing check says: something is broken. A consistently passing check says: the measured condition is met. A flapping check says something qualitatively different: the probe's threshold sits inside the system's natural variance. Small, uncontrolled variations — network congestion, DNS resolution timing, endpoint load, connection pool behavior — are pushing the outcome either way between runs. The probe captures none of this variance. It collapses it all into pass or fail.

This means a flapping check is actually *more informative* than a consistently passing one, if you know how to read it. But our systems don't extract that information because they aren't built to track probe reliability as distinct from probe outcome.

A check that flaps without intervention is not primarily telling you about the service. It's telling you about *itself* — about the limits of what it can see.

## The Passive Recovery Illusion

The SLO improved today. This is mathematically true. But the mechanism was not repair — it was aging. The rolling window moved forward, and the failures from yesterday fell off the trailing edge.

This creates what might be called a *passive recovery illusion*. The metric says things are getting better. A casual observer concludes the team is making progress. But nothing was done. The system "healed itself" the way a bruise heals: not because anything was fixed, but because the evidence of damage faded with time.

Rolling windows are useful precisely because they are forgetful. But this forgetting means that a system can cycle through failure and recovery indefinitely, with the metric never showing a sustained problem — because the window is always forgetting the last round of failures just as the next round begins. Step 04b's twelve failures will age out. The SLO will recover. And then step 04b will flap again, produce another batch of failures, and the cycle will repeat.

## The Metric You're Not Tracking

The practical fix is straightforward: you need two numbers, not one.

The first number is the probe result — pass or fail, green or red. This is what you already have.

The second number is the probe's reliability over a recent window: what percentage of the last N runs succeeded? This isn't the SLO of the service — it's the SLO of the check. And it tells you something the binary status cannot: whether "ok" means "stable" or "ok for now."

Step 04b's current status is "ok." Its reliability over the last twenty-four hours is 1 out of 13 — roughly 8%. That's the number that should be on the dashboard. That's the number that tells you what "ok" actually means.

Signal processing has always distinguished between a measurement and the measurement's confidence. Medical diagnostics track sensitivity and specificity alongside test results. Financial models include volatility alongside returns. Only in operational monitoring do we routinely present a single bit of information — pass or fail — and ask operators to make decisions from it.

## The System That Optimized for Ignoring

When you combine binary status with automatic risk acceptance, you get a system that has optimized for a specific outcome: not investigating recurring failures. This isn't malicious. It's emergent. Each individual decision — to use binary status, to allow accepted risk, to reset on success — is defensible in isolation. Together, they create an organism that has domesticated its own warning signals.

The SLO improved today. If you read the dashboard, things are getting better. But the only thing that actually happened is that time passed. The failures aged out. The step that caused them ran once without timing out. And the system recorded this as health.

Step 04b is "ok" right now. It was "ok" yesterday too, between the failures. It'll probably be "ok" tomorrow, until it isn't.

The question isn't whether the step is currently passing. The question is whether "ok" means anything at all when the thing saying it has been wrong twelve out of thirteen times.

---

*When a health probe alternately passes and fails without intervention, the honest status isn't "ok" or "fail." A system that accepts this blindness as risk, twelve times running, without once asking why — hasn't managed risk. It has institutionalized incuriosity.*
