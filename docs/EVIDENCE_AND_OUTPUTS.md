# EVIDENCE AND OUTPUTS

This document defines the evidence system required before review.

## Canonical evidence folder

Inside the MC Lucy installation, the evidence root is:
- `outputs/`

If the package is extracted into a folder named `MCLUCY`, the effective path becomes:
- `MCLUCY/outputs/`

## Per-ticket convention

Each task should have its own folder:
- `outputs/{ticket-id}/`

Examples:
- `outputs/TASK-142/research.md`
- `outputs/TASK-142/final-report.md`
- `outputs/TASK-142/screenshots/`
- `outputs/TASK-142/assets/`
- `outputs/TASK-142/data/`

## Allowed evidence types

Typical deliverables include:
- research notes
- reports
- screenshots
- generated images
- assets
- code artifacts
- structured data
- summaries for review

Preferred textual format:
- Markdown (`.md`)

## Minimum rule before review

A task must not be moved to `REVIEW` unless evidence exists in the ticket folder.

Operational check:
- output is saved
- file paths are known
- evidence is sufficient for a human to review the work

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
- `outputs/TASK-221/market-research.md`

No evidence means no review request.
