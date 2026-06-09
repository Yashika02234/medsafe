# Workflow: Session Start

## Use This Prompt Every New Session

```
Read CLAUDE.md and _state.md.
Summarize current project state.
Identify current phase.
Identify next highest priority task.
Create an implementation plan.
Do not write code until the plan is approved.
Follow project workflow and update documentation after completion.
```

## What Claude Should Do

1. Read CLAUDE.md → follow file reading order
2. Read _state.md → understand current phase, completed work, next tasks
3. Summarize in 3-5 bullet points: where we are, what's done, what's next
4. Propose the next task with a brief plan
5. WAIT for approval before any implementation

## After a Break (1+ weeks)

Add to the session start prompt:
```
It has been [X] days since the last session.
Read all memory files carefully before proceeding.
Do not assume anything from memory — verify against project files.
```
