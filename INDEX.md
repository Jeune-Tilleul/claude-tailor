# tailor-nano Documentation Index

Start here for quick navigation.

## Quick Start (New Users)

1. **[README.md](README.md)** - Philosophy, installation, what it does
2. **[DEMO.md](DEMO.md)** - Real usage examples, before/after comparisons
3. Install and use!

## Core Documentation

### For Users
- **[README.md](README.md)** - Main overview and installation guide
- **[DEMO.md](DEMO.md)** - Practical usage demonstration
- **[COMPARISON.md](COMPARISON.md)** - tailor-nano vs full tailor decision guide

### For Developers
- **[STATS.md](STATS.md)** - Line counts, code breakdown, metrics
- **[SUMMARY.txt](SUMMARY.txt)** - Project summary and success metrics
- **Source code**:
  - [install.js](install.js) - 59 LOC installer
  - [hook.js](hook.js) - 73 LOC error capture
  - [commands/nano-status.md](commands/nano-status.md) - 47 LOC status command
  - [CLAUDE.md.template](CLAUDE.md.template) - 173 LOC patterns

### Research-Backed Patterns
- **[CLAUDE.md.template](CLAUDE.md.template)** - The knowledge base:
  - Code-First Reasoning (ICML 2024)
  - Test-Driven Repair (arXiv:2411.10213)
  - Iteration Abandonment (Repeton)
  - Layered Verification (arXiv 2025)
  - Code Quality Standards
  - Testing Standards

## Key Questions Answered

### "Should I use this or full tailor?"
→ See [COMPARISON.md](COMPARISON.md)

### "How do I install it?"
→ See [README.md](README.md#installation)

### "What does it actually do?"
→ See [DEMO.md](DEMO.md)

### "How big is the codebase?"
→ See [STATS.md](STATS.md) - 279 LOC executable

### "What patterns are included?"
→ See [CLAUDE.md.template](CLAUDE.md.template) - 6 research-backed patterns

### "Can I see the source code?"
→ All inline:
- [install.js](install.js) - Installer
- [hook.js](hook.js) - Error capture
- [commands/nano-status.md](commands/nano-status.md) - Status command

## File Structure

```
tailor-nano/
├── INDEX.md                    ← You are here
├── README.md                   ← Start here (overview)
├── DEMO.md                     ← Usage examples
├── COMPARISON.md               ← vs full tailor
├── STATS.md                    ← Code metrics
├── SUMMARY.txt                 ← Project summary
│
├── install.js                  ← Installer (59 LOC)
├── hook.js                     ← Error capture (73 LOC)
├── CLAUDE.md.template          ← Patterns (173 LOC)
├── commands/
│   └── nano-status.md          ← Status command (47 LOC)
│
├── package.json                ← Package metadata
└── .gitignore                  ← Git ignore rules
```

## Reading Paths

### Path 1: Quick Evaluation (5 minutes)
1. README.md (philosophy + installation)
2. STATS.md (verify <300 LOC claim)
3. COMPARISON.md (decide if right for you)

### Path 2: Deep Understanding (30 minutes)
1. README.md (overview)
2. CLAUDE.md.template (understand patterns)
3. install.js + hook.js (see implementation)
4. DEMO.md (real usage)

### Path 3: Integration Planning (1 hour)
1. COMPARISON.md (features vs full tailor)
2. DEMO.md (expected behavior)
3. Test installation on your project
4. Review `/nano-status` output after 1 day

## Philosophy Summary

**Core Principle**: 80% of the value with 10% of the code

**What you get**:
- 6 research-backed patterns (static, proven)
- Silent error tracking (learn from mistakes)
- Simple insights (/nano-status)
- Zero dependencies, <300 LOC

**What you don't get**:
- Auto-evolution (manual pattern updates)
- A/B testing (no experiments)
- Complex infrastructure (just patterns + hook)

**Trade-off**: Simplicity & understandability vs automation

## Next Steps

1. Read [README.md](README.md) if you haven't
2. Try installation on a test project
3. Work normally for 1 week
4. Run `/nano-status` to see error patterns
5. Decide if patterns are valuable

Questions? Check [COMPARISON.md](COMPARISON.md) for common scenarios.

---

**Version**: 1.0.0
**Lines of Code**: 279 (executable)
**Dependencies**: 0
**License**: MIT
