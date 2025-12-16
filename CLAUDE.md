# tailor-nano Development Patterns

Project stats: 157 LOC, 2 files, 48 tests, zero dependencies.
Budget: <300 LOC total.

## Decision Framework

| Task | Approach | Verification |
|------|----------|--------------|
| New feature | Research first, then SCoT + Code-First | Tests pass, LOC budget ok |
| Bug fix | Test-Driven Repair | Failing test becomes passing |
| Refactor | Layered Verification | All 48 tests pass, no behavior change |
| Complex (3+ approaches) | Generate 2-3, compare tradeoffs | Document chosen approach |

## Code Generation

**Always Code-First**: Write working code, then explain.

```javascript
// DO: Code first
export function errorContext(snippet, errorPatterns) {
  let context = {};
  const fileMatch = snippet.match(/at\s+([^\s:]+\.js)/);
  if (fileMatch) context.file = fileMatch[1];
  return context;
}
// Then explain approach

// DON'T: Long explanation, then code
```

**SCoT for new features** (4 steps, in order):
1. UNDERSTAND - requirements, constraints (<300 LOC, zero deps), unknowns
2. DESIGN - data flow, components, error paths
3. IMPLEMENT - one component at a time
4. VERIFY - edge cases, error paths, LOC budget, test coverage

## Bug Fixing

**Test-Driven Repair** (mandatory):
1. Write failing test that reproduces bug
2. Confirm test fails for correct reason
3. Fix code
4. Confirm test passes
5. Commit test + fix together

Use existing 48 tests as templates.

## Stuck Detection

**After 3 occurrences of same error**: Different approach required.

**After 5 failed attempts**: STOP current strategy.

**Signs of being stuck:**
- Same error repeating
- Similar micro-adjustments to same function
- Adding complexity without solving core issue

**Action**: Describe problem fresh. Try orthogonal approach.

## Code Review (4 passes)

1. **Analyze** - What does it do?
2. **Reason** - Why this design?
3. **Verify** - Edge cases handled?
4. **Refine** - Can it be simpler?

Do not combine passes. For tailor-nano:
- Pass 1: "hook.js parses error transcript, extracts context, appends reflection"
- Pass 2: "Uses early exits to avoid nesting; normalizes snippet for clustering"
- Pass 3: "Handles JSON.parse failure, missing stdin, empty transcript"
- Pass 4: "Can we reduce LOC? Remove duplication?"

## Quality Thresholds

| Metric | Limit | Action when exceeded |
|--------|-------|---------------------|
| Total LOC | 300 | Remove features or split project |
| File size | 150 lines | Split by responsibility |
| Function size | 30 lines | Extract helpers |
| Nesting depth | 3 levels | Use guard clauses |

**Guard clause pattern:**
```javascript
// Good: early exits
if (!stdin) process.exit(0);
if (stdin.length < 50) process.exit(0);
if (!hasError) process.exit(0);
// main logic at top level

// Bad: deep nesting
if (stdin) {
  if (stdin.length >= 50) {
    if (hasError) {
      // logic buried deep
    }
  }
}
```

## Testing

**Structure**: Arrange-Act-Assert
```javascript
test('hook - appends reflection entry to JSONL', () => {
  // Arrange
  const transcript = JSON.stringify({
    fullConversation: 'Some error: TypeError occurred'
  });
  // Act
  const reflection = parseAndCreateReflection(transcript);
  // Assert
  assert.ok(reflection.id);
  assert.strictEqual(reflection.error_type, 'typeerror');
});
```

**Principles:**
- Test behavior, not implementation
- One assertion per test (prefer)
- Tests must be independent

**Test files:**
- install.test.js: directory creation, file copying, hook registration
- hook.test.js: error detection, reflection creation
- nano-status.test.js: command output

## Error Handling

**Never silently fail:**
```javascript
// BAD
try { appendFileSync(path, data); } catch {}

// GOOD (hooks: log and continue)
try {
  appendFileSync(path, data);
} catch (err) {
  console.error('Failed:', err.message);
}
```

**Fail fast**: Validate inputs at function entry.
```javascript
let stdin = '';
try { stdin = readFileSync(0, 'utf-8'); } catch { process.exit(0); }
if (!stdin || stdin.length < 50) process.exit(0);
// Parse once stdin is valid
```

## Constraints

**LOC Budget**: <300 total (currently 155)
- Every line must deliver value
- Dead code: remove immediately
- If over budget: remove features, not quality

**Zero Dependencies**:
- Standard library only (fs, path, child_process)
- Node built-ins for testing (node:test, node:assert)
- No npm packages

**Research-Backed Features**:
- Before adding feature: find academic evidence
- If no research supports it: reconsider
- Apply research to tailor-nano context

## Commits

**Format:**
```
type: description (50 chars max)

Why this change was needed.
```

**Types**: feat, fix, refactor, test, docs, chore

**Rules:**
- One logical change per commit
- Update LOC stats in CLAUDE.md if code changes
- Update test count if tests change

## Development Workflow

1. Find/cite research for the pattern
2. Write test first
3. Implement minimum viable code
4. Review with 4 passes
5. Verify LOC budget (<300)
6. Commit atomically

## Self-Improvement Loop

Before final submission:
1. Generate solution
2. Self-critique: complexity justified? Edge cases? Test coverage?
3. Refine based on critique

## Context Management

**Include only:**
- Files being modified (hook.js, install.js)
- Immediate dependencies
- Relevant test files

**Exclude:**
- Debug logs from previous attempts
- Unrelated code
- Verbose explanations of obvious things

---

Error patterns tracked in `.claude-tailor/memory/reflections.jsonl`. Use `/nano-status` for trends.
