---
description: Search past errors and learnings from memory
---

# Recall

Search the project's error memory for past mistakes and learnings.

## Usage

```
/recall <keyword>              # Search for one keyword
/recall <kw1> <kw2> <kw3>      # Search for multiple keywords (OR)
/recall                        # Show 5 most recent errors
```

## How to search

```bash
# Single keyword
grep -i "keyword" .claude-tailor/memory/reflections.jsonl | tail -5

# Multiple keywords (OR match)
grep -iE "kw1|kw2|kw3" .claude-tailor/memory/reflections.jsonl | tail -5

# No keyword - recent errors
tail -5 .claude-tailor/memory/reflections.jsonl
```

## What to do with results

1. Parse each JSON line
2. Summarize findings:
   - Error types encountered
   - Root causes identified
   - Fixes that worked
   - Patterns to avoid

3. Present as actionable context:
```
📚 Found 3 related errors:

1. TypeError in task-manager.js (2 days ago)
   Cause: Accessing undefined property
   Fix: Added null check

2. ENOENT in storage.js (3 days ago)
   Cause: Directory didn't exist
   Fix: Added mkdirSync recursive

Pattern: Both relate to missing validation before access
```

## When to use

- BEFORE working on a file/module: `/recall auth` `/recall storage`
- BEFORE implementing a feature: `/recall validation` `/recall error-handling`
- When hitting a familiar error: `/recall TypeError` `/recall ENOENT`

## If no results

```
No past errors found for "keyword". Memory will build as you work.
```
