#!/bin/bash

# SessionStart hook - Inject concise session context
# Part of tailor-nano

# Time with timezone and day
TIME=$(date '+%H:%M %Z (%a)')

# Locale (fallback to 'unknown')
LOCALE=${LANG:-unknown}

# Git status (only if in a git repo)
if git rev-parse --git-dir > /dev/null 2>&1; then
  BRANCH=$(git branch --show-current 2>/dev/null)
  # If branch is empty, we're in detached HEAD
  if [ -z "$BRANCH" ]; then
    BRANCH="detached"
  fi

  # Check if working tree is clean
  if git diff-index --quiet HEAD -- 2>/dev/null; then
    DIRTY="clean"
  else
    DIRTY="dirty"
  fi

  # Check commits ahead of upstream
  AHEAD=$(git rev-list --count @{upstream}..HEAD 2>/dev/null || echo "0")

  # Build git status string
  GIT_STATUS="$BRANCH ($DIRTY)"
  if [ "$AHEAD" != "0" ]; then
    GIT_STATUS="$GIT_STATUS ↑$AHEAD"
  fi
else
  GIT_STATUS="no repo"
fi

# Recent checkpoints (progress files)
CHECKPOINTS=""
MEMORY_DIR=".claude-tailor/memory"
if [ -d "$MEMORY_DIR" ]; then
  # Get 3 most recent progress files with time ago
  for f in $(ls -t "$MEMORY_DIR"/progress-*.jsonl 2>/dev/null | head -3); do
    if [ -f "$f" ]; then
      NAME=$(basename "$f" .jsonl | sed 's/progress-//')
      # Calculate time ago
      MOD_TIME=$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null)
      NOW=$(date +%s)
      DIFF=$((NOW - MOD_TIME))
      if [ $DIFF -lt 3600 ]; then
        AGO="$((DIFF / 60))m ago"
      elif [ $DIFF -lt 86400 ]; then
        AGO="$((DIFF / 3600))h ago"
      else
        AGO="$((DIFF / 86400))d ago"
      fi
      CHECKPOINTS="$CHECKPOINTS $NAME($AGO)"
    fi
  done
fi

# Build context string
CONTEXT="Time: $TIME | Git: $GIT_STATUS"
if [ -n "$CHECKPOINTS" ]; then
  CONTEXT="$CONTEXT | Marks:$CHECKPOINTS"
elif [ -d "$MEMORY_DIR" ]; then
  CONTEXT="$CONTEXT | Marks: none (use /mark <name> to save)"
fi

# Output JSON with systemMessage (visible) and additionalContext (for Claude)
cat <<EOF
{
  "systemMessage": "📍 $CONTEXT",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "$CONTEXT"
  }
}
EOF

exit 0
