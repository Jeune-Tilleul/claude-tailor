---
description: Run tests and verify current state
---

# Test

Run project tests and show current state summary.

## What to do

1. **Detect test runner** (check package.json or common patterns):
   - `npm test` (Node.js)
   - `pytest` (Python)
   - `go test ./...` (Go)
   - `cargo test` (Rust)
   - Or ask user if unclear

2. **Run tests**:
```bash
npm test 2>&1 | tail -30
```

3. **Show git status**:
```bash
git diff --stat
git status --short
```

4. **Summarize results**:
```
🧪 Test Results

Tests: 48 passed, 2 failed
Files changed: 3 (src/auth.js, src/utils.js, test/auth.test.js)
Git: 2 files staged, 1 unstaged

Failed tests:
  • auth.test.js:45 - "should validate token"
  • auth.test.js:62 - "should refresh expired token"

Ready to commit: No (tests failing)
```

## Guidelines

- Always show test output (pass or fail)
- Always show what files changed
- Be clear about commit-readiness
- If tests fail, offer to investigate/fix
