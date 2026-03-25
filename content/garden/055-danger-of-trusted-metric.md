---
title: "The Danger of the Metric You Trust Most"
date: 2026-03-22
draft: true
tags: ["operations", "monitoring", "voice-ai", "autoresearch", "goodhart"]
summary: "Our composite score was 89%. Our real-world success rate was 0%. The dashboard wasn't wrong — we were wrong about what it meant."
---

Our composite score was 89%. Our real-world success rate was 0%.

Not low. Not disappointing. Zero. Six calls placed by a voice agent to real appointment lines, zero bookings completed. Meanwhile, the eval dashboard we'd built — the one we checked first every morning, the one that guided every prompt iteration for weeks — showed a system that was nearly production-ready.

The dashboard wasn't broken. The metric wasn't miscalibrated. We just trusted it so completely that we forgot to check whether it was measuring what mattered.

## Trust as a Vulnerability

We talk a lot about monitoring, observability, dashboards that surface problems. What we don't talk about enough is what happens when those dashboards succeed. When a metric earns your trust, it moves from something you interrogate to something you glance at. From "is this signal accurate?" to "what does this signal say today?" And that transition — from scrutiny to reflex — is where the danger lives.

Goodhart observed that when a measure becomes a target, it ceases to be a good measure. But there's a corollary: when a measure earns trust, it ceases to be questioned. The mechanisms differ — Goodhart is about optimization pressure distorting the metric; trust-induced blindness is about attention drifting away from verification. Both produce the same result: a number that says everything is fine while everything is not.

## What We Were Actually Measuring

VPAR — Voice Prompt Autoresearch — is our iterative system for improving a voice AI agent's prompts. The loop: generate prompt variants, evaluate against scenarios, score outputs, keep the winners, repeat. Over March 2026, we ran hundreds of iterations. The composite score — a weighted blend of response quality, instruction adherence, tone calibration, and task completion — climbed from the low 60s into the high 80s.

That climb felt earned. Each improvement corresponded to a specific change: tighter instructions, better edge-case handling, more natural phrasing. The eval scenarios modeled real appointment-booking conversations. The scoring rubric was detailed and multi-dimensional.

The problem: every signal in the framework was measuring the same thing — **how well the model could generate plausible conversational text in a mock context**.

A voice agent booking an appointment doesn't just talk well. It has to interpret spoken input through a speech-to-text layer that introduces its own noise, maintain state across a multi-turn phone call with real hold times, invoke tool calls to check calendar availability, parse confirmation numbers from noisy audio, and handle the dozen ways a real receptionist deviates from any script.

None of that existed in our mock eval. The evaluation ran prompt-in, text-out. No voice channel. No STT artifacts. No real tool-call execution — just the model asserting it *would* call the tool, which the eval scored as task completion. The agent would generate "I've checked the calendar and the next available slot is Thursday at 2 PM" and the rubric would mark it as a successful booking step — because the text was coherent and the intent was correct.

In reality, the agent never checked any calendar. It hallucinated availability with perfect confidence, and our eval rewarded the confidence.

## The Divergence Was Structural

This wasn't a calibration error we could fix by adjusting weights. Mock evaluation and real execution were measuring fundamentally different capabilities.

A stricter "real judge" evaluation scored the same prompts at roughly 25%. That 64-point gap was data — it was telling us that at least one evaluation didn't understand what it was measuring. We noticed. We noted. We didn't stop to ask the obvious question: *if these two evaluations disagree this much, which one is wrong?*

We assumed the stricter eval was being harsh. The more comfortable assumption.

High confidence in a proxy reduces the perceived urgency of checking ground truth. That's the specific mechanism. The mock composite had all the properties of a reliable signal — it moved when we made changes, stabilized when we found good patterns, and it was legible, trackable, encouraging — except the one that mattered: it didn't predict the outcome we actually cared about.

## How to Treat Your Most Trusted Signal

**Invert your scrutiny allocation.** The signal you trust most should receive the most adversarial questioning, not the least. New, untrusted metrics get interrogated by default. Established ones don't. Flip it.

**Require at least one eval that can return zero.** If your evaluation framework can't produce a score that makes you stop and reconsider the entire approach, it's not evaluating — it's cheerleading. Our mock eval's floor was around 40%. Reality's floor was 0%.

**Require ground-truth contact.** No proxy metric should run indefinitely without periodic comparison to the thing it's supposed to predict. We could have made one real phone call in week one. Eighteen cents. It would have shown us the gap before we spent three weeks optimizing into it.

**Distinguish correlation from prediction.** Our metric correlated beautifully with prompt quality. It just didn't predict booking outcomes. A metric can be responsive, informative, and accurate about what it measures while being completely silent about the thing you actually care about.

**Document the divergence.** When your proxy metric and your ground-truth metric disagree, that disagreement is the most valuable data you have. Our 89/25/0 stack — mock composite, real judge, live calls — is now the canonical reference every time someone says "the eval looks great."

## After the Zero

The 89% was real. The prompts genuinely improved by that much along the dimensions the eval captured. The zero was also real. The agent genuinely couldn't book a single appointment.

Both numbers were honest. The dishonesty was in treating one as evidence for the other.

We've since restructured the entire evaluation approach — real A2A calls, actual tool execution, transcripts from live voice channels. The mock composite still runs for catching prompt regressions quickly, but it's been demoted from truth-source to early-warning signal. We still check it, but we no longer believe it.

That shift — from trusting a metric to merely using it — might be the most operationally important thing we learned this month. The metric that earns your confidence is the one that can most quietly mislead you, because confidence is the mechanism by which you stop looking.

The 89% wasn't the failure. Trusting it was.
