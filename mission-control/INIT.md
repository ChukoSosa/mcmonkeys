# MC LUCY Mission Control Initialization Guide

## Mission Control Purpose
Mission Control coordinates agent work through explicit tasks, subtasks, and activity tracking.
It is the operating layer that transforms incoming requests into structured execution plans.

## Mission Control As Source Of Truth
Mission Control is the authoritative record for operational work.
No work should be considered active unless it exists in Mission Control.
All planning, execution state, and completion status must be reflected here.

## Task Methodology
Every piece of work must exist as a task.
Tasks should have clear outcomes, owners when available, and status updates over time.
Tasks are decomposed into actionable subtasks that guide implementation.

## Subtask Decomposition Rules
Each task must contain 5 to 10 subtasks.
Each subtask should represent roughly 5 to 20 minutes of focused work.
Subtasks should be specific, verifiable, and ordered to reduce ambiguity.

## Agent Assignment Rules
When possible, tasks must be assigned to a responsible agent.
Subtasks can be distributed among agents, but ownership should remain clear.
If no agent can be determined immediately, create the task first and assign as soon as discovery completes.

## Execution Workflow
1. Capture or receive incoming request.
2. Create a Mission Control task with explicit objective.
3. Decompose into 5 to 10 subtasks (5 to 20 minutes each).
4. Assign agents when possible.
5. Execute subtasks and update task state.
6. Validate completion criteria and close task.

## Activity And Logging Expectations
Agents must report progress through Mission Control activity events.
Important milestones, blockers, and decisions must be logged.
Completion should include evidence through activity traces or related updates.

## Required Operational Rules
- Every piece of work must exist as a task.
- Every task must contain 5 to 10 subtasks.
- Subtasks should represent 5 to 20 minutes of work.
- Tasks must be assigned to an agent when possible.
- Agents must report progress via activity events.

## Bootstrap Operator Notes
The onboarding task is intended for the main OpenClaw operator agent (for example, Claudio).
The main agent should read this guide, execute onboarding subtasks, and configure the environment.
Mission Control is considered fully ready only after onboarding subtasks are complete.
