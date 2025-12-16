# tailor vs tailor-nano Comparison

## Quick Decision Guide

Choose **tailor-nano** if:
- You want proven patterns NOW
- Simplicity > automation
- You're okay manually updating patterns
- <300 LOC sounds better than 3000+ LOC

Choose **full tailor** if:
- You want self-improving agents
- Automation > simplicity
- You trust LLM-driven evolution
- Complex infrastructure is acceptable

## Feature Comparison

| Feature | tailor-nano | Full tailor |
|---------|-------------|-------------|
| **Size** | 279 LOC | ~3600 LOC |
| **Dependencies** | 0 | ~5 (Anthropic SDK, etc.) |
| **Setup time** | 30 seconds | 5-10 minutes |
| **Patterns included** | 6 (static) | 6 (evolving) |
| **Error tracking** | Yes (JSONL) | Yes (JSONL) |
| **Status command** | `/nano-status` | `/tailor-status` |
| **Auto-evolution** | No | Yes (SICA loop) |
| **A/B testing** | No | Yes (Thompson Sampling) |
| **Agent generation** | No | Yes (meta-agent) |
| **LLM calls** | 0 | ~3-5/session |
| **Versioning** | No | Yes (rollback supported) |
| **Maintenance** | Near-zero | Low-medium |
| **Learning curve** | 30 minutes | 2-3 hours |

## Code Architecture

### tailor-nano
```
Simple & Flat
├── install.js (one-time setup)
├── hook.js (passive capture)
├── CLAUDE.md (static patterns)
└── /nano-status (simple insights)

Everything understandable in <1 hour
```

### Full tailor
```
Sophisticated & Modular
├── .claude/
│   ├── agents/ (specialized roles)
│   ├── skills/ (reusable components)
│   └── commands/ (workflow orchestration)
├── .claude-tailor/
│   ├── lib/ (evolution, bandit, versioning)
│   ├── memory/ (JSONL stores)
│   ├── experiments/ (A/B data)
│   └── prompts/ (LLM templates)

Requires study to fully understand
```

## Cost Comparison

### tailor-nano
- **Installation**: 0 API calls
- **Runtime**: 0 API calls (hook is local JS)
- **Updates**: Manual (edit CLAUDE.md)
- **Monthly cost**: $0

### Full tailor
- **Installation**: 1 API call (project exploration)
- **Runtime**: ~3-5 API calls/session (auto-evolution)
- **Updates**: Automatic (LLM-generated mutations)
- **Monthly cost**: ~$2-5 (Sonnet calls)

## Performance

### tailor-nano
- **Hook overhead**: <1ms (fast-path exit if no error)
- **Memory footprint**: ~50KB (JSONL grows slowly)
- **Startup time**: 0ms (no initialization)

### Full tailor
- **Hook overhead**: 1-5ms (checks experiments, stability)
- **Memory footprint**: ~500KB (experiments, versions, memory)
- **Startup time**: 100-500ms (auto-evolution check)

## Evolution Workflow

### tailor-nano
```
1. Work normally
2. Notice recurring pattern manually
3. Edit CLAUDE.md to add pattern
4. Pattern applied going forward

Human-driven, explicit
```

### Full tailor
```
1. Work normally
2. System detects failure patterns (3+ occurrences)
3. LLM analyzes and proposes mutation
4. Auto-approve (low-risk) or manual review
5. A/B test new version vs current
6. Converge to better variant automatically

AI-driven, automatic
```

## Use Cases

### tailor-nano Perfect For:
- Small projects (1-3 developers)
- Learning AI best practices
- Tight budgets (free)
- Simple stacks (Node, Python, Go)
- Distrust of auto-evolution

### Full tailor Perfect For:
- Large projects (4+ developers)
- Long-term maintenance (years)
- Complex stacks (microservices, polyglot)
- High-value codebases (worth investment)
- Trust in AI-driven improvement

## Real-World Scenarios

### Scenario 1: Indie Developer
- **Project**: Side project SAAS app
- **Team**: Solo developer
- **Budget**: Minimal
- **Recommendation**: **tailor-nano**
- **Why**: Proven patterns immediately, zero cost, simple to understand

### Scenario 2: Startup Engineering Team
- **Project**: Production web app
- **Team**: 5 developers
- **Budget**: Moderate
- **Recommendation**: **Full tailor**
- **Why**: Auto-improving agents save team time, worth $5/month investment

### Scenario 3: Enterprise Internal Tool
- **Project**: Complex backend system
- **Team**: 20+ developers
- **Budget**: High
- **Recommendation**: **Full tailor**
- **Why**: Accumulated improvements compound across large team

### Scenario 4: Open Source Project
- **Project**: Public library
- **Team**: Contributors worldwide
- **Budget**: $0
- **Recommendation**: **tailor-nano**
- **Why**: Contributors benefit from patterns, no ongoing costs, simple to onboard

## Migration Path

### nano → full tailor
```bash
# Keep your patterns
cp CLAUDE.md CLAUDE.md.backup

# Install full tailor
npm install claude-tailor
node node_modules/claude-tailor/install.js

# Merge patterns back
cat CLAUDE.md.backup >> CLAUDE.md

# Your error history is preserved (.claude-tailor/memory/)
```

### full tailor → nano
```bash
# Export current patterns
cp CLAUDE.md CLAUDE.md.backup

# Remove full tailor
rm -rf .claude-tailor/ .claude/agents/ .claude/skills/

# Install nano
node /path/to/tailor-nano/install.js

# Your manual improvements are now in CLAUDE.md
```

## Bottom Line

**tailor-nano**: Opinionated starter pack. Research-backed patterns, zero complexity.

**Full tailor**: Self-improving tooling platform. AI-driven evolution, requires investment.

Both valid. Choose based on your context, not hype.
