# Reusable Prompts — MedSafe

---

## 1. Session Start (Use Every New Chat)

```
Read CLAUDE.md and _state.md.
Summarize current project state.
Identify current phase.
Identify next highest priority task.
Create an implementation plan.
Do not write code until the plan is approved.
Follow project workflow and update documentation after completion.
```

## 2. Session Start After a Break (1+ Weeks)

```
Read CLAUDE.md and _state.md.
It has been [X] days since the last session.
Read all memory files carefully before proceeding.
Do not assume anything — verify against project files.
Summarize current project state.
Identify current phase and next task.
Create a plan. Do not code until approved.
```

## 3. Planning a Feature

```
I want to implement: [FEATURE NAME]

Act as the Planner agent (read .claude/agents/planner.md).
Read the relevant memory files.
Create a step-by-step implementation plan.
Include: steps, dependencies, risks, files to create/modify.
Do NOT write code. Plan only.
Save plan to .claude/outputs/phase-XX/plan-[feature].md
```

## 4. Implementing After Plan Approval

```
The plan is approved. Proceed with implementation.

Act as the Implementer agent (read .claude/agents/implementer.md).
Follow the plan exactly.
Follow coding-rules.md and tech-stack.md.
Implement step by step.
Do not deviate from the plan without flagging it.
```

## 5. Code Review

```
Implementation is complete. Review the changes.

Act as the Reviewer agent (read .claude/agents/reviewer.md).
Check: correctness, coding standards, architecture compliance,
security, medical responsibility, performance, duplication.
List any issues (blocking vs non-blocking).
```

## 6. Debugging

```
There is a bug: [DESCRIBE BUG]

Steps to reproduce: [STEPS]
Expected behavior: [EXPECTED]
Actual behavior: [ACTUAL]

Read defects.md — has this pattern happened before?
Identify root cause. Fix the root cause, not the symptom.
If it's a new pattern, log it in defects.md.
```

## 7. Session End

```
Session is ending. Before we stop:
1. Update _state.md with everything completed this session
2. Update any changed memory files
3. List any open items for next session
4. Write a 2-3 line summary of what was accomplished
```

## 8. Phase Completion

```
Phase [X] is complete. Before moving to Phase [X+1]:
1. Update _state.md — mark phase as complete
2. Review all memory files — any updates needed?
3. Verify Definition of Done from implementation-roadmap.md
4. Run manual testing checklist from testing.md
5. Summarize what was built and any deviations from plan
6. Identify any technical debt to address later
```

## 9. Design System Update

```
I have the design ideology ready. Here it is:
[PASTE DESIGN SYSTEM]

Update .claude/memory/design-system.md with this.
Replace all placeholder sections.
Mark STATUS as FINALIZED.
Identify any conflicts with existing implementation.
```

## 10. Adding a New Package

```
I want to add: [PACKAGE NAME]

Before adding:
1. Why is it needed? What problem does it solve?
2. Can existing dependencies handle this?
3. What is the bundle size impact?
4. Is it actively maintained?
5. Is it free?

If justified, add to tech-stack.md with rationale.
```
