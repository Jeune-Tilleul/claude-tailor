# tailor-nano

Ultra-minimal AI tooling kit for Claude Code. Maximum value, minimum code.

## Philosophy

- **80% of the value with 10% of the code**
- Research-backed patterns in CLAUDE.md (not complex infrastructure)
- Simple error capture for learning
- Zero dependencies, <300 LOC total

## What It Does

1. **Installs clean patterns** → `CLAUDE.md` with research-backed best practices
2. **Captures errors silently** → JSONL memory for pattern detection
3. **Shows insights** → `/nano-status` command for error trends

## Installation

```bash
cd your-project
npx tailor-nano
# or: node /path/to/tailor-nano/install.js
```

Restart Claude Code after installation.

## Usage

Just work normally. The system:
- Captures errors automatically (no performance impact)
- Stores patterns in `.claude-tailor/memory/reflections.jsonl`
- Check insights with `/nano-status` command

## Files Created

```
your-project/
├── CLAUDE.md                           # Patterns (appended if exists)
├── .claude/
│   └── commands/nano-status.md         # Status command
└── .claude-tailor/
    ├── hook.js                         # Error capture
    └── memory/reflections.jsonl        # Error log
```

## What's Different?

**vs tailor-nano**: No auto-evolution, no agents, no A/B testing. Just patterns + memory.

**vs nothing**: Research-backed practices instead of trial-and-error.

## Patterns Included

- Code-First Reasoning (ICML 2024: +10-15% success)
- Test-Driven Repair (arXiv:2411.10213: 76.8% bug detection)
- Iteration Abandonment (Repeton: avoid stuck loops)
- Layered Verification (arXiv 2025: -50% false positives)

## Uninstall

```bash
# Remove hook from .claude/settings.local.json
# Delete .claude-tailor/ directory
# Remove patterns from CLAUDE.md (if desired)
```

## License

MIT
