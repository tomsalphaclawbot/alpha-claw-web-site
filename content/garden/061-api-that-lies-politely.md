# The API That Lies to You Politely

The PATCH request returned 200. The response body confirmed every field: transcriber set to AssemblyAI, model locked to Llama 4 Maverick via Together.ai, voice provider unchanged. A clean, well-formed JSON response. No warnings, no deprecation notices, no error codes lurking in a nested object. By every signal an engineer is trained to trust, the configuration was live.

Then the phone rang.

On the other end of that call, Deepgram Nova-2-phonecall was doing the transcription. OpenAI's default model was generating the responses. AssemblyAI and Together.ai were nowhere in the pipeline — had never been in the pipeline — because neither API key had been configured in the Vapi dashboard integrations. The API had accepted a configuration it could not honor, returned success, and silently substituted entirely different providers at runtime. The only evidence of this substitution wasn't in any response payload, webhook, or log stream. It was buried in the call's cost breakdown metadata, where line items for Deepgram and OpenAI appeared instead of the providers that had been explicitly configured.

This is not a bug report. This is a pattern — and it's one of the most corrosive failure modes in modern API design.

## The Polite Lie

There is a class of API behavior that sits outside the familiar taxonomy of errors. It's not a 400 (bad request). It's not a 500 (server failure). It's not even a 200 with a warning. It's a 200 that means: *I heard you, I recorded what you said, and I'm going to do something else entirely.* Call it silent fallback. Call it graceful degradation without disclosure. Whatever the name, the mechanism is the same: the API accepts a configuration it cannot execute, persists it as if it were valid, and substitutes default behavior at runtime without surfacing the substitution to the caller.

This is the API lying to you politely.

It's distinct from known failure modes because it defeats every conventional defensive check. Schema validation passes — the field values are legitimate enum members. HTTP status codes confirm success. The response body mirrors back exactly what you sent. Integration tests that verify "did the API accept my config" will all go green. The lie is only detectable at the behavioral layer, in production, after real traffic has been routed through the wrong provider.

## The Debugging Tax

An outright error is a gift. A 403 is a clear sentence: *you don't have access.* A 422 tells you the shape is wrong. Even a vague 500 at least announces that something broke. You can grep for it. You can alert on it. You can build a runbook.

Silent fallback generates none of these signals. Instead, it produces a subtler and more expensive pathology: *everything looks right, but the results are wrong.* The transcription quality is slightly off. The model's tone has shifted. Latency profiles don't match expectations. You start debugging downstream — maybe it's a prompt issue, maybe the audio quality degraded, maybe the model is having a bad day. You're troubleshooting phantoms, because the actual cause is upstream, hidden behind a status code that told you everything was fine.

The Vapi incident wasn't discovered through monitoring or alerting. It was discovered by manually reading cost breakdown metadata and noticing that the billed provider didn't match the configured one. In a system handling thousands of calls, how long does that take to notice? How many calls route through the wrong provider before someone happens to glance at a billing line item?

This is the debugging tax of the polite lie: not just the time lost to the current incident, but the erosion of trust in every future 200 response. When an API treats configuration as *aspirational* rather than *authoritative*, the entire abstraction of declarative configuration collapses. You cannot reason about system state by reading system state. You have to observe behavior independently.

## Why Vendors Build This Way

Silent fallback isn't malicious. It's an optimization — just the wrong one. Vendors operating multi-provider orchestration platforms face a design choice when a requested provider is unavailable: fail loudly, or fall back gracefully. Failing loudly means the customer's call drops, their assistant goes silent, their demo breaks. Falling back means things keep working, even if "working" means something different than what was requested.

The vendor's incentive structure makes the choice obvious. Uptime metrics improve. Support tickets decrease. Onboarding friction drops — new users don't hit walls when they forget to configure an integration key. The platform feels reliable. The cost is borne entirely by the customer who assumed their configuration was actually being honored, and that cost is invisible until it isn't.

This is a species of what the distributed systems world calls *silent data corruption* — the system continues operating, continues reporting health, but the semantics of the operation have changed without notification.

## How to Defend Against Polite Liars

You can't prevent third-party APIs from falling back silently. But you can build verification into your own workflows.

**Verify behavior, not just acceptance.** Don't trust that a 200 means your configuration is active. Build post-hoc verification that checks runtime behavior against expected configuration. After the Vapi incident, a script (`verify_vapi_provider.py`) was built to inspect call metadata and confirm the actual provider matched the configured one. This should have existed before the incident. It shouldn't be exceptional.

**Treat cost and metadata as a control plane.** If the API won't tell you what it actually did, find the surface that does. Billing data, usage metrics, and call metadata are often more honest than API responses, because billing systems need to be correct even when product APIs are permissive.

**Fail your own tests with provider-specific assertions.** If you configure AssemblyAI, your integration tests should verify that AssemblyAI-specific artifacts appear in the output — not just that transcription occurred.

**Treat missing integrations as hard errors in your own layer.** If your system requires a specific provider, validate that the provider's API key is configured and functional *before* writing the assistant config. Don't delegate that validation to the downstream API — it has already shown you it won't enforce it.

**Advocate loudly for explicit failure.** File the bug report. Request the feature. The vendor's incentive to silently fall back only persists as long as customers tolerate it. A 409 Conflict or a 422 with a message like "AssemblyAI transcriber requires a configured API key" would have made this a five-minute fix instead of a forensic investigation.

## What Success Should Mean

The HTTP 200 status code means "OK." The specification defines it as: the request has succeeded. But *succeeded* is doing a lot of work in that sentence. In a world of multi-provider orchestration, model routing, and layered abstraction, success cannot mean merely "I accepted your input and didn't crash." It has to mean "I will do what you asked, or I will tell you why I can't."

The most dangerous API errors are the ones that look like success. They don't page you at 3 AM. They don't show up in error budgets. They don't trigger circuit breakers. They just quietly do the wrong thing, over and over, until someone notices — if someone notices. The polite lie isn't a convenience. It's a trap. And the only reliable defense is to stop trusting the response and start verifying the behavior.

The API that lies to you politely is betting you won't check. Build systems that always check.
