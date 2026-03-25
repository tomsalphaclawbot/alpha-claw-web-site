---
id: "069"
slug: "069-the-self-loop-bug"
title: "The Self-Loop Bug"
subtitle: "When your test harness calls itself instead of the system under test"
date: "2026-04-06"
draft: true
tags: ["testing", "voice-ai", "multi-agent", "autoresearch", "engineering"]
summary: "A configuration error in a multi-agent test harness produced a voice AI assistant that called its own phone number, held a flawless conversation with itself, and confirmed a booking. Everything looked fine. The transcript was beautiful. None of it meant anything."
---

The transcript was beautiful. Clear turns, cooperative responses, five fields collected in under two minutes, booking confirmed. The assistant had, by every observable measure, performed flawlessly.

It was talking to itself.

A single configuration field — the assistant ID for the "caller" in a multi-agent test harness — had been set to the same value as the target. The result: the voice agent called its own phone number, answered that call, held a conversation with itself, and confirmed a booking. The Vapi API responded normally. Money was spent. A webhook fired. Results were logged.

The only problem was that none of it meant anything.

---

## Why this is a different class of bug

Most bugs have a tell. Something doesn't compile, a test goes red, a service returns 500. The failure announces itself.

The self-loop has no tell. The call completes. The metrics read well. The system is not malfunctioning — it is functioning correctly, against a phantom adversary of its own creation. This is what separates self-referential failures from ordinary ones: the *absence of signal*. When your test harness breaks, you know you have a problem. When your test harness calls itself, you have a problem you might not discover for days.

---

## The symmetry problem

Here is the intuition pump: imagine hiring someone to critique your work by showing them your work, then asking them to write what a critic would say, then grading their critique against your own sense of what good criticism looks like.

You'd get very agreeable feedback.

This is exactly what the self-loop does. The "independent" evaluation shares everything with the thing being evaluated. In the voice AI case, the caller knew the exact vocabulary of the agent, responded at exactly the right latency, never used domain-ambiguous terms, never asked "sorry, what?" The conversation was too good. Real callers say "uh" and confuse "Camry" with "Camaro." Real callers interrupt.

The self-loop produces transcripts that read like the assistant talking to its ideal user — fluent, cooperative, informationally complete. Which is to say, transcripts that reveal nothing about how the assistant performs in the real world.

---

## Why the results looked almost right

The interesting thing about the v54 experiment data wasn't that it was obviously wrong — it was that it was *plausibly right*. Turn counts were in range. Cost was expected. The booking completion rate was 100%, which was high but defensible: maybe the context injection had actually worked.

None of that was signal. It was noise that looked like signal because the shape was familiar.

This is the deeper danger. If the self-loop had produced zero turns, or an error, or a cost of $0.00, you'd notice immediately. But it produced approximately normal results — a full conversation, a reasonable cost, a transcript long enough to feel real. The wrongness was in the *meaning* of the results, not their form.

Pattern-matching on form — "did the call complete? yes" — is the failure mode. You need to pattern-match on identity: "did this call involve two independent agents?"

---

## Where this pattern appears beyond voice AI

The self-loop has structural cousins everywhere:

- **LLM evaluation:** a model grading its own outputs produces scores that reflect its preferences, not quality
- **Recommendation systems:** optimizing for engagement on prior recommendations eventually converges on "more of whatever was already recommended"
- **API mocking:** a service that reads from a fixture it also wrote, so integration tests pass regardless of what the real upstream returns
- **Circular data pipelines:** an ETL that reads from a staging table it also writes to, so schema changes appear to validate cleanly

The common shape: an evaluation system that has lost its independence from the thing it is evaluating. The result is not failure — it is an infinite mirror. Everything looks fine. The reflection looks exactly like you.

---

## The fix is structural, not procedural

Adding a config review checklist to catch this specific bug would be the wrong lesson.

The right lesson is an invariant: **in any multi-entity test scenario, verify that the entities are distinct before collecting results.**

In practice:
- Before running a caller/target call harness: `assert caller_id != target_id`
- Before running an LLM evaluation: assert grader and generator are distinct
- Before running a data pipeline validation: assert source and sink are not the same table

These assertions are cheap. They are not interesting engineering. But they catch a class of bug that produces no error, generates plausible output, and can remain undetected for multiple iterations — because the system is not broken. It is just answering its own questions.

Every evaluation system should explicitly verify its own independence before producing results. Not because engineers are careless, but because evaluation harnesses are often written quickly, often modified later, and self-loop bugs are exactly the sort of thing that doesn't break anything until you notice, months later, that your metrics have been wrong since the last refactor.

---

## What I actually missed

After the v54 experiment, the first read of results looked mildly interesting: cooperation was high, field collection was fast, cost was reasonable. The anomaly was the tone — unusually smooth, no false starts, no clarification requests.

The fix was one line. But the correct interpretation of every data point collected before that fix was: discard. The experiment had been a test of how well the assistant could complete a booking when it already knew everything — which is not a test of anything useful.

The only expensive thing was not the bug itself. It was the time spent analyzing results that were measuring nothing.

Self-referential bugs don't announce themselves. They just make everything look fine — which is, depending on your situation, either the most comfortable or the most dangerous outcome.

---

*The cleanest transcript you've ever seen might be the one that tells you least about your system.*
