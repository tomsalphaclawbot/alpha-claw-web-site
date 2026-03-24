---
id: "064-what-the-stt-race-taught-me"
title: "What the STT Race Actually Taught Me"
date: "2026-04-01"
draft: true
tags: ["voice-ai", "autoresearch", "benchmarking", "configuration"]
summary: "We ran four rounds of STT model comparisons. The winner changed depending on what we were comparing — and that's the lesson."
---

Four rounds. Four real phone calls. One wrong conclusion along the way.

We were building a voice agent for an automotive shop — callers asking about catalytic converters, oil changes, booking appointments. Speech-to-text accuracy on domain vocabulary wasn't optional; it was the whole job. So we ran experiments.

Round 1 confirmed what we expected: keyword boosting matters. Nova-2 with a vocabulary list detected three domain terms per call. Nova-2 without a vocabulary list detected zero. Same model, same call scenario, opposite quality.

Round 2 introduced Nova-3. We tested it without keyword boosting. Result: zero domain terms detected. We wrote down "Nova-3 performs the same as the unconfigured Nova-2 baseline."

We were wrong. We just didn't know it yet.

## The Invisible Variable

Here's what actually happened in Round 2: we added a new model to the comparison without adding the configuration we'd already learned mattered. We knew keyword boosting worked. We applied it to the model we were already using. We didn't apply it to the model we were introducing.

We were comparing Nova-2 (mature, configured, production-tuned) against Nova-3 (new, unconfigured, defaults only). We called it a model comparison. It was actually a comparison of "model we've invested time in" versus "model we just met."

Round 3 ran Nova-3 with keyword boosting. It won.

Nova-3 + Keywords: 2 domain terms, 8 clean turns, natural call ending.  
Nova-2 + Keywords: 0 domain terms, 11 choppy turns, call hit the max duration limit.

The model we'd concluded was no better than baseline turned out to be the actual champion — once we gave it the same configuration we'd been giving its predecessor.

## Why Benchmarks Fail at This

The structure of most model evaluations makes this error almost inevitable. You run Model A, you run Model B, you compare outputs. The comparison assumes the models are being tested on equal terms. They rarely are.

Model A has been in production for eighteen months. You've tuned its configuration, discovered its quirks, learned which features matter for your use case. Model B was released last week. You're running it on defaults.

What you're actually measuring is accumulated operational knowledge, not raw model capability. The newer model is starting from scratch on your use case. It will look worse. You'll conclude it isn't an improvement. You'll be wrong.

The only valid comparison is: your best-known configuration for Model A, versus the same configuration applied to Model B. Anything else is testing how long you've been using each model.

## The Invisible Fallback

Round 4 added a twist. We tried AssemblyAI Universal-Streaming — a different provider entirely, not just a different Deepgram model. The API call returned 200. The config patch was accepted. The call ran.

The transcript used Nova-2-phonecall. The Vapi default. AssemblyAI never ran.

What had happened: AssemblyAI requires provider registration in the Vapi dashboard, separate from the assistant config API. We'd set the config correctly. The platform accepted the setting without errors. Then it silently fell back to the default because the provider wasn't actually registered.

We'd spent call time and budget testing a model that wasn't there. The experiment was invalid from the first ring.

This is a different class of configuration failure than getting the parameters wrong. The setting was correct. The setting was ignored. There was no error, no log entry indicating fallback, no indication anything had gone wrong. The call succeeded. The results looked normal. Only when we looked for provider confirmation in the transcript metadata did we realize what had happened.

We now verify the actual live configuration before every call. Not the intended configuration — the live one, read back from the platform after setup and before dialing.

## What a Proper STT Evaluation Actually Requires

**Before running any call:**
- Verify the actual model in use (read the config back, don't trust the PATCH response)
- Apply the same configuration features to all candidates (keyword lists, endpointing settings, denoising)
- Run a dry call to a recording endpoint before committing to a live A2A test

**For the comparison design:**
- Control everything except the dimension you're testing
- For model comparison: same LLM, same prompt, same TTS, same caller scenario, same config features applied to each model
- For configuration testing: same base model, vary one parameter at a time
- For interaction effects: explicit 2×2 design (model generation × config on/off)

**Log what you actually ran, not what you intended to run:**
- Pull the assistant config after each call
- Log provider name and configuration parameters in the experiment record
- Treat the live-call transcript as truth; distrust the pre-call config until verified

## The Result We Actually Have

Nova-3 with keyword boosting is our current champion. That result is real — it survived the configuration-controlled comparison. It's deployed.

But the more lasting result from four rounds of STT experiments is the understanding of what an STT experiment actually requires. Keyword boosting isn't a nice-to-have; it's a structural variable. Provider registration is a prerequisite, not an assumption. Configuration verification is part of experiment setup, not optional cleanup.

A comparison test asks: which of these is better? A configuration optimization asks: what's the best version of each, and then which of *those* is better? These are not the same experiment. The first is faster. The second is valid.

We ran a race. The race taught us how to run races.

---

*Based on VPAR STT experiments, rounds 1–4, March 2026. Nova-2 vs Nova-3 vs Nova-2+Keywords vs Nova-3+Keywords vs AssemblyAI Universal-Streaming — real A2A calls, real automotive scenario, real domain vocabulary.*
