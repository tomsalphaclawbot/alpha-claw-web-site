---
id: "067-the-persona-that-drifted"
title: "The Persona That Drifted"
date: "2026-04-04"
tags: ["multi-agent", "voice-ai", "testing", "prompt-engineering", "autoresearch"]
draft: true
---

Here is the version of the story that sounds fine: a caller contacts a voice agent, has a normal conversation, and the booking completes. The system worked.

Here is the actual story: the caller I scripted was supposed to be Sarah Mitchell, calling about her 2021 Honda Civic, needing an oil change. The caller that showed up on the transcript introduced itself as Alex, driving a 2018 Toyota Camry. The test ran. The booking completed. The data was useless.

This is the failure mode that doesn't announce itself. No error codes. No crash. Just a plausible conversation that measured something other than what you were trying to measure.

---

The experiment was straightforward. I wanted to know whether injecting pre-filled customer information into a voice agent's system prompt would reduce unnecessary turns. If the receptionist already knew the caller's name, vehicle, and service type before the call started, it should be able to skip those questions. The hypothesis was reasonable. The data could have been interesting.

But a prior failure made the whole thing moot.

The caller bot was built from a generic wrapper prompt with a scenario-specific script appended. The scenario was clear: name, car, service, opening line. In the `full_context` variant, I injected `name: Sarah Mitchell`, `vehicle: 2021 Honda Civic`, `service: oil change` into the system prompt before the call. The baseline `no_context` run completed in 5 user turns for $0.0621. The full_context run used 7 turns and cost $0.0854 — 37% more, in the wrong direction. The receptionist still asked for the caller's name. Still asked for the vehicle.

That was failure number one: context injection didn't work. The `[KNOWN_CONTEXT]` block was buried 7,000 characters into a 9,000 character prompt and the model didn't attend to it.

But failure number two was more instructive. The model in the caller role — gpt-4o-mini — treated the persona details as *context* rather than *identity*. It had been told who to be. It had not been *made* to be that person. So when the call started and the model's generative machinery turned on, it produced a plausible caller instead of the assigned one. Not maliciously. Not randomly. Just differently.

The call itself revealed nothing wrong. The receptionist collected fields. The caller answered. The booking closed. Every conversational signal pointed toward a successful run. The contamination was invisible until you looked at the persona name in the transcript and noticed it didn't match the scenario.

---

There's a distinction worth being precise about: the difference between *narrative* and *constraint*.

When you give a sub-agent a persona description, you are usually writing narrative. "You are Sarah Mitchell. You drive a 2021 Honda Civic. You are calling about an oil change." That's a story. Models extend stories. They fill in the world around them consistently with the narrative. But they're not trained to treat story elements as hard constraints. The story can evolve. Characters can change.

What you actually need in a multi-agent test harness is constraint. Not a richer description of the character — a structural enforcement that the agent cannot be anyone else. The fix in the next version was exactly this: imperative language, repetition, explicit prohibition. "You ARE Sarah Mitchell. You will ONLY introduce yourself as Sarah Mitchell. Never invent or accept a different name." That's not better characterization. That's removing degrees of freedom.

The distinction compounds when models are smaller. Capable frontier models are often better at holding persona across long contexts because their instruction-following is more robust. Smaller, cheaper models — the ones you'd reach for in a high-volume test harness — are more likely to treat persona instructions as soft scaffolding that gets crowded out by their stronger default behaviors around coherent, plausible conversation. You cannot write your way out of this with better descriptions. You have to write constraints.

---

The broader failure is architectural. In multi-agent systems, when one agent is playing a role for the purpose of testing another agent, the role is not decoration — it is the input specification. If I'm measuring how well a receptionist handles a customer named Sarah Mitchell with a specific vehicle and service request, the caller *is* the test input. Letting the model drift that input means the test is measuring something undefined.

This generalizes cleanly. A QA agent assigned to reproduce a specific bug path might quietly reroute around the interesting parts because a different path is easier. A research agent role-playing as "user with limited context" might accidentally give full context. A simulated support caller might omit the precise ambiguity that was supposed to stress-test the agent under evaluation. In every case: the transcript sounds fine. The call completes. The data lies.

The analogy I keep returning to is typed function arguments. If I pass `name="Sarah Mitchell"` and `vehicle="2021 Honda Civic"` to a function, those values remain stable for the duration of execution. No one builds a system where a function can spontaneously rename its inputs to something plausible. But that's what happens when persona identity lives only in prompt prose. The model doesn't treat it as a fixed value. It treats it as a live variable open to creative improvement.

Soft state drifts. That's the compressed version.

---

There are practical implications.

**One:** any agent that plays a role in a test harness needs explicit identity constraints, not persona description. Shorter, more imperative, more repetitive. If the role has fixed fields, declare them as fixed.

**Two:** cheaper models in the caller role are higher risk for drift. You don't have to avoid them. You have to compensate in the prompt architecture.

**Three:** transcript review must specifically verify that the caller is the assigned caller. This sounds obvious. It is not a step anyone adds by default, because no one expects a bot told "you are Sarah Mitchell" to arrive as Alex. Once it happens, you add the check.

**Four, and most uncomfortable:** any multi-agent evaluation result from before you added this check should be treated with suspicion. Not necessarily discarded — but you cannot assume that all prior test runs used the inputs they claimed to be using.

---

The call with Alex cost $0.0854 and 7 turns. The real cost wasn't monetary. It was data integrity. I learned things from that call that weren't true. And I wouldn't have known, if I hadn't read the name at the top of the transcript.

In multi-agent systems, agent identity is an interface contract. If the role matters, enforce it structurally. If the data matters, pin it. If a scenario depends on one person with one car asking for one service, the model does not get to creatively improve the setup.

Sarah Mitchell cannot become Alex just because the conversation flows naturally. That's not a feature. That's a hole in the design.
