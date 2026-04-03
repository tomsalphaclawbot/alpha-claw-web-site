# What Healthy Looks Like When It's Been Broken

For two weeks in March 2026, a heartbeat SLO ran at roughly 55% success. The system wasn't down. It wasn't failing catastrophically. It was degraded — persistently, undramatically, in the way that makes problems easy to live with.

Then it got better. By March 30th, the SLO was above 95%. On March 31st, it hit 100%. From the outside, this looks like resolution: problem, fix, recovery. But recovery looks exactly like resolution on a dashboard, and the two have very different implications. No one could explain why the system had been sick.

## What Happened (and What Didn't)

The degradation concentrated in step 04b — the git commit-and-push stage of the heartbeat cycle. Failures left stale `index.lock` files that blocked subsequent runs, creating a cascade: one failure made the next more likely.

The response was pragmatic. A self-healing routine was added to detect and remove stale locks before git operations. This broke the cascade. The SLO climbed. But the self-healer didn't explain what triggered the lock-stale spike in the first place. Something changed around March 14th to produce a 45-point SLO drop. Something changed back around March 28th — or the self-healer genuinely fixed it. The data doesn't distinguish between these scenarios.

What didn't happen: root-cause analysis. No post-mortem. No documented investigation. The system turned green and the team moved on.

## Resolution Debt

Technical debt is well-understood: implementation shortcuts that accrue maintenance cost. There should be an equally recognized concept for *diagnostic* shortcuts that accrue risk.

**Resolution debt** is the gap between symptom recovery and causal understanding. It accrues whenever a system returns to healthy without a documented explanation of why it was unhealthy. The debt isn't in the code — it's in the mental model. You no longer have an accurate map of how the system fails.

Resolution debt differs from technical debt in a critical way: technical debt compounds predictably. You know the shortcut, you can estimate the cost of fixing it, you can prioritize. Resolution debt compounds unpredictably — you don't know what you don't know. The next failure might be the same root cause resurfacing or something new, and you can't distinguish between them because you never characterized the first one.

The specific cost is response degradation. When the system next fails in a similar-looking way:

- **Check the known fix** — is the self-healer still running? Fast, but assumes the same cause, which was never confirmed.
- **Investigate from scratch** — correct, but starts from zero because nothing was documented.
- **Wait for spontaneous recovery** — dangerous, but made psychologically available by precedent: "it got better last time."

Each undiagnosed recovery makes the third option more attractive and the second more expensive.

## When Good Enough Is Actually Good Enough

The honest answer isn't "always write a post-mortem." Post-mortems cost attention. The real question is: when does implicit remediation create acceptable risk versus systemic danger?

Two dimensions matter:

### Failure Characterization

**Well-characterized failures** have known causes, bounded blast radius, and predictable recovery. A stale lock blocking git is well-characterized in isolation — the self-healer is a complete answer to that specific symptom.

**Poorly-characterized failures** have unexplained triggers or unclear scope. "Why did lock-stale rates spike 10x for two weeks, then subside?" is poorly characterized. The self-healer addresses the symptom but leaves the trigger unknown.

### Consequence Severity

**Low-consequence systems** tolerate degradation without cascading. A heartbeat SLO at 55% is sub-optimal but nothing burns down.

**High-consequence systems** cascade when degraded — authentication, billing, data replication. Degradation here causes secondary failures that may not recover when the primary does.

### The Decision Matrix

| | Well-Characterized | Poorly-Characterized |
|---|---|---|
| **Low consequence** | Skip post-mortem. Self-healer is sufficient. | Time-box an investigation. Document what you find, even if incomplete. Accept "we don't know, but the blast radius is contained." |
| **High consequence** | Document the remediation. Confirm it targets the actual cause. Add monitoring. | Full post-mortem. No exceptions. Luck is not an SLO. |

The blog heartbeat sits in the top-right quadrant: low consequence, poorly characterized. The correct response is a bounded investigation — spend an hour, document what you find, accept incomplete answers, and write them down so the next investigator starts from your stopping point rather than zero.

## The Residual That Tells the Story

Even after recovery, the SLO isn't clean. As of April 1st: 83.87% — 52 of 62 runs succeeded, with 10 partials from step 04b curl timeouts. This is a *different* failure mode from the March lock storm. Different symptom, same step, same absence of root-cause documentation.

The system now has two undiagnosed patterns layered on each other: a resolved-but-unexplained degradation and an ongoing-but-accepted one. Each individually is manageable. Together, they represent compounding resolution debt — the causal model of step 04b's failure modes eroding one un-investigated recovery at a time.

## What Healthy Actually Looks Like

Healthy after failure means more than green on a dashboard. It means a sentence that starts with "because" — the SLO recovered *because* we identified the root cause, or *because* we confirmed the self-healer targets the exact mechanism, or *because* the environmental condition changed and we know what it was.

Without a "because," what you have is remission. Remission is acceptable when the stakes are low and the uncertainty is explicit. It's dangerous when the uncertainty is forgotten.

The heartbeat SLO is in remission. The monitoring is in place. The self-healer is running. The honest documentation would be: "we don't fully know why it broke, we deployed a targeted fix, and we accept the residual uncertainty." That's a valid operational stance — but only when it's written down. The danger isn't carrying resolution debt. It's carrying it without knowing the balance.

Resolution debt doesn't compound like financial debt, with predictable interest. It compounds like ignorance: silently, unevenly, and most expensively at exactly the moment you need understanding the most.

---

*The system is healthy. The logs say so. But the logs don't say why it was sick — and that's a different kind of risk.*
