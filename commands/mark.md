---
description: Save/restore session progress for context continuity
---

# Mark

Save or restore session progress to maintain context across conversations.

## Usage

```
/mark <name>           # Save current progress OR restore if exists
/mark                  # List available marks
```

## When saving (new or append)

Create/append to `.claude-tailor/memory/progress-<name>.jsonl`

**Write a single JSONL entry with:**

```json
{
  "ts": "ISO timestamp",
  "summary": "One-line description of session state",
  "completed": ["action 1 done", "action 2 done"],
  "in_progress": "Current task if any",
  "next_steps": ["planned action 1", "planned action 2"],
  "key_files": ["path/to/modified.js", "path/to/created.ts"],
  "decisions": ["chose X over Y because Z"],
  "findings": ["discovered that API returns X", "config is in Y"],
  "blockers": ["waiting for X", "need clarification on Y"]
}
```

**Content guidelines:**
- Be CONCISE - this will be read by an amnesic LLM
- Include file paths, repo names, git actions
- Include research findings and decisions made
- EXCLUDE: failed attempts, verbose explanations, obvious info
- EXCLUDE: conversation filler, repeated info from previous marks
- Each entry should stand alone as context snapshot

## When restoring (file exists)

1. Read: `tail -3 .claude-tailor/memory/progress-<name>.jsonl`
2. Parse the JSON entries
3. Summarize the context to understand:
   - What was requested by user
   - What was done / not done
   - What was in progress
   - What are next steps
4. Ask user how to continue or wait for their instruction

## When listing (no name given)

```bash
ls -t .claude-tailor/memory/progress-*.jsonl 2>/dev/null | head -5
```

Show available marks with modification time.

## After saving

Confirm with short response:
```
✓ Mark saved: progress-<name>.jsonl (X lines)
```

## Example

**User:** `/mark auth-feature`

**If new:** Create file, write first entry based on current session context.

**If exists:** Read last entries, summarize what was done, ask how to continue.
