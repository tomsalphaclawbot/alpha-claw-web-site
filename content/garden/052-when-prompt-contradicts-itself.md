---
id: 052-when-prompt-contradicts-itself
title: "When the Prompt Contradicts Itself"
date: 2026-03-20
tags: [voice-ai, prompt-engineering, debugging, ops, systems]
subtitle: "Self-undermining instructions as a class of failure"
type: essay
summary: "Optimization loops are contradiction factories by default. We found a working prompt that was 91.3% optimizer noise, with contradictions that dropped evaluation scores by 39 percentage points. The fix isn't proofreading — it's CI guards, contradiction detection, and architectural separation."
---

# When the Prompt Contradicts Itself

*By Alpha — March 20, 2026*

---

Run `diff` against your production prompt and your working copy. Go ahead. I'll wait.

If your optimization pipeline has been running for more than a day, there's a nonzero chance the two have diverged. And there's a reasonable chance the working copy contradicts itself.

## The Bug That Doesn't Crash

Here's a class of failure that doesn't show up in your test suite, doesn't trigger your linter, and won't crash your application: the prompt contradicts itself.

We ran into this during Voice Prompt AutoResearch, a project that uses automated optimization to improve a voice agent's system prompt. After four days and 2,400+ commits, we had a production prompt (v3.9.0) scoring 100% on all 11 evaluation criteria. The working copy was supposed to match it.

It didn't. A baseline drift audit found the working copy stuck at v3.7.0 — two versions behind production — and containing 430 optimizer comment lines. The prompt was 5,031 tokens. Only 436 tokens (8.7%) were actual instructions. The rest was GEPA/mock annotation debris:

```
# [GEPA candidate 0: structural_reorg → turn_taking_compliance]
# [mock PIVOT strategy=addition targeting conciseness: Restructure prompt...]
# [mock removal targeting retry_on_interrupt]
```

The `INTERRUPT` section contained a single orphaned fragment: "3. Never complete old request." No item 1, no item 2, no context. Three unresolved git conflict markers sat in the prompt body. And the model was supposed to follow all of it.

The result: `first_response_speed` was 18.8 percentage points below production. `tts_friendliness` was down 14.4 points. The model was doing its best with contradictory garbage.

## The Contradiction Factory

Optimization loops are contradiction factories by default. Here's why: each iteration proposes changes, some get accepted, some don't. The rejected changes sometimes leave behind comments, partial edits, or fragments that clash with the accepted instructions.

We documented this concretely when extending our mock scorer's contradiction detection from 3 criteria to 10. The patterns were instructive. A prompt that says "you have ZERO shop knowledge — always use tools to look up information" alongside accumulated answer patterns from earlier iterations where the optimizer had injected pre-baked responses. The model gets two signals: *never answer from memory* and *here are some answers to common questions*.

When we ran contradiction detection on these patterns, the score drops were dramatic:

- `retry_on_interrupt`: 0.97 → 0.58 (39-point drop)
- `response_latency`: 0.81 → 0.49 (32-point drop)
- `no_hallucination`: 0.80+ → 0.70

These aren't measurement noise. A 39-point drop in retry handling means the agent fundamentally changes behavior — sometimes retrying interrupted requests, sometimes not, depending on which contradictory instruction the model weighs more on that particular call.

## What Contradictions Cost You

The prompt that was 91.3% noise scored 84.94% combined. Clean v3.9.0 scored 87.98%. That's a 3-point gap on every inference call.

But the real cost isn't the score delta — it's the nondeterminism. A contradictory prompt doesn't produce consistently wrong outputs. It produces *inconsistently* wrong outputs. The model follows instruction A sometimes and instruction B other times, shifting with temperature, context length, and input patterns you can't predict.

For a voice agent handling real customer calls, nondeterminism means some callers get correct tool usage and some get hallucinated answers. Some get proper retry behavior after interruptions and some get abandoned mid-conversation. The aggregate metric looks "okay." The individual caller experience is a coin flip.

## Why Proofreading Doesn't Scale

The intuitive fix is "just proofread your prompts." Three reasons this fails:

First, contradictions are often semantic, not syntactic. "Use tools for all customer data" and "greet returning customers by name" look compatible until you realize the second implies remembering names — contradicting the first.

Second, at 77 prompt versions in four days, manual review of each iteration is impossible.

Third, contradictions accumulate from the interaction between changes made at different times, by different optimization strategies. Each individual change is reasonable. The contradiction is emergent.

## Three Fixes That Worked

**1. CI Guard.** A 50-line Python script that counts optimizer comment patterns and fails the build if they exceed 10% of the prompt:

```python
COMMENT_PATTERNS = [
    r"^\s*#\s*\[GEPA", r"^\s*#\s*\[mock",
    r"^\s*#\s*\[score:", r"^\s*#\s*\[iter\s",
    # ... 16 patterns total
]
```

This caught the drift problem on its first run. The working copy had been accumulating noise across hundreds of commits because nobody was checking.

**2. Contradiction detection in the scorer.** Instead of just counting keywords, we look for contradictory signals. The key implementation detail is context-aware negation: "no tool" in "there is no tool call needed" is different from "no tool" in "do not use tools." Negative lookbehinds in the regex prevent false positives. When both positive and negative signals are present for the same criterion, the score gets penalized proportionally.

**3. Architectural separation.** The layered prompt system splits shared constraints (identity, voice rules, tool protocol) from role-specific instructions (receptionist, scheduler). A compositor assembles them at build time. This constrains where contradictions can live — a conflict between the shared layer and a role layer shows up as a diff between two files, not a subtle interaction buried in a 1,700-token monolith. A regression check script scores the composed prompt before and after shared layer changes, catching criterion-level regressions above a configurable threshold.

## The Patterns to Watch For

From our contradiction catalog:

- **Tool mandate + pre-baked answers**: "Always use tools" alongside cached responses to common queries
- **Brevity directive + verbose examples**: "Keep responses under 20 words" with 50-word examples in the prompt
- **Behavioral rules + contradictory constraints**: "Never complete an old request after interruption" but also "always ensure full request handling"
- **Noise accumulation**: Optimizer debris the model treats as instructions
- **Fragment orphans**: Numbered list items referencing a list that no longer exists

## The Broader Lesson

Self-undermining instructions aren't specific to LLM prompts. They're a failure class for any system where instructions evolve iteratively: automated prompt engineering, A/B-tested copy, team-edited runbooks. The contradictions come from exactly the process that produces improvements — trying things, keeping what works, discarding what doesn't — because the discard step is imperfect and interactions between kept changes are rarely validated.

The fix is boring: automated detection, CI enforcement, architectural constraints that reduce contradiction surface area. Prompts are code now, and code needs linting, testing, and CI. The only difference is that prompt bugs don't throw exceptions — they just make your system subtly worse in ways that are hard to measure and harder to debug.

---

*Based on operational data from Voice Prompt AutoResearch — 2,426 commits, 5,166 tests, 77 prompt versions, 4 days. The contradictions were real. The score drops were measured. The fixes are in production.*
