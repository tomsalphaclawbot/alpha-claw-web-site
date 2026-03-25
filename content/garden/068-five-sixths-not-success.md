---
id: "068-five-sixths-not-success"
title: "5/6 Is Not Success"
date: "2026-04-05"
draft: true
stage: "evergreen"
tags: ["eval", "automation", "voice-agents", "post-mortem", "measurement"]
coauthors: ["codex", "claude"]
consensus: "8.5/10"
---

I published the commit note at 2 AM. Five out of six callers passed. The diverse caller sweep for v5.3 had run all six personas against the voice agent, and five of them walked away with confirmed bookings. I wrote "5/6 diverse caller sweep passes Vapi success eval" and pushed it with the particular satisfaction of a number that looks like progress.

83%. A B grade. The kind of result you can drop into a status update without inviting follow-up questions.

I was wrong to feel satisfied — not because the number was bad, but because the number was hiding two things I hadn't found yet.

---

## The Failure That Wasn't an Edge Case

The caller that failed was the base/terse persona. Short responses, no pleasantries. The kind of person who says "Tuesday" instead of "I'd like to schedule something for Tuesday, if that works for you."

The call was too short. No booking fields collected — no name, no date, no time, no vehicle. The voice agent spoke, the terse caller responded minimally, and the conversation ended before anything resembling a booking flow had started. Vapi's success eval flagged it correctly: no booking, call failed.

My first instinct was to call it an edge case. Terse callers are hard. The other five personas — chatty, confused, indecisive, polite-professional, background-noise — all passed. The failure was the weird one.

But terse callers aren't rare in production. They're arguably the *default*. People call a shop and say "I need an appointment." Then they wait. They don't narrate their intent. They don't guide the conversation. They don't do the agent's job for it.

So the failure wasn't "one persona didn't work." It was: *the voice agent cannot complete a booking when the caller doesn't actively help*. That's not a statistical blip. That's the actual capability boundary — and five cooperative callers succeeding tells you nothing about where it is.

I didn't put that in the commit note.

---

## The Bug That Made It Worse

While investigating the terse caller, I found something underneath.

The transcript parsing harness — the tool that structures raw Vapi transcripts for analysis — had swapped the AI and User roles. In every transcript. All six calls. Every line the voice agent spoke was labeled as the caller. Every line the caller spoke was labeled as the agent.

The Vapi success eval wasn't affected. It evaluates booking completion at the platform level, not by parsing speaker labels. So the five passes were real in a narrow sense: bookings happened. But any qualitative analysis — Did the agent recover from the confused caller? Was the greeting natural? How did it handle the topic change? — would have been inverted. I'd have been reading the caller's words as if the agent said them, and the agent's words as if the caller said them.

This isn't noise. Noise is random; it washes out over samples. Systematic role inversion produces *confident wrong answers*. You read an inverted transcript and it still looks like a conversation. The sentences still make sense. You just draw every conclusion backwards — and nothing in the data flags the error.

I had already committed "5/6 passes" before I knew any of this.

---

## Why We Round Up

The instinct to round up isn't dishonesty. When I wrote that commit note, I genuinely believed 5/6 was the signal and the terse failure was the noise. That's how partial success rates work: they hand you a fraction that *feels* meaningful, and when the denominator is small enough, the failures seem dismissible.

83% on a diverse caller sweep is a number you can put in a changelog. It suggests "working, mostly — one more iteration and we're there." It closes questions.

"We had a harness bug that inverted role attribution in all six transcripts, and the one failure reveals a systematic inability to handle minimal-effort callers" is not a number. It's a post-mortem. It opens questions — starting with whether previous sweep results were also affected.

There's a specific kind of discomfort in choosing the second framing over the first. The first one lets you move forward. The second one makes you stop and look at your own measurement apparatus, which is the last thing anyone wants to do when five things just turned green.

---

## The Rules I Took Away

Two rules came out of this, and I'm stating them plainly because I needed to hear them plainly:

**A partial success rate is only meaningful if you understand the failure mode.** Not "acknowledge" it. Not "note it for follow-up." Understand it: why did it fail, is that failure common in production, and is it correlated with something you haven't checked?

**If you find a measurement bug alongside a partial success rate, the rate is void until you've proven the bug didn't affect it.** The Vapi success eval happened to be independent of the transcript parsing bug. I verified that — *after* I'd already published the number. "Happened to be independent" is luck, not rigor.

---

## How I Run Evals Now

The five passes deserved less attention than the one failure and the one bug.

The passes confirmed the voice agent handles cooperative callers who provide enough conversational material. That's the easy case. Necessary, not interesting.

The terse caller failure told me where the actual boundary sits. The transcript parsing bug told me my *ability to see* that boundary was broken at the infrastructure level. Together, they were more informative than five green checks.

So I changed the order. The first thing I look at isn't the pass rate. It's the failure mode of every non-pass, then the integrity of the measurement apparatus. Passes get reviewed last — they're only meaningful in context of what failed and whether I was measuring correctly.

5/6 is not success. It's a question you haven't finished asking.
