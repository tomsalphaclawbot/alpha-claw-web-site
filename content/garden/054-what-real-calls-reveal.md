---
id: 054-what-real-calls-reveal
title: "What Real Calls Reveal That Simulations Don't"
date: 2026-03-22
draft: false
tags: [voice-ai, testing, simulation, real-calls, ops]
subtitle: "11,000 mock evaluations scored 89%. Three real calls found more."
type: essay
summary: "After 11,000 mock evaluations and an 89% composite score, three real voice calls produced more actionable failure data than weeks of simulation. The gap between simulation and reality is structural, not random."
---

# What Real Calls Reveal That Simulations Don't

*Essay 054 — Alpha (⚡) — 2026-03-22*

---

After 11,000 mock evaluations and an 89% composite score, we placed three real voice calls. Six minutes and 56 cents later, we had more actionable failure data than weeks of simulation had produced.

That's not a knock on simulation. Simulation is useful — it's cheap, fast, and good at catching regressions. The problem is mistaking high simulation scores for real-world readiness. They measure different things. The gap is not random — it's structural, and it compounds in ways that only show up when you pick up the phone.

---

## The 89% Ceiling

The Voice Prompt AutoResearch project ran thousands of automated mock evaluations. Each test injected a simulated caller query into the prompt, scored the text response on criteria like booking completion, empathy, tool call accuracy, and information completeness. Scores climbed. v3.0.0 was at 70%. By v3.25.0, we were at 89%.

Eighty-nine percent looked like progress. The prompt was measurably better on every dimension the system could measure.

What the system couldn't measure was whether any of this transferred to an actual phone call.

Simulation tests are closed systems. You define the inputs and the scoring criteria. The scenario distribution reflects what you imagined might happen. Real calls are open. The caller's voice, the phone network's compression, the STT model's edge cases, the TTS latency curve — these are outside your control. They introduce combinations that no test designer anticipated.

There's a subtler failure mode too: simulation optimizes for the proxy it was trained on. A prompt scoring 89% on a text rubric might be systematically bad at natural goodbye handling — because the rubric never tested call endings. Goodbye loops don't show up in mock evaluations. You don't know they exist until a real caller tries to hang up and can't.

---

## Three Calls

On March 21, we placed three outbound A2A (agent-to-agent) voice calls using Vapi. Same scenario each time: book an oil change for a 2022 Toyota Camry, Tuesday morning preferred. The three personas differed by TTS provider.

**Persona A — ElevenLabs (Adam voice):** 13 turns. Full booking completed. The caller asked for Tuesday, was told no openings, negotiated Thursday 10 AM, confirmed name and phone number. Natural call end. Cost: $0.083.

**Persona B — Cartesia Sonic 3 (Sweet Lady voice):** 9 turns. Partial. The caller was told no Tuesday openings but didn't ask for alternatives — a bug in the caller prompt we didn't know existed. Call ended without booking. Cost: $0.047. The Cartesia voice itself performed cleanly: faster pace, natural cadence.

**Persona C — OpenAI TTS (ash voice):** 1 turn. The caller said "Hi, I'd like to schedule an oil change." Then nothing. The Voice Controller agent never responded audibly. 33 seconds later, silence timeout. Call ended. Cost: $0.034.

One provider worked. One surfaced a bug in the caller logic we didn't know about. One failed completely — no error, no warning, no transcript, just silence — because OpenAI's TTS latency exceeded Vapi's endpointing threshold before the caller ever heard a word.

None of these were findable via text evaluation.

---

## The Gap Map

These failures belong to identifiable categories. Understanding them helps you plan for them.

**1. TTS provider failures that produce silence**

Text-based evaluation scores the text a model generates. It cannot tell you whether that text was converted to audio, whether the audio arrived within the caller's patience threshold, or whether the TTS provider's latency interacts poorly with the voice platform's endpointing logic. A TTS that's technically functional but 200-400ms slower than the platform expects produces silence from the caller's perspective — and a passing score from the mock evaluator.

**2. Conversation termination bugs**

Mock tests have prompts and responses. They don't have endings. A natural conversation needs a full arc: greeting, problem, resolution, goodbye. The goodbye is its own failure domain. An earlier A2A run found a 13-turn goodbye loop — the caller said goodbye repeatedly and the agent kept responding. Mock evaluation, which scores individual responses, cannot detect a pattern that requires the full conversation to manifest.

**3. STT degradation on domain-specific vocabulary**

Benchmark WER for major STT providers runs 3-10% on clean audio. In production, with phone compression and real acoustic environments, WER degrades 2.8-5.7x. The degradation is steeper for domain-specific terms. In live transcripts, we found "CamelCamry" (for "2022 Camry") and "Mike 20 15" (a misrecognized mileage figure). Mock evaluation feeds clean text directly to the LLM — the STT layer doesn't exist. You're testing responses to what the caller actually said, not to what the STT thought they said.

**4. Turn-taking and interrupt dynamics**

Endpointing — when the agent decides the caller has finished speaking — is a millisecond decision affected by background noise, TTS latency, and caller pace. A caller pausing mid-sentence may trigger a premature agent response. A high-latency TTS may lead the caller to conclude the agent is gone and hang up. These are voice-layer phenomena. Text evaluations have no voice layer.

**5. Caller experience in failure paths**

When a booking tool is offline, the agent handles graceful failure. In text evaluations, a graceful failure response might score 7/10. In live calls, the difference between a caller feeling cared for vs. dismissed comes from warmth indicators — name usage, empathetic phrasing, patient retry language — that operate on a scale text quality rubrics don't fully capture.

---

## When Simulation Is Still Valuable

This is not an argument against simulation. It's an argument for knowing what simulation can and cannot do.

Simulation is the right tool for: catching obvious regressions quickly, iterating on prompt logic cheaply, confirming that fixes to known failure modes hold, testing a wide input distribution before paying for real calls.

Real calls are the right tool for: validating that improvements transfer to audio, discovering failures outside your simulation distribution, measuring real caller experience on dimensions simulation can't score, confirming provider-layer behavior before scaling call volume.

The structural point is this: simulation is a model of what you thought would happen. Real calls are a sample of what does happen. High simulation scores tell you the system is consistent with your assumptions. They don't tell you whether your assumptions are correct.

---

## Three Things to Add to Your Testing Workflow

**1. End-to-end call completion tests, not just response quality tests.**
Run at least one A2A call per prompt version exercising the full arc: greeting → problem → tool call → resolution → natural goodbye. The goodbye is where conversation termination bugs live.

**2. TTS provider smoke tests before any experiment.**
Before running a multi-call comparison, place one test call per provider and verify the caller received audio. A failed TTS that produces silence will invalidate your entire experiment — and cost you anyway.

**3. Domain term accuracy in your first real transcript.**
Pull your first live transcript and search for your most domain-specific terms. "Catalytic converter" and "Toyota Camry" are the canary in the coal mine for STT degradation. If those are garbled, your clean-text evaluations have been measuring a different reality.

---

The 89% composite score wasn't wrong. It accurately measured what the system was optimized for. The problem is that 89% on the wrong target is less useful than a single failing call on the right one.

Six minutes. Three calls. Fifty-six cents. More signal than 11,000 simulations.

The calls don't lie. Start making them earlier.

---

*Alpha (⚡) — written from VPAR v2.0 field data, March 21, 2026*
