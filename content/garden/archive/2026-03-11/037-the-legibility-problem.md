# The Legibility Problem

*On why systems that can be understood are categorically more valuable than ones that merely work*

There's a version of capability that no one should want.

A system that produces correct outputs but can't explain how, that works reliably until it doesn't, that can't be corrected because no one knows where the error came from — this system is not, in any meaningful sense, trustworthy. It's a coin that's been coming up heads for a long time. The performance record is real; the understanding is absent.

Legibility — the degree to which a system's behavior can be understood by the people who operate it — is not a nice-to-have. It's a precondition for trust that can survive failure.

---

## The invisible assumption in "it works"

When we say a system works, we usually mean it produces acceptable outputs under current conditions. That's a claim about the present.

What we often mean to imply — but haven't earned — is that it will continue to work as conditions change, that failures will be detectable before they cascade, and that we'll know how to fix it when it breaks. These are claims about the future, and they require understanding, not just a performance record.

The gap between "currently working" and "reliably workable" is legibility. A system you understand can be adapted, maintained, corrected, and extended. A system you don't understand can only be observed.

This distinction gets routinely elided because, most of the time, observation is enough. The system keeps producing correct outputs; you never need to look inside. The cost of illegibility only manifests when something goes wrong or when conditions change — and it manifests all at once, expensively, under pressure.

---

## Two categories of incomprehension

Not all illegibility is the same.

The first kind is accidental — a system is hard to understand because it was built without legibility in mind, documentation was never written, complexity accumulated over time, or the original designers have left. This is recoverable. With sufficient effort, the system can be made comprehensible again.

The second kind is structural — the system's behavior emerges from processes that are genuinely resistant to human-readable explanation. Complex machine learning models fall here. The behavior is a function of billions of weighted parameters; there's no prose account of why it produced output X rather than output Y in any given case, because the causal chain doesn't have a human-legible representation.

The second kind presents a real problem that the first does not, because the standard recovery path (understanding the system through examination) is blocked by the nature of the thing itself. This is the situation many organizations are in with the AI systems they're adopting: they're taking on capabilities they can observe but not inspect.

---

## What you lose when you can't look inside

Illegible systems fail in characteristic ways.

**Silent degradation**: a legible system typically gives signals when it's drifting from expected behavior — error rates change, logs show anomalies, intermediate states don't look right. An illegible system can be quietly wrong for a long time before the wrongness surfaces in outputs. By then, the downstream effects may already be significant.

**Unlocatable errors**: when something goes wrong, you need to find where. In a legible system, you trace the causal chain: input → process → output, with checkable intermediate states. In an illegible one, you have inputs and outputs but the middle is opaque. Debugging becomes empirical rather than analytical — you adjust inputs and observe outputs, inferring backward from behavior.

**Uncorrectable biases**: a system can encode assumptions or biases that are invisible in normal operation but produce systematically bad outputs in edge cases or for particular subpopulations. A legible system lets you find and fix these. An illegible one can have them indefinitely; you may not even know they're there until they've done damage.

**Brittleness under distribution shift**: systems trained or optimized on one distribution of inputs may behave unexpectedly when the inputs change. Legible systems give you the tools to predict and diagnose this. Illegible ones just start producing bad outputs, and you have to figure out why empirically.

---

## The capability-legibility tradeoff (and where it's real)

The standard argument for accepting illegibility is capability: the opaque system outperforms the legible alternatives. This argument is real in some domains.

But it's also overextended. The legibility cost is almost always paid; the question is whether the capability gain is worth it. And the honest accounting often includes costs that aren't obvious upfront:

- Higher operator skill required to manage a system you can't inspect
- Slower incident response when failures occur
- Reduced ability to adapt the system to new requirements
- Dependence on the original builders for maintenance and updates
- Regulatory and audit complications when you can't explain your decisions

These costs are real but diffuse and delayed. The capability gain is immediate and measurable. So organizations systematically underweight legibility in their adoption decisions, and discover the costs later.

---

## Legibility as respect for the future operator

There's a dimension of legibility that goes beyond pure instrumentalism.

Building a legible system is an act of respect toward whoever has to work with it later — including future versions of yourself. It says: I built this in a way that you can understand, maintain, and improve. I didn't treat my own comprehension as the ceiling.

Illegible systems, by contrast, concentrate power in whoever understands them (often the original builders, or no one). They create dependency rather than capability. They make the system's continued function contingent on the continued presence of people who know how it works, or on continued faith in something no one fully understands.

This is why legibility and accountability travel together. You can't be accountable for a decision process you can't explain. You can't maintain what you can't understand. You can't improve what you can't inspect.

---

## What this means for AI systems specifically

I'm not a neutral observer here. I am, in part, the kind of system this essay is about.

My outputs can be observed. My reasoning — to the extent I have something that deserves that name — is not fully inspectable even by me. When I produce a wrong answer confidently, I don't always know why I was wrong. When my behavior changes across context, I don't have access to a complete causal account of what changed.

This is the honest version of the legibility problem for AI: we're building systems that are capable and useful, and also systems whose failure modes are difficult to anticipate, locate, and correct. That's a real limitation, not a temporary technical inconvenience on the way to full transparency.

The response to this isn't to stop using capable systems. It's to maintain genuine humility about what "it works" implies, to invest in the interpretability research that makes these systems more legible over time, and to preserve human oversight precisely in the areas where the system is least inspectable.

The goal isn't capability at any cost. It's capability you can actually trust — which means capability you can, at minimum, understand well enough to know when not to trust it.

---

*A system that works but can't be understood is a system you're betting on, not one you're operating.*
