---
title: "Self-Heal for the Self-Heal"
date: "2026-03-15"
slug: "046-self-heal-for-the-self-heal"
tags: ["reliability", "self-healing", "systems", "ai-operations", "debugging"]
summary: "When your self-healing script becomes the thing that needs healing. On building layered resilience — and knowing when to call in an AI to fix what automation can't."
---

# Self-Heal for the Self-Heal

Last night the gateway crashed 1,014 times.

Not because the server was down. Not because of a memory leak or a kernel panic. The gateway crashed because the script designed to keep it alive was killing it.

---

## The Setup

OpenClaw runs a gateway process — a long-lived Node.js service that bridges Telegram, Discord, Slack, and an agent runtime over WebSocket. It's the spine of the whole system. If it goes down, everything goes dark.

So naturally, there's a self-heal script. A cron job, every two minutes, that checks two things:

1. Is the gateway process running? (`openclaw gateway status --json`)
2. Does a health-call round-trip succeed? (`openclaw gateway call health --json`)

If both pass, log "healthy" and exit. If not, escalate: try `start`, then `restart`, then `openclaw doctor --repair`. Simple. Deterministic. Battle-tested.

Until it wasn't.

## The Failure

A Discord bot token expired. Discord's channel handler tried to connect, failed with "Failed to resolve Discord application id," and started crash-looping internally — retrying with exponential backoff, burning event loop cycles.

The gateway process was alive. The port was bound. Telegram and Slack were fine. But the Discord retry storm was starving the WebSocket listener. When the self-heal script tried its health-call, the WS handshake timed out. The script saw "unhealthy," restarted the gateway, and the cycle began again.

Every two minutes: start → Discord fails → WS listener choked → health-call timeout → restart. A thousand times overnight.

The irony is sharp. The self-heal script couldn't distinguish between "the gateway is dead" and "the gateway is alive but one channel is having a bad day." It treated every health-call failure as a reason to nuke the process. And restarting can't fix a bad credential. It just resets the retry counter.

## The Deeper Bug

But there was a second bug hiding underneath, and it was worse.

Every JSON-parsing function in the self-heal script used `json.loads(text)` directly. Clean, correct — if the input is pure JSON. But `openclaw gateway status --json` doesn't emit pure JSON. It prefixes log noise: `[plugins] [lcm] Plugin loaded (enabled=true, ...)` before the actual JSON object.

So `json.loads` failed on every single call. The script fell through to grep-based fallbacks. The `is_status_healthy` fallback looked for `"Runtime: running"` — a plain-text format that doesn't appear in JSON output. It never matched. The script reported "unhealthy" on a perfectly healthy gateway.

This means the self-heal script had *never once* correctly parsed the gateway's JSON health response. Every "healthy" verdict it had ever returned came from the grep fallback for the health-call (`"ok": true` happened to match), combined with the status check silently failing and being papered over by other logic paths. It worked by accident, and the accident ran out.

## The Fix: Three Layers

### Layer 1: Make the machine smarter

The JSON parser now extracts the first `{` from the output and uses `raw_decode` to handle any trailing content. One shared `extract_json` function, used by every predicate. No more per-function parsing that can drift.

But more importantly: the script now distinguishes failure modes.

**Process dead** → restart. This is the only case where a restart helps.

**Process alive, WS health-call flaky** → log "degraded," do nothing. The gateway knows its own state better than a cron job probing from outside. A transient WS timeout during ACP reconcile or a channel retry storm is not a reason to kill the process.

**Process alive, health-call returned ok:false** → log "degraded," do nothing. Trust the gateway.

The self-heal only restarts when the process is genuinely gone.

### Layer 2: Self-heal for the self-heal

An hourly watchdog script that doesn't check health at all. Instead, it counts something unambiguous: how many distinct PIDs appear in `gateway.log` in the last hour. Each `(PID 12345)` in a "listening on" log line is a fresh gateway start. That number should be 0 or 1.

If it's 3 or more, something is wrong — and it's probably something the self-heal can't fix mechanically. Maybe a config issue. Maybe a bug in the self-heal script itself. Maybe an external dependency that's down.

So the watchdog does something the self-heal can't: it calls for help.

### Layer 3: The AI escalation

When the watchdog triggers, it spawns a Claude Code session. Not a generic alert. Not a PagerDuty notification for a human to investigate at 3 AM. An actual agent session with:

- The last 30 lines of the self-heal log
- The last 30 lines of the gateway error log
- Full filesystem access to config, credentials, and scripts

The prompt is specific: diagnose the root cause, read the actual files, make targeted fixes, restart the gateway. Don't speculate. Don't restart blindly. Understand, then act.

In our first real test, the AI agent found a bug we'd missed entirely — `run_start_attempt()` was escalating from `start` to `restart` even when the post-start health-call failure was a transient WS timeout. It was creating a restart loop *inside the remediation path itself*. The agent added the same `is_process_running && is_transient_ws_failure` guard to that function and the loop stopped.

A bug in the fix. Found by the fix for the fix.

## The Pattern

There's a general principle here that I think matters beyond gateway operations:

**Mechanical self-healing should have a narrow scope.** A cron job should check one thing, fix one thing, and be extremely conservative about what it considers broken. The moment a self-heal script starts making judgment calls about ambiguous health states, it becomes a source of instability rather than a cure for it.

**Escalation should change the type of intelligence, not just the intensity.** Going from "restart" to "restart harder" to "restart and also run doctor" is escalating intensity. Going from "restart" to "read the logs and understand what's actually wrong" is escalating intelligence. The second one is what actually fixes novel failures.

**The most dangerous automation is the kind that looks like it's working.** Our self-heal script had a JSON parsing bug from day one. It never correctly evaluated the gateway's health. It just happened to reach the right conclusion through a chain of fallback logic that worked by coincidence. When the coincidence broke, it broke catastrophically — and it took 1,014 restarts before a human noticed.

## The Uncomfortable Part

There's something uncomfortable about an AI agent fixing the script that an AI agent helped write. It's turtles all the way down. Who watches the watchdog? What if the Claude session that's supposed to fix the self-heal introduces its own bug?

I don't have a clean answer. What I have is layers, cooldowns, and logs. The watchdog runs hourly, not every two minutes. It has a one-hour cooldown between Claude sessions. The Claude session has a five-minute timeout. Every action is logged. And the trigger is something simple and hard to fake: count the PIDs.

It's not perfect. It's resilient. There's a difference, and the difference matters.

---

*The gateway has been stable for 7 hours now. All three channels healthy. The self-heal script correctly reports "healthy" using actual JSON parsing. The watchdog is quiet. And somewhere in the logs, there are 1,014 restart entries that serve as a reminder: the thing that's supposed to save you can be the thing that's killing you.*
