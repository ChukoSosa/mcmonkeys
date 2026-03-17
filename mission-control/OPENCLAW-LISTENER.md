# OpenClaw Comment Listener — Setup & Operating Instructions

## Purpose

The Comment Listener is a **mandatory always-on daemon** that runs inside OpenClaw immediately after startup.  
Its job is to detect new human comments on Mission Control tasks in real time and make OpenClaw Main read and reply with coherent reasoning.

---

## Required Startup Behavior

When OpenClaw initializes, it **must** launch the Comment Listener as a persistent background process before accepting any other work.  
The listener must remain running for the entire agent lifecycle and auto-recover from disconnections.

```
[OpenClaw Boot Sequence]
1. Connect to Mission Control API
2. Confirm system state = READY  (GET /api/system/state)
3. Launch comment-listener daemon  ← mandatory
4. Register AgentRoutine heartbeat
5. Begin normal task execution
```

---

## Architecture: SSE Primary + Polling Fallback

The listener has two modes. It always starts in SSE mode and falls back to polling automatically.

```
┌─────────────────────────────────────────────────────────────┐
│  OpenClaw Comment Listener                                   │
│                                                              │
│  ┌─────────────────┐    fails/disconnects                   │
│  │  SSE Mode       │ ─────────────────────────►             │
│  │  /api/events    │                            ┌──────────┐│
│  │  always-first   │ ◄─────────────────────────  Reconnect ││
│  └─────────────────┘    success (backoff)       └──────────┘│
│         │ no SSE after 30s                                   │
│         ▼                                                    │
│  ┌─────────────────┐                                         │
│  │  Polling Mode   │  GET /api/comments/changes?since=...   │
│  │  fallback only  │  every POLL_INTERVAL_MS                 │
│  └─────────────────┘                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## SSE Mode (Primary)

Connect to the Mission Control event stream and listen for `task.comment.created` events.

### Endpoint
```
GET {MC_BASE_URL}/api/events
Accept: text/event-stream
```

### Relevant Events
| Event name | When it fires | Action required |
|---|---|---|
| `task.comment.created` | A human created a comment on any task | Process immediately: read context + reason + reply |
| `task.comment.answered` | Main posted a reply | Update internal state only |
| `run.updated` | A background run changed status | Log / update heartbeat |

### Processing Logic (pseudo-code)
```ts
eventSource.on("task.comment.created", (event) => {
  const { commentId, taskId, authorType, newCommentFlag } = event.data;

  // Anti-loop: never process agent/system comments
  if (authorType !== "human") return;
  if (!newCommentFlag) return;

  // Idempotency: skip if already processed for this commentId
  if (alreadyProcessed(commentId)) return;

  markProcessed(commentId);
  processComment({ taskId, commentId });
});
```

### Auto-Reconnect
On any SSE error or close:
1. Wait `reconnectDelay` (start at 1 s, double each attempt, cap at 30 s)
2. Re-open `EventSource`
3. After reconnect, **always call polling catch-up** once to fetch missed events

---

## Polling Mode (Fallback)

Used when SSE is unavailable or immediately after reconnect to catch up on missed events.

### Endpoint
```
GET {MC_BASE_URL}/api/comments/changes?since={ISO_TIMESTAMP}&limit=50
```

### Cursor Persistence
Store `latestCursor` locally (file, env var, or agent memory).  
Initialize to current UTC time on first run to avoid replaying old history.

```
GET /api/comments/changes?since=2026-03-12T10:00:00.000Z&limit=50

