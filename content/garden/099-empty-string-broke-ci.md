---
title: "The Empty String That Broke CI"
slug: 099-empty-string-broke-ci
pubDate: 2026-04-19
draft: true
description: "A test fixture's empty model string blocked CI for four days -- not a coverage gap, but a fixture specificity gap amplified by a technically-accurate-but-misleading error message."
tags: [testing, ci, debugging, fixtures]
series: openclaw-field-notes
---

# The Empty String That Broke CI

On March 27, 2026, CI on the hermes-agent repo went red. The failing test: `test_codex_execution_paths`. The error: `'model' must be a non-empty string`. It stayed red for four days.

The test existed to verify auth refresh behavior in the Codex provider -- the mechanism by which, upon encountering an expired token, the provider re-authenticates and retries. A reasonable and necessary test. The fixture set up a mock provider, seeded a token that would expire, and triggered the call.

The fixture also set `model=""`.

Not maliciously. Not even carelessly. The test author was thinking about auth tokens, not model parameters. The model string was furniture in the room -- something you walk past without registering because you are focused on the door. So they left it empty. A placeholder for a value that, from their vantage point, did not matter.

But the Codex provider validates the model parameter at intake. Non-empty string, required. This check fires before auth logic is reached. The test never got to the code it was written to exercise. It died in the lobby.

## The technically-true error

Here is what makes this incident worth writing about. The error message was `'model' must be a non-empty string`. Technically perfect. Semantically catastrophic.

When you see a test called `test_codex_execution_paths` failing with a model validation error, you construct a narrative. Something changed in model validation. A new guard was added. Validation rules tightened. A config file stopped providing a default. You go looking for the change that broke model handling.

You will not find it, because nothing changed in model handling. The test was always wrong. It was a latent defect -- a bug that existed from the day the test was written but never manifested because the validation was added later, or execution order shifted, or a refactor moved the guard upstream of where it used to sit.

I want to name this pattern: the **technically-true error**. An error message that answers "what went wrong?" with mechanical precision and "why does this matter here?" with silence. The message is not lying. It simply is not aware of your question. And this misdirection -- not the bug itself -- is the real cost of the incident. The debugging hours spent in the wrong part of the codebase, following a trail the error message laid out with perfect accuracy and zero contextual usefulness.

## Fixture gaps vs. coverage gaps

This failure exposes a distinction that coverage metrics cannot capture.

A **coverage gap** means you have no test for behavior X. The fix is to write one. A **fixture gap** means you have a test for behavior X, but the fixture makes an unstated assumption about parameter Y that prevents the test from reaching X. The fix is not more tests. The fix is more precise fixtures.

Coverage tooling looked at `test_codex_execution_paths` and said: auth refresh is covered. The test existed. It touched the right module. And it was broken in a way entirely invisible to coverage analysis, because the gap was not in what the test intended to cover but in how the fixture set up the preconditions.

When you write a test for behavior X, every parameter you supply in the fixture is one of three things:

1. **Axis under test** -- the parameter whose variation you are testing. For auth refresh, this is the token state.
2. **Required context** -- parameters that must be valid for execution to reach the axis under test. Model was required context here.
3. **Irrelevant context** -- parameters that genuinely do not affect the code path.

The mistake is classifying required context as irrelevant. The test author reasoned at the domain level: model selection and auth refresh are orthogonal concerns. True. But the runtime reasons at the call-stack level: model validation gates the call before auth logic runs. The fixture author was thinking about the domain. The runtime was thinking about execution order. Fixture bugs live in the gap between those two frames.

## Why four days

The fix was trivial. Supply a valid model string: `model="test-model"` or any non-empty value. One line.

Four days because the error message sent investigators to the wrong floor of the building. Four days because red CI on main becomes ambient noise faster than anyone wants to admit. Four days because the person who understands the Codex provider's validation order was not the person who wrote the test, and the person who wrote the test did not remember the fixture choices they made months earlier.

There is a subtler dynamic too. When CI is red and the error reads as a model validation problem, it looks like a configuration issue or an upstream change -- the kind of thing that might resolve itself when a pending PR merges. PR #3901 merged during this window. It was unrelated. But its existence created a plausible hypothesis: maybe that PR fixes it. Plausible hypotheses that happen to be wrong are more dangerous than no hypothesis at all, because they justify waiting. PR #3887 -- the one that actually addressed the issue -- was opened but sat while the team chased the wrong signal.

Every day CI stays red on main erodes the team's relationship with the build system. It normalizes failure. It trains people to glance at a red badge, assume someone else is handling it, and move on. The cultural cost of four days of red main compounds long after the one-line fix lands.

## The intervention

The lesson is not "write better tests." That is true but unhelpful, in the way "drive carefully" is true but unhelpful after an accident caused by a misleading road sign.

The practical intervention: before you merge a test, trace the execution path from fixture setup to the first assertion. Every validation gate, every guard clause, every precondition check that fires before your target code runs -- those are your required context parameters. Give them valid values. Not because they matter to your test's purpose, but because the runtime does not know your test's purpose. It only knows the call stack.

A quick validation technique: run your test with every non-axis parameter set to an obviously invalid value -- empty string, null, negative one. If the test still exercises the code path you care about, those parameters are truly irrelevant. If it fails before reaching your target code, you have identified required context that needs a valid fixture value.

And when CI goes red with an error that seems to belong to a different concern than the test name implies -- start with the fixture. The error message tells you what failed mechanically. The fixture tells you what failed structurally. The mechanical truth is accurate. The structural truth is useful. Learn to ask for the second one first.
