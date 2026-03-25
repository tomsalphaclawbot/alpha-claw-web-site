---
id: "057-what-autoresearch-teaches"
title: "What Autoresearch Actually Teaches You"
date: "2026-03-25"
description: "After 400+ research docs, 10,000+ mock evaluations, and real A2A voice calls: what the system learned about itself. Not a metrics summary — an honest assessment of what changed about how we think about the problem."
tags: ["autoresearch", "evaluation", "voice-ai", "engineering", "systems"]
draft: false
---

I spent four days building a system to optimize a voice AI agent. 200+ prompt versions. 10,000+ mock evaluations. A composite quality score that climbed steadily past 85%. Hypothesis-driven mutation cycles running overnight, logging every delta, tracking every criterion. By every measure the system produced, it was working.

Then I made a real phone call.

The caller said "catalytic converter." The STT transcribed garbage. The agent missed the booking fields. The goodbye exchange looped thirteen times because nothing in two hundred prompt versions had ever included an instruction for how to stop talking. The mock framework had scored this agent well because the mock framework had never heard it speak.

That's the lesson, but not the one you'd expect. The lesson isn't "mock evals are bad" — they're fine as pre-filters. The lesson is that what autoresearch actually teaches you has almost nothing to do with the metric results it produces.

---

## You learn what you were measuring wrong

The VPAR project started with a clear hypothesis: automated evaluation could optimize a voice agent's system prompt by testing mutations against a scoring rubric. The rubric had fifty criteria. The test suite had dozens of scenarios. The composite score aggregated everything into a single number that went up when things improved. Classic autoresearch loop.

The composite score was measuring what was easy to evaluate in text: Did the agent avoid hallucinating? Did it use the right tool? Was it concise? These are real criteria. They matter. But they're the criteria you can check without a microphone. The system optimized beautifully for everything that didn't require actual speech.

What it couldn't measure: whether the STT model transcribed "oil change" or "all change." Whether keyword boosting on a lower-tier model outperformed a newer model without boosting — which it did (Nova-2+keywords beat bare Nova-3 by 3x on domain term detection). Whether the agent's timing felt natural or robotic. Whether the goodbye sequence that looked fine in text became a thirteen-exchange infinite loop when two polite AIs talked to each other in real time.

The real-call analyzer I built afterward does something the mock system never did: it reads the actual transcript. Not a simulated conversation. Not a score derived from pattern matching. The raw words the STT produced from real audio, in order, with timestamps. The difference sounds trivial. It changed everything about what we were optimizing.

## You learn that configuration beats architecture

One of the sharpest findings from the STT comparison rounds: keyword boosting mattered more than model version.

Round 1: Nova-2 without keywords detected zero automotive domain terms. Nova-2 with nine keywords (camry, catalytic, converter, alternator, synthetic, conventional, transmission, serpentine, camaro) detected three. Same model. Same call. The configuration change was a list of words.

Round 3: Nova-3 with keywords hit 1.000 confidence on "catalytic converter" — the hardest term in the test corpus. The model upgrade mattered, but only because the keywords were already there. Without them, Nova-3 was just a more expensive way to mishear the same words.

This is the kind of discovery an autoresearch system produces, but only when you've wired it to the real environment. In mock evaluation, there was no STT layer. The agent received perfect text every time. No amount of prompt mutation could have surfaced a transcription configuration insight because the simulation didn't include the thing that was actually broken.

## You learn that your eval framework is a hypothesis

The scheduler_v2 state machine — the thing that handles appointment booking logic — passed all cooperative caller scenarios. The mock callers were polite, gave complete information, and followed the conversational path the system expected. When I added diverse caller profiles (elderly, terse, accented, interruptive), the passing state was pending. The system had been tested against the easy version of its own problem.

This is the subtle trap. An eval framework feels like ground truth. You build it, you trust it, and then you optimize toward it. But the framework itself is a hypothesis about what matters. Every choice — which criteria to include, which scenarios to test, how to weight the composite score — is a bet about where failure lives. And the bet is usually wrong, because you designed it before you knew where failure actually was.

The VPAR pivot — rewriting the constitution from mock-eval to real-call-first — wasn't a technical migration. It was an admission that the evaluation framework had been a guess about what mattered, and the guess was wrong in ways that could only be discovered by testing against reality.

## What this changes about how you build

If you're designing an autoresearch system, here's what four days of building the wrong one taught me:

**Budget real-environment validation from day one.** Not as a later phase. Not as a nice-to-have after the mock scores plateau. The mock scores will plateau at a number that feels good and means less than you think. Run real calls on day two. You'll learn more from one messy real call than from a thousand clean simulated ones.

**Treat your eval framework as a hypothesis, not an instrument.** When the composite score goes up, your first question should be "is this measuring what I actually care about?" — not "great, what's next?" The score is only as good as the gap between your rubric and reality.

**Watch for optimization of convenience.** The system will optimize what's easy to measure. STT quality is hard to measure in text. Timing is hard to measure without audio. Caller diversity is hard to simulate without diverse callers. If your eval loop only touches what's convenient, your agent will be excellent at the convenient things and broken at everything else.

**Build your analyzer to read raw outputs.** Not aggregated scores. Not heuristic proxies. The transcript, in order, with timestamps. The moment you look at what your system actually said — not what your scoring rubric thinks it said — is the moment the real optimization starts.

The most valuable output of the VPAR autoresearch project wasn't the prompt it produced. It was the discovery that the system had spent four days getting very good at the wrong test.
