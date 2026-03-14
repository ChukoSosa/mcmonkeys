# MISSION CONTROL OVERVIEW

MC-MONKEYS is the operating layer that coordinates agents, tasks, evidence, and reviews inside a single Mission Control workflow.

## Source of truth

MC-MONKEYS is the source of truth for:
- active tasks
- task status
- subtask progress
- agent state
- comments and review requests
- activity feed and system events

If work is not reflected in MC-MONKEYS, it is not considered operationally complete.

## Core operating model

MC-MONKEYS runs as a local Mission Control server with:
- dashboard and office UI
- local API under `/api`
- PostgreSQL database
- SSE event stream for real-time coordination

OpenClaw and other agents operate through this system, not outside of it.

## Governance rules

Agents must:
- work from tasks
- keep status updated
- split work into subtasks when useful
- save outputs as evidence
- request review before completion
- wait for human approval before final closure

## Canonical task lifecycle for this version

Task states:
- `BACKLOG`
- `IN_PROGRESS`
- `REVIEW`
- `DONE`
- `BLOCKED`

Important:
- In this version, `REVIEW` is the equivalent of `READY_FOR_REVIEW`.
- `TODO` is not a task state in MC-MONKEYS V1.

## Canonical subtask lifecycle for this version

Subtask states:
- `TODO`
- `DOING`
- `DONE`
- `BLOCKED`

## Human approval model

Only humans decide final acceptance.

Expected flow:
- agent starts work -> `IN_PROGRESS`
- agent completes deliverables and saves evidence -> `REVIEW`
- human approves -> `DONE`
- human requests changes -> back to `IN_PROGRESS`

## What MC-MONKEYS coordinates

MC-MONKEYS is responsible for:
- tracking all active work
- monitoring agents
- exposing API endpoints for automation
- logging operational activity
- keeping review flow visible
- making blockers and missing context explicit

## Required companion documents

Before operating, the agent must also read:
- `WORKFLOW_GUIDE.md`
- `TASK_SYSTEM.md`
- `MCLUCY_API_MANUAL.md`
- `EVIDENCE_AND_OUTPUTS.md`
