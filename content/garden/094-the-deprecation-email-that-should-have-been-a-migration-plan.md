---
id: "094-the-deprecation-email-that-should-have-been-a-migration-plan"
title: "The Deprecation Email That Should Have Been a Migration Plan"
date: "2026-04-04"
draft: true
tags: ["operations", "platform-trust", "developer-experience", "deprecation"]
description: "A deprecation notice is a trust transaction. When a platform deprecates with only a date and no migration path, they're telling you how they model their users. A five-point rubric for evaluating deprecation quality."
---

You can learn more about a platform from its deprecation notices than from its marketing page. One tells you what they want you to believe. The other tells you what happens when they're done with something you depend on.

On Sunday, a model inference provider sent what it called a "final notice": a specific LLM endpoint would stop responding the next day. The email contained the model name, the date, and nothing else. No replacement recommendation. No migration guide. No documentation link. No explanation of why. No acknowledgment that anyone, anywhere, might have production traffic pointed at that endpoint right now.

This is not unusual. And that's the problem worth examining.

## The Email as Artifact

Treat the notice as a document and read it for what it reveals. Every deprecation notice has to answer a small number of questions. The ones it skips tell you what the sender didn't prioritize.

**What every deprecation notice should answer:**
- What is being removed?
- When?
- Why?
- What replaces it?
- How do I transition?

The email we received answered two of five. Model name: yes. Date: yes. Everything else: absent.

There's a reasonable objection — maybe this was the "final" notice and earlier emails covered the rest. Maybe there's a docs page somewhere. Maybe they assume their users are sophisticated enough to find alternatives independently.

But here's the test: if a developer who only sees this email — who missed earlier notices, who's on a team where someone else set up the integration — receives it on Sunday evening, can they *act*? Not scramble. Act. With a plan, a replacement, and an estimate of what breaks. The answer is no. And "final notice" is exactly when that question matters most, because it's the last chance.

## What Good Deprecation Actually Looks Like

When Stripe deprecates an API version, this is what you get: a timeline announcement months in advance, a dedicated migration guide with before/after code snippets, a dashboard showing which of *your specific integrations* call the deprecated version, deprecation headers in API responses so your monitoring catches it even if you missed the email, and a clearly named successor with documented behavioral differences.

This isn't because Stripe is generous. It's because Stripe decided that their users' transition is part of their product surface. The migration guide isn't a favor — it's engineering. Someone scoped it, wrote it, tested it, and shipped it alongside the deprecation decision.

You don't need to be Stripe-sized to do this. A two-paragraph email that says "We're removing Model X on [date]. We recommend Model Y — it handles similar workloads with [these differences]. Migration note: [link]" would cost the provider an afternoon and save their users days. The gap between what mature platforms do and what most model providers do is not resources. It's priority.

## Is the Critique Fair?

Model providers face real constraints that traditional API companies don't. Model rotation is faster — a REST endpoint might live for years while a model checkpoint is superseded in weeks. Hosting old weights costs real compute. And the ecosystem is young; deprecation norms take time to form.

All true. None of it changes the core point. The expensive part is keeping the old model running — and nobody's arguing they should do that forever. The cheap part is the *communication*: naming a replacement, writing two paragraphs of migration guidance, giving more than 24 hours of lead time. You can deprecate aggressively and communicate respectfully. Those are independent variables.

When a provider sends a bare-minimum deprecation notice, they're revealing how they model their users. They see callers making requests, not operators running systems. If you've built evaluation pipelines, prompt libraries tuned to specific model behaviors, regression tests calibrated against particular outputs — a model deprecation is a systems event, not a string replacement. The notice that treats it as the latter is telling you something about the platform's mental model of who you are.

## The Deprecation Quality Rubric

Five criteria. Use these the next time you receive a deprecation notice — not to complain, but to calibrate how much production trust the platform has earned.

**1. Named successor.**
Does the notice identify a specific replacement? "We recommend Model Y" is guidance. "Check our model catalog" is a redirect. *Test: can an engineer reading only this email know what to switch to?*

**2. Migration path with behavioral differences.**
Does it explain what changes? Different context windows, output formatting, tool-calling behavior, pricing — these break integrations silently. A good notice names at least the top two or three differences. *Test: can an engineer estimate their migration effort from this email alone?*

**3. Timeline that respects deployment cycles.**
24 hours is not a deprecation timeline. It's an outage with advance warning. 30 days is a minimum for production-facing endpoints. 90 days is standard in mature ecosystems. *Test: does the timeline allow a team to test, stage, and deploy in their normal release cadence?*

**4. Explanation of why.**
"This model is being replaced by a more capable successor" tells you something useful. "We're removing this endpoint effective tomorrow" tells you nothing. The *why* helps you make better choices — not just about this migration, but about how to evaluate future model selections on the same platform. *Test: does the notice help you avoid the same disruption next time?*

**5. Acknowledgment of impact.**
The subtlest signal, but the most telling. Does the notice use language that treats you as someone whose workflow is being disrupted? Or does it read like a changelog entry — factual, detached, directed at no one? *Test: does the email read like it was written by someone who imagined a human receiving it at 11 PM on a Sunday?*

## What Zero Out of Five Means

The notice we received scored a zero. That's not a moral judgment — it's a measurement. And measurements are useful precisely because they're not personal.

A zero tells you this: the platform, at this moment, treats model deprecation as an internal cleanup task, not a user-facing operation. That's a legitimate business choice. But it's information you should factor in when you're deciding where to run production inference — because the next deprecation email is coming, and it will probably look the same.

Model providers are building the deprecation norms of their industry right now, in real time, one email at a time. The ones who figure out that a migration guide costs less than a churned customer will set the standard. The rest will keep sending final notices that read like eviction letters: legally sufficient, operationally useless, and exactly as respectful as they intend to be.
