#!/usr/bin/env node
import { readFileSync, appendFileSync, existsSync } from 'fs';
import { join } from 'path';

// Read hook input
let input = '';
try {
  input = readFileSync(0, 'utf-8');
} catch {
  process.exit(0);
}

if (!input) process.exit(0);

// Parse hook input
let hookData;
try {
  hookData = JSON.parse(input);
} catch {
  process.exit(0);
}

// Get transcript path
const transcriptPath = hookData.transcript_path;
if (!transcriptPath || !existsSync(transcriptPath)) {
  process.exit(0);
}

// Read transcript JSONL
let transcriptLines;
try {
  const transcriptContent = readFileSync(transcriptPath, 'utf-8');
  transcriptLines = transcriptContent.trim().split('\n').filter(Boolean);
} catch {
  process.exit(0);
}

// Collect all content that might contain errors
let fullContent = '';
for (const line of transcriptLines) {
  try {
    const entry = JSON.parse(line);

    // Collect from tool results
    if (entry.toolUseResult) {
      fullContent += entry.toolUseResult + '\n';
    }

    // Collect from user messages with tool_result
    if (entry.message?.content) {
      for (const item of entry.message.content) {
        if (item.type === 'tool_result' && item.content) {
          fullContent += item.content + '\n';
        }
      }
    }
  } catch {
    // Skip malformed lines
  }
}

if (!fullContent || fullContent.length < 50) process.exit(0);

// Detect errors with patterns
const errorPatterns = [
  /Error:/i,
  /TypeError:/i,
  /ReferenceError:/i,
  /SyntaxError:/i,
  /AssertionError:/i,
  /failed/i,
  /ENOENT/i,
  /EACCES/i,
  /Cannot find module/i,
  /Cannot read properties/i,
  /Uncaught/i,
  /Exception/i
];

const hasError = errorPatterns.some(pattern => pattern.test(fullContent));
if (!hasError) process.exit(0);

// Extract error type and snippet
let errorType = 'unknown';
let snippet = '';

for (const pattern of errorPatterns) {
  const match = fullContent.match(pattern);
  if (match) {
    errorType = match[0].toLowerCase().replace(':', '').replace(/\s+/g, '');
    const startIdx = Math.max(0, match.index - 100);
    snippet = fullContent.slice(startIdx, match.index + 500);
    break;
  }
}

// Extract context (file, operation, module)
let context = {};
const fileMatch = snippet.match(/(?:file:\/\/|at |in )([^\s:]+\.(?:js|ts|jsx|tsx))/);
const opMatch = snippet.match(/(?:at\s+)?(\w+)\s*\(/);
const moduleMatch = snippet.match(/(?:module|package|from\s+['"]\@?)?([a-z0-9\-]+)["']?/i);

if (fileMatch && !fileMatch[1].includes('node_modules')) {
  context.file = fileMatch[1];
}
if (opMatch) context.operation = opMatch[1];
if (moduleMatch) context.module = moduleMatch[1];

// Generate error signature (normalize for clustering)
let signature = errorType;
let normalizedSnippet = snippet
  .replace(/:\d+:\d+/g, ':LINE:COL')
  .replace(/\/[\w\-/]+\//g, '/PATH/')
  .replace(/0x[0-9a-f]+/g, '0xADDR')
  .replace(/\d{10,}/g, 'NUM');
const sigMatch = normalizedSnippet.match(/(\w+(?:\s+\w+)?)/);
if (sigMatch) signature += `-${sigMatch[1]}`;
context.signature = signature;

// Create reflection entry
const reflection = {
  id: `nano-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  ts: new Date().toISOString(),
  error_type: errorType,
  snippet: snippet.trim(),
  context: context,
  signature: context.signature
};

// Append to JSONL
const memoryPath = join(hookData.cwd || process.cwd(), '.claude-tailor', 'memory', 'reflections.jsonl');
try {
  appendFileSync(memoryPath, JSON.stringify(reflection) + '\n');
} catch (err) {
  // Silent fail
}

process.exit(0);
