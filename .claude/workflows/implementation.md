# Workflow: Implementation & Review

## Implementation Flow

```
Plan (Planner Agent)
  ↓
Approve (Human)
  ↓
Implement (Implementer Agent)
  ↓
Review (Reviewer Agent)
  ↓
Fix Issues (if any)
  ↓
Test (Manual + Automated)
  ↓
Document (Update state + memory files)
  ↓
Commit
```

## Rules

- NEVER skip the planning step
- NEVER implement without approval
- NEVER skip the review step
- NEVER commit without updating _state.md
- If implementation deviates from plan, STOP and flag it

## Debugging Workflow

When a bug is found:
1. Reproduce the bug
2. Identify root cause (don't guess — read the code)
3. Check defects.md — has this pattern happened before?
4. Fix the root cause, not the symptom
5. If it's a new pattern, log it in defects.md
6. Verify the fix doesn't break anything else