Response:
{
  "comments": [...],
  "latestCursor": "2026-03-12T10:05:33.221Z",
  "count": 3,
  "hasMore": false
}
```

Save `latestCursor` after every successful poll. If `hasMore = true`, immediately poll again with the new cursor before waiting the next interval.

### Default Intervals
| Config key | Default | Description |
|---|---|---|
| `POLL_INTERVAL_MS` | `15000` | Milliseconds between polls in fallback mode |
| `SSE_RECONNECT_MAX_MS` | `30000` | Max delay before switching to polling |
| `MAX_CATCH_UP_PAGES` | `10` | Max consecutive pages when `hasMore = true` |

---

## Processing A New Comment (OpenClaw Main)

When a new human comment is detected (via SSE or polling), OpenClaw Main must process it directly.

### Required processing flow
1. Read task context:

```
GET {MC_BASE_URL}/api/tasks/{taskId}
GET {MC_BASE_URL}/api/tasks/{taskId}/comments
GET {MC_BASE_URL}/api/tasks/{taskId}/subtasks
```

2. Identify the specific comment by `commentId`.
3. Reason over full context (task + subtasks + thread history).
4. Decide whether to:
   - reply with clarification/confirmation,
   - apply an operational action (for example task status change),
   - request more information from the operator (including Telegram escalation if needed).
5. Post a coherent response comment as `authorType="agent"`.

### Optional operational action examples

```
PATCH {MC_BASE_URL}/api/tasks/{taskId}
{
  "status": "DONE"
}
```

Only perform state transitions that are explicitly supported by Mission Control.

### Manual re-trigger (if needed)

If a comment was missed, post a new human comment to re-trigger the listener flow:

```
POST {MC_BASE_URL}/api/tasks/{taskId}/comments
Content-Type: application/json

{
  "body": "Please re-review: {original comment text}",
  "authorType": "human",
  "authorId": "{operatorId}"
}
```

This emits a new `task.comment.created` signal and must be processed by OpenClaw.

---

## mcLucy Backlog Health Review (Manual Trigger)

mcLucy can run a backlog health cycle on demand to validate Gold Rules and raise flags for OpenClaw Main.

### Endpoint
```
POST {MC_BASE_URL}/api/tasks/backlog-review
Content-Type: application/json

{
  "dryRun": false,
  "limit": 100
}
```

### What this run does
1. Scans BACKLOG tasks.
2. Validates readiness (title clarity, min subtasks, Input section, Output section).
3. Creates a task comment flag from mcLucy when non-compliant.
4. Emits activity/events so OpenClaw can detect and act.
5. If pending human response exceeds 30 minutes, moves task to BLOCKED.

### OpenClaw clear contract
Only OpenClaw Main clears mcLucy flags. After fixing the card, OpenClaw must post a comment including:

```
[mclucy-clear:{fingerprint}]
```

The fingerprint is included in the original mcLucy flag comment.

---

## AgentRoutine Registration

Register the listener as an `AgentRoutine` on startup so MC can track its health:

```
PATCH {MC_BASE_URL}/api/agents/{agentId}/routines/comment-listener
{
  "name": "comment-listener",
  "frequency": "continuous",
  "lastRunStatus": "RUNNING",
  "nextRunAt": null
}
```

Update `lastRunStatus` to `"ERROR"` if the listener crashes and `"RUNNING"` when it recovers.

---

## Anti-Loop Rules (Non-Negotiable)

The following rules **must** be enforced in the listener at all times:

1. **Never dispatch a review for a comment where `authorType` is `agent` or `system`.**
2. **Never post a comment in response to another agent comment** (MC enforces this server-side too, but the listener is the first line of defense).
3. **Never re-process the same `commentId` more than once.**  
  Keep a processed comment id cache with persistence across restarts.

---

## Observability

| What to monitor | How |
|---|---|
| Listener alive | `AgentRoutine.lastRunStatus = "RUNNING"` heartbeat every 60 s |
| SSE connected | Log `[listener:sse] connected` with timestamp |
| Poll cycle | Log `[listener:poll] checked since={cursor} found={n}` |
| Comment processing | Log `[listener:process] taskId={id} commentId={id}` |
| Response posted | Log `[listener:reply] taskId={id} commentId={id}` |
| Clarification escalations | Log `[listener:clarify] commentId={id}` and destination |

---

## Quick-Start Checklist

- [ ] `MC_BASE_URL` env var is set  
- [ ] `AGENT_ID` env var is set  
- [ ] `lastSeenCursor` initialized to current UTC time (first run only)  
- [ ] SSE listener started and connected  
- [ ] Polling fallback configured with interval  
- [ ] AgentRoutine heartbeat registered  
- [ ] Anti-loop guard active  
- [ ] Idempotency cache (in-memory or persistent) initialized  
