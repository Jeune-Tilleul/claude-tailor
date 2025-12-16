# tailor-nano

**Persistent AI patterns + error memory for Claude Code.** Without the complexity.

> LLMs forget their instructions after 20 messages. tailor-nano solves this with research-backed patterns that survive sessions + silent error capture + intelligent recall. 280 LOC, zero dependencies.

---

## The Problem

You use Claude Code for development. You load patterns (Test-Driven Repair, Code-First reasoning) into your prompt. Works great at first.

Then after 20-30 messages, Claude forgets those patterns—they fade in the context window. You're back to trial-and-error. And you keep hitting the same bugs because there's no memory of past errors.

This is **Context Degradation Syndrome** ([James Howard, 2024](https://jameshoward.us/2024/11/26/context-degradation-syndrome-when-large-language-models-lose-the-plot)): LLMs lose coherence as context grows. Instructions at the beginning lose importance. Session isolation means zero memory between sessions.

**Result**: Scientifically-proven patterns (ICML 2024: +10-15% success on Code-First) disappear during your work.

---

## The Solution: 3 Pillars

### 1️⃣ Persistent Patterns
Research-backed patterns installed into `CLAUDE.md` at setup. At each session start, `session-start.sh` re-injects them as fresh context. They don't fade because they're **re-injected, not buried in history**.

Decision framework lets Claude automatically route to the right pattern:
- New feature? → SCoT + Code-First
- Bug fix? → Test-Driven Repair
- Complex (3+ approaches)? → Generate 2-3, compare tradeoffs

### 2️⃣ Silent Error Capture
Errors are captured automatically—no friction. `hook.js` normalizes error signatures:
- `TypeError at line 42` + `TypeError at line 157` → same error type (for clustering)
- Append-only JSONL means audit trail, never-rewrite
- Token-efficient: only store structured facts (file, error_type, operation, signature)

### 3️⃣ Intelligent Recall Commands
4 commands query the memory intelligently:

| Command | Purpose | Example |
|---------|---------|---------|
| `/mark <name>` | Save checkpoint (JSONL compact format) | `/mark setup-complete` |
| `/recall <kw>` | Search error history + show co-occurrence patterns | `/recall TypeError` → shows if TypeError+ENOENT always happen together |
| `/test` | Run tests + show git status | `/test` → "3 tests failing; 2 files modified" |
| `/reflect` | Analyze unanalyzed errors for root causes | `/reflect` → "3 TypeError patterns; root cause = missing validation" |

**Token economy**: Mark uses compact JSONL (exclude filler, include decisions/findings). Recall searches structured history instead of re-reading long narratives.

---

## How It Works: Session Flow

```
Session Start
    ↓
    SessionStart hook fires → time + git + marks + reflection hints
    (If >10 reflections pending: "Reflections: 15 pending (run /reflect)")
    ↓
    CLAUDE.md loaded (patterns fresh)
    ↓
You work normally
    ↓
    Error occurs → hook.js captures silently (normalized signature)
    ↓
You hit friction → /recall TypeError
    ↓
    Shows: "You hit TypeError+ENOENT together 3x. Root: missing file check."
    ↓
You hit stuck → Before abandoning, /recall <error> to check memory
    ↓
    If past fix exists → apply it
    If recurring with no fix → root cause is deeper, try orthogonal approach
    ↓
You checkpoint → /mark refactor-attempt-1
    ↓
    Saves: {ts, summary, completed, in_progress, next_steps, decisions}
    ↓
Later: /reflect
    ↓
    Analyzes: "5 TypeError patterns; 3 are validation bugs; 2 are scope issues"
    ↓
Next session
    ↓
    SessionStart re-injects patterns + shows: "Last marks: refactor-attempt-1(2h ago)"
    + Reflection hints if needed
    ↓
    Cycle repeats with accumulated error knowledge
```

**Key insight**: Patterns survive because they're re-injected. Errors accumulate because they're appended. Memory persists because marks are checkpointed. Hints guide you toward solving recurring problems.

---

## Commands Deep Dive

### /mark
Saves checkpoint to `.claude-tailor/memory/progress-<name>.jsonl`:
```json
{
  "ts": "2025-12-16T14:32:00Z",
  "summary": "Fixed auth bugs in login flow",
  "completed": ["added input validation", "wrote 3 new tests"],
  "in_progress": "Refactoring session manager",
  "next_steps": ["test error paths", "update docs"],
  "key_files": ["src/auth.js", "test/auth.test.js"],
  "decisions": ["chose middleware pattern over decorator for simplicity"],
  "findings": ["API returns 401 for both missing & invalid tokens"]
}
```
Compact format = fewer tokens when /recall reads it back.

### /recall
Search all captured errors:
```
/recall TypeError ENOENT

Results:
1. TypeError in task.js (3 days ago) + ENOENT in file check
   → Same session, same root cause (missing validation)
2. TypeError in handler (1 day ago) + ENOENT auth check
   → Different root cause

Pattern: TypeError+ENOENT co-occur when file/permission checks are skipped
```

### /test
Runs tests + injects git context:
```
Tests: 3/68 passing
Modified: src/auth.js, test/auth.test.js
Git: main (clean, 2 commits ahead of origin)
Last error (from reflections): TypeError validation (2h ago)
```

### /reflect
Analyzes captured errors for patterns:
```
Unanalyzed errors: 5
- TypeError (3 instances) → Root: Missing null checks before property access
  - Prevention: Add TypeScript strict mode
  - Severity: High (repeated 3x)
- ReferenceError (2 instances) → Root: Variable scope misunderstanding
  - Prevention: Use const, not var
  - Severity: Medium

Co-occurrence: TypeError + ENOENT in 4 errors
→ Suggests: File validation + type safety needed together
```

---

## Installation

```bash
cd your-project
npx tailor-nano
# or: node /path/to/tailor-nano/src/install.js
```

That's it. Restart Claude Code and you're ready. The hook fires automatically on SessionStart.

Options:
```bash
# Dry run (see what would be installed)
npx tailor-nano --dry-run

# Force overwrite existing files
npx tailor-nano --force

# Control CLAUDE.md merge behavior
npx tailor-nano --claude-md=skip          # Keep existing
npx tailor-nano --claude-md=overwrite     # Replace it
npx tailor-nano --claude-md=merge         # Append (default)
```

---

## What Gets Installed

```
your-project/
├── CLAUDE.md                           # ← Patterns injected here
├── .claude/commands/                   # ← 4 commands installed
└── .claude-tailor/
    ├── hook.js                         # Error capture
    ├── session-start.sh                # Session context injection
    └── memory/reflections.jsonl        # Error log (grows over time)
```

---

## Research-Backed Patterns

Every pattern in `CLAUDE.md` has academic backing:

| Pattern | Source | Benefit |
|---------|--------|---------|
| **Code-First** | ICML 2024 | +10-15% task success |
| **Test-Driven Repair** | arXiv:2411.10213 | 76.8% bug detection rate |
| **Iteration Abandonment** | Repeton | Avoids stuck loops |
| **Layered Verification** | arXiv 2025 | -50% false positives |

No heuristics. Evidence-based only.

---

## Compare

| Feature | tailor-nano | tailor | nothing |
|---------|-------------|--------|---------|
| Patterns | ✓ Research-backed | ✓ Agents | ✗ Trial-error |
| Error capture | ✓ Silent | ✓ Active | ✗ Manual |
| Commands | ✓ 4 lean | ✓ 20+ complex | ✗ None |
| Dependencies | ✓ Zero | ✗ Many | ✓ Zero |
| LOC | ✓ ~280 | ✗ 5000+ | N/A |

**tldr**: tailor-nano = 80% of tailor's value, 5% of the code.

---

## Learn More

Deep dives into each area:

- **[QUICKSTART.md](docs/QUICKSTART.md)** - 5-min setup guide
- **[DEMO.md](docs/DEMO.md)** - Real workflow walkthrough
- **[VALIDATION.md](docs/VALIDATION.md)** - How patterns were tested
- **[STATS.md](docs/STATS.md)** - Code metrics & LOC breakdown
- **[COMPARISON.md](docs/COMPARISON.md)** - Detailed vs-comparison
- **[INDEX.md](docs/INDEX.md)** - Full project index
- **[SUMMARY.txt](docs/SUMMARY.txt)** - One-page overview

## Project Structure

```
tailor-nano/
├── README.md                  # This file (entry point)
├── package.json
├── CLAUDE.md                  # Development instructions
│
├── src/                       # Core implementation
│   ├── install.js            # Installs hook into .claude/settings.local.json + initializes .claude-tailor/
│   ├── hook.js               # Runs on error: parses stderr, extracts error signature, appends reflection
│   └── session-start.sh       # Called at session start: re-injects patterns from template into CLAUDE.md
│
├── commands/                  # Claude Code slash commands (installed into .claude/commands/)
│   ├── mark.md              # `/mark <name>` - Save checkpoint (compact JSONL) with decision summary
│   ├── recall.md            # `/recall <keyword>` - Search .claude-tailor/memory for past errors + co-occurrence patterns
│   ├── test.md              # `/test` - Run tests + git status (verifies current work state)
│   └── reflect.md           # `/reflect` - Analyze unanalyzed errors for root causes + patterns
│
├── test/                      # Test suite (68 tests) - validates install, hook, session-start, commands
│   ├── install.test.js
│   ├── hook.test.js
│   ├── session-start.test.js
│   ├── nano-status.test.js
│   └── test-utils.js
│
├── docs/                      # Documentation + validation reports
│   ├── QUICKSTART.md        # How to install and use tailor-nano
│   ├── DEMO.md              # Real-world example workflow
│   ├── STATS.md             # Performance metrics + memory overhead
│   ├── COMPARISON.md        # Comparison with other reflection systems
│   ├── VALIDATION.md        # How patterns were tested + academic citations
│   ├── INDEX.md             # Full command reference
│   └── SUMMARY.txt          # One-page summary
│
├── templates/                 # **CRITICAL**: Master pattern template
│   └── CLAUDE.md.template   # Decision Framework, Task Execution Standards, Bug Fixing, Stuck Detection, Code Review, Self-Improvement Loop
│                             # SOURCE OF TRUTH for all Claude Code behavior patterns
```

## Uninstall

```bash
# Remove hook from .claude/settings.local.json
# Delete .claude-tailor/ directory
# Remove patterns from CLAUDE.md (if desired)
```

## License

MIT
