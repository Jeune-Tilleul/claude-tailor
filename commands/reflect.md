---
description: Analyze captured errors and create intelligent reflections
---

# Reflect Command

Analyze errors captured in `.claude-tailor/memory/reflections.jsonl` and provide intelligent insights.

## Your Task

1. **Read the reflections file**:
   ```javascript
   import { readFileSync, existsSync } from 'fs';
   import { join } from 'path';

   const reflectionsPath = join(process.cwd(), '.claude-tailor', 'memory', 'reflections.jsonl');

   if (!existsSync(reflectionsPath)) {
     console.log('No errors captured yet.');
     process.exit(0);
   }

   const lines = readFileSync(reflectionsPath, 'utf-8').trim().split('\n').filter(Boolean);
   const reflections = lines.map(line => JSON.parse(line));
   ```

2. **Analyze unanalyzed errors** (where `analyzed !== true`):
   - Identify root causes
   - Detect patterns across multiple errors
   - Find recurring issues
   - Suggest preventive measures

3. **For each unanalyzed error**, append an intelligent analysis:
   ```javascript
   // Add to the SAME reflection entry
   const updatedReflection = {
     ...reflection,
     analyzed: true,
     analysis: {
       root_cause: "Clear explanation of why this happened",
       pattern: "Is this part of a recurring pattern?",
       fix_applied: "What fix was implemented (if any)",
       prevention: "How to prevent this in the future",
       severity: "low|medium|high",
       related_errors: ["list", "of", "related", "error", "ids"]
     }
   };
   ```

4. **APPEND the analyzed reflection** (NEVER rewrite the file):
   ```javascript
   // CRITICAL: APPEND-ONLY - Never rewrite the entire file!
   import { appendFileSync } from 'fs';

   const updatedReflection = {
     ...originalReflection,
     analyzed: true,
     analysis: { ... }
   };

   appendFileSync(
     '.claude-tailor/memory/reflections.jsonl',
     JSON.stringify(updatedReflection) + '\n'
   );
   ```

   **IMPORTANT**:
   - ✅ APPEND new line with updated reflection
   - ✅ Keep original reflection in file (creates history)
   - ❌ NEVER read entire file and rewrite
   - ❌ NEVER delete or modify existing lines

5. **Display summary**:
   ```
   Reflection Analysis Summary

   Total errors analyzed: X

   High severity (requires immediate attention):
   - [error_type] in [file]: [root_cause]

   Recurring patterns detected:
   - Pattern 1: [description] (occurred X times)

   Recommendations:
   1. [Prevention strategy]
   2. [Code improvement]
   ```

## Important Notes

- Only analyze errors that don't have `analyzed: true`
- Preserve all original reflection data
- Use your understanding of the codebase context
- Be concise but insightful
- Focus on actionable insights

## Example Analysis

```json
{
  "id": "nano-123-abc",
  "ts": "2025-12-16T19:00:00.000Z",
  "error_type": "typeerror",
  "snippet": "Cannot read properties of undefined (reading 'priority')",
  "context": {
    "file": "src/task-manager.js",
    "operation": "groupByPriority"
  },
  "signature": "typeerror-Cannot",
  "analyzed": true,
  "analysis": {
    "root_cause": "The code assumes all tasks have a metadata.priority field, but tasks are created without metadata",
    "pattern": "Assumption about object structure without validation",
    "fix_applied": "Changed from task.metadata.priority to task.priority",
    "prevention": "Add input validation and TypeScript types",
    "severity": "high",
    "related_errors": []
  }
}
```
