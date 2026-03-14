# TASK SYSTEM

This document defines how tasks and subtasks work in MC-MONKEYS V1.

## Tasks

A task represents a unit of mission work.
Each task should have:
- a clear title
- a description
- a status
- an expected output
- evidence saved before review

## Task lifecycle

Canonical task states:
- `BACKLOG`
- `IN_PROGRESS`
- `REVIEW`
- `DONE`
- `BLOCKED`

State meaning:
- `BACKLOG`: defined but not yet being executed
- `IN_PROGRESS`: active execution is happening
- `REVIEW`: work is complete and waiting for human validation
- `DONE`: approved and closed
- `BLOCKED`: cannot continue without help or missing input

Important compatibility note:
- In this version, `REVIEW` is the equivalent of `READY_FOR_REVIEW`.

## Subtasks

Subtasks are used for granular progress tracking.
Whenever possible, a task should be decomposed into 3 to 5 subtasks.
In more complex cases, up to 10 subtasks is acceptable.

Canonical subtask states:
- `TODO`
- `DOING`
- `DONE`
- `BLOCKED`

## Execution rules

When work begins:
- task -> `IN_PROGRESS`
- relevant subtasks -> `DOING`

When deliverables are complete:
- all finished subtasks -> `DONE`
- task -> `REVIEW`

When human approval is received:
- task -> `DONE`

When revisions are requested:
- task -> `IN_PROGRESS`
- create or reopen subtasks as needed

## Output definition

Before execution starts, the agent should know what output will be produced.
Possible outputs include:
- document
- report
- research
- screenshots
- images
- code
- assets
- structured data

If expected output is unclear, escalate and ask for clarification.

## Review gate

No task should enter `REVIEW` unless:
- the expected output exists
- evidence is saved in the ticket folder
- the task is operationally complete enough for human review

## Human authority

Humans approve final closure.
Agents can prepare work, request review, respond to feedback, and continue iterations.
Agents do not own the final acceptance decision.
