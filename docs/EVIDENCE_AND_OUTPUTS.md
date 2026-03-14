# EVIDENCE AND OUTPUTS

This document defines the evidence system required before review.

## Canonical evidence folder

Inside the MC-MONKEYS installation, the evidence root is:
- `outputs/`

If the package is extracted into a folder named `MCLUCY`, the effective path becomes:
- `MCLUCY/outputs/`

## Per-ticket convention

Each task should have its own folder:
- `outputs/{ticket-id}/`

Ticket ID format is canonical and sequential:
- `task-001`, `task-002`, `task-014`, ...

Each ticket folder contains two fixed subfolders:
- `outputs/{ticket-id}/input/`
- `outputs/{ticket-id}/output/`

Examples:
- `outputs/task-014/input/context.md`
- `outputs/task-014/input/requirements.png`
- `outputs/task-014/output/final-report.md`
- `outputs/task-014/output/screenshots/board.png`
- `outputs/task-014/output/commit-links.md`

## Allowed evidence types

Typical deliverables include:
- research notes
- reports
- screenshots
- generated images
- photos
- videos
- assets
- code artifacts
- structured data
- summaries for review
- links to Drive documents
- links to GitHub commits/PRs
- code snippets and technical notes

Preferred textual format:
- Markdown (`.md`)

## Minimum rule before review

A task must not be moved to `REVIEW` unless evidence exists in the ticket `output` folder.

Operational check:
- output is saved under `outputs/{ticket-id}/output/`
- file paths are known
- evidence is sufficient for a human to review the work
- at least one file exists inside `output/` (or nested under it)

## Lifecycle rule

All tasks must pass through `REVIEW` before `DONE`.
Direct transitions from `IN_PROGRESS` (or any other status) to `DONE` are rejected.

## Collaboration model

Multiple agents may contribute to the same ticket folder.
The ticket folder is the shared evidence container for that task.

## Naming guidance

Suggested file names:
- `research.md`
- `analysis.md`
- `execution-notes.md`
- `final-report.md`
- `review-notes.md`

Suggested subfolders:
- `screenshots/`
- `assets/`
- `data/`

## Human review expectation

When requesting review, the agent should be able to point to the evidence location clearly.
Example:
- `outputs/task-221/output/market-research.md`

No evidence means no review request.
