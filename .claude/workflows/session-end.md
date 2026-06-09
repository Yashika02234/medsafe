# Workflow: Session End

## Before Ending Any Session, Claude MUST:

1. **Update `_state.md`:**
   - Mark completed tasks as done
   - Update "Current Task" to reflect where we stopped
   - Add any new decisions to "Recent Decisions"
   - Log any open questions
   - Add session to "Session Log" with date and summary

2. **Update memory files if relevant:**
   - architecture.md → if any architecture decisions changed
   - coding-rules.md → if any new coding patterns established
   - defects.md → if any mistakes were repeated
   - design-system.md → if any UI decisions were made
   - security.md → if any security decisions were made

3. **Verify no loose ends:**
   - Are there any TODO comments in code that need tracking?
   - Are there any failing tests?
   - Are there any unresolved questions?

## Session End Prompt

```
Session is ending. Before we stop:
1. Update _state.md with everything completed this session
2. Update any changed memory files
3. List any open items for next session
4. Write a 2-3 line summary of what was accomplished
```
