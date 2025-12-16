# tailor-nano Demo

Quick demonstration of what tailor-nano does.

## Installation (30 seconds)

```bash
cd /home/juju/projects/my-project
node /path/to/tailor-nano/install.js
```

Output:
```
Installing tailor-nano...
Created CLAUDE.md
Registered hook in settings.local.json

Installation complete!
Restart Claude Code to activate.
```

## What Just Happened

Created files:
```
my-project/
├── CLAUDE.md                           # Research-backed patterns
├── .claude/
│   ├── commands/nano-status.md         # New command
│   └── settings.local.json             # Hook registered
└── .claude-tailor/
    ├── hook.js                         # Error capture
    └── memory/
        └── reflections.jsonl           # Empty (initially)
```

## Usage Example

### 1. Normal Work (Automatic Error Capture)

You: "Add authentication to the API"

Claude generates code with a bug:
```javascript
function authenticate(token) {
  const decoded = jwt.verify(token);  // Missing secret!
  return decoded;
}
```

Error occurs:
```
Error: secretOrPrivateKey must have a value
```

Hook automatically captures this to `reflections.jsonl`:
```json
{"id":"nano-1702584632-abc12","ts":"2024-12-14T22:10:32Z","error_type":"error","snippet":"...jwt.verify(token)...Error: secretOrPrivateKey must have a value..."}
```

### 2. Check Status (Later)

You: `/nano-status`

Output:
```
Error Patterns (tailor-nano)

Top 5 patterns:
  error: 3
  typeerror: 2
  enoent: 1

Total errors: 6
Last error: 12/14/2024, 10:32:15 PM (error)
```

### 3. Patterns Guide You (Automatically)

When Claude reads `CLAUDE.md` before responding, it sees:

> ## Test-Driven Repair
> For bugs, write a FAILING test that reproduces the issue BEFORE fixing.

Result: Better debugging approach automatically applied.

## Real Example: Before vs After

### Before tailor-nano

You: "Fix the authentication bug"

Claude:
```
Let me analyze the issue... [3 paragraphs]
I think the problem is... [2 paragraphs]
Here's my proposed solution... [code]
```

Often misses edge cases, verbose explanations.

### After tailor-nano

You: "Fix the authentication bug"

Claude (guided by Code-First Reasoning pattern):
```javascript
// Fixed version
function authenticate(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.verify(token, secret);
}

// Test that reproduces the bug
test('authenticate throws when JWT_SECRET missing', () => {
  delete process.env.JWT_SECRET;
  expect(() => authenticate('token')).toThrow('JWT_SECRET not configured');
});
```

Why this approach works: [brief explanation]

**Difference**: Code first, concise explanation after, includes test.

## Patterns Impact

Based on research citations in CLAUDE.md:

| Pattern | Source | Measured Impact |
|---------|--------|-----------------|
| Code-First Reasoning | ICML 2024 | +10-15% success rate |
| Test-Driven Repair | arXiv:2411.10213 | 76.8% bug detection (vs 45% ad-hoc) |
| Iteration Abandonment | Repeton | Prevents wasted effort on stuck approaches |
| Layered Verification | arXiv 2025 | -50% false positives in reviews |

## What It Doesn't Do

- No automatic fixes (you still drive)
- No complex infrastructure (just patterns + memory)
- No LLM calls (patterns are static, hook is passive)
- No magic (just research-backed best practices)

## Philosophy

You get:
- 6 proven patterns immediately
- Silent error tracking for learning
- Zero maintenance overhead

You don't get:
- Auto-evolution complexity
- Infrastructure to manage
- Ongoing LLM costs

**Trade-off**: Manual pattern updates vs automatic evolution.
**Benefit**: Understandable, maintainable, deployable today.

## Next Steps

1. Work normally in Claude Code
2. Patterns guide Claude's responses automatically
3. Check `/nano-status` occasionally for insights
4. Update `CLAUDE.md` with project-specific learnings

That's it. Simple, effective, research-backed.
