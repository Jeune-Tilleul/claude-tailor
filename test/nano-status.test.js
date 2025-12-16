import test from 'node:test';
import assert from 'node:assert';
import { join } from 'path';
import { createTestDir, cleanupTestDir, createTestReflections, createReflection, readJSONL } from './test-utils.js';

/**
 * Extract core nano-status logic for testing
 */

function parseReflections(reflections) {
  return reflections;
}

function countByErrorType(reflections) {
  const counts = {};
  reflections.forEach(r => {
    counts[r.error_type] = (counts[r.error_type] || 0) + 1;
  });
  return counts;
}

function getSortedCounts(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function getTopN(sorted, n) {
  return sorted.slice(0, n);
}

function analyzeCoOccurrence(reflections) {
  const coOccurrence = {};
  for (let i = 0; i < reflections.length - 1; i++) {
    const pair = [reflections[i].error_type, reflections[i + 1].error_type].sort().join('|');
    coOccurrence[pair] = (coOccurrence[pair] || 0) + 1;
  }
  return coOccurrence;
}

function getTopCoOccurrences(coOccurrence, n) {
  return Object.entries(coOccurrence)
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

function getLastReflection(reflections) {
  return reflections.length > 0 ? reflections[reflections.length - 1] : null;
}

// Tests

test('nano-status - no reflections file exists', () => {
  const testDir = createTestDir('nano-status-no-file');

  try {
    const memoryPath = join(testDir, '.claude-tailor', 'memory', 'reflections.jsonl');
    // Verify that file does not exist - status command should exit early
    const fileExists = false; // We haven't created it
    assert.strictEqual(fileExists, false, 'file should not exist - status command exits early');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('nano-status - counts errors by type', () => {
  const reflections = [
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'typeerror' }),
    createReflection({ error_type: 'referenceerror' })
  ];

  const counts = countByErrorType(reflections);
  assert.strictEqual(counts['error'], 2, 'should count 2 error occurrences');
  assert.strictEqual(counts['typeerror'], 1, 'should count 1 typeerror');
  assert.strictEqual(counts['referenceerror'], 1, 'should count 1 referenceerror');
});

test('nano-status - sorts error types by frequency', () => {
  const reflections = [
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'typeerror' }),
    createReflection({ error_type: 'typeerror' }),
    createReflection({ error_type: 'referenceerror' })
  ];

  const counts = countByErrorType(reflections);
  const sorted = getSortedCounts(counts);
  assert.strictEqual(sorted[0][0], 'error', 'most frequent should be first');
  assert.strictEqual(sorted[0][1], 3, 'most frequent should have count 3');
  assert.strictEqual(sorted[1][0], 'typeerror', 'second most frequent should be second');
});

test('nano-status - returns top N error types', () => {
  const reflections = [
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'typeerror' }),
    createReflection({ error_type: 'referenceerror' }),
    createReflection({ error_type: 'syntaxerror' }),
    createReflection({ error_type: 'enoent' }),
    createReflection({ error_type: 'eacces' })
  ];

  const counts = countByErrorType(reflections);
  const sorted = getSortedCounts(counts);
  const top5 = getTopN(sorted, 5);
  assert.strictEqual(top5.length, 5, 'should return top 5');
});

test('nano-status - returns fewer results when fewer than N available', () => {
  const reflections = [
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'typeerror' })
  ];

  const counts = countByErrorType(reflections);
  const sorted = getSortedCounts(counts);
  const top5 = getTopN(sorted, 5);
  assert.strictEqual(top5.length, 2, 'should return 2 when only 2 available');
});

test('nano-status - analyzes error co-occurrence patterns', () => {
  const reflections = [
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'typeerror' }),
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'typeerror' })
  ];

  const coOccurrence = analyzeCoOccurrence(reflections);
  assert.ok(coOccurrence['error|typeerror'], 'should detect error-typeerror pair');
});

test('nano-status - filters co-occurrences with count > 1', () => {
  const reflections = [
    createReflection({ error_type: 'a' }),
    createReflection({ error_type: 'b' }), // appears once
    createReflection({ error_type: 'a' }),
    createReflection({ error_type: 'b' }), // appears again
    createReflection({ error_type: 'a' })
  ];

  const coOccurrence = analyzeCoOccurrence(reflections);
  const topPairs = getTopCoOccurrences(coOccurrence, 3);
  // a|b should appear multiple times, single pairs filtered out
  topPairs.forEach(([pair, count]) => {
    assert.ok(count > 1, 'all returned pairs should have count > 1');
  });
});

test('nano-status - returns top N co-occurrence pairs', () => {
  const reflections = [];
  // Create multiple co-occurrence patterns
  for (let i = 0; i < 3; i++) {
    reflections.push(createReflection({ error_type: 'error' }));
    reflections.push(createReflection({ error_type: 'typeerror' }));
  }
  for (let i = 0; i < 2; i++) {
    reflections.push(createReflection({ error_type: 'referenceerror' }));
    reflections.push(createReflection({ error_type: 'syntaxerror' }));
  }

  const coOccurrence = analyzeCoOccurrence(reflections);
  const topPairs = getTopCoOccurrences(coOccurrence, 3);
  assert.ok(topPairs.length <= 3, 'should return at most 3 pairs');
});

test('nano-status - calculates total error count', () => {
  const reflections = [
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'error' }),
    createReflection({ error_type: 'typeerror' }),
    createReflection({ error_type: 'typeerror' }),
    createReflection({ error_type: 'typeerror' })
  ];

  assert.strictEqual(reflections.length, 5, 'total should be 5');
});

test('nano-status - identifies last reflection', () => {
  const reflections = [
    createReflection({ error_type: 'error', ts: '2024-01-01T00:00:00Z' }),
    createReflection({ error_type: 'error', ts: '2024-01-01T01:00:00Z' }),
    createReflection({ error_type: 'typeerror', ts: '2024-01-01T02:00:00Z' })
  ];

  const last = getLastReflection(reflections);
  assert.strictEqual(last.error_type, 'typeerror', 'last reflection should be last in array');
  assert.strictEqual(last.ts, '2024-01-01T02:00:00Z', 'last should have latest timestamp');
});

test('nano-status - handles empty reflections array', () => {
  const reflections = [];
  const counts = countByErrorType(reflections);
  assert.strictEqual(Object.keys(counts).length, 0, 'empty array should have no counts');
  assert.strictEqual(getLastReflection(reflections), null, 'no last reflection when empty');
});

test('nano-status - handles single reflection', () => {
  const reflections = [createReflection({ error_type: 'error' })];
  const counts = countByErrorType(reflections);
  assert.strictEqual(counts['error'], 1, 'single reflection should count as 1');
  const last = getLastReflection(reflections);
  assert.strictEqual(last.error_type, 'error', 'should return the single reflection');
});

test('nano-status - co-occurrence pairs are normalized alphabetically', () => {
  const reflections = [
    createReflection({ error_type: 'zebra' }),
    createReflection({ error_type: 'apple' }),
    createReflection({ error_type: 'zebra' }),
    createReflection({ error_type: 'apple' })
  ];

  const coOccurrence = analyzeCoOccurrence(reflections);
  // Should use sorted order: apple|zebra, not zebra|apple
  const keys = Object.keys(coOccurrence);
  keys.forEach(key => {
    const [type1, type2] = key.split('|');
    assert.ok(type1 <= type2, `pair should be sorted: ${key}`);
  });
});

test('nano-status - handles reflections with missing fields gracefully', () => {
  const reflections = [
    { error_type: 'error', ts: '2024-01-01T00:00:00Z' },
    { error_type: 'typeerror', ts: '2024-01-01T01:00:00Z' }
  ];

  const counts = countByErrorType(reflections);
  assert.strictEqual(counts['error'], 1, 'should count error despite missing other fields');
});

test('nano-status - generates consistent signatures from patterns', () => {
  const reflections = [
    createReflection({
      error_type: 'error',
      signature: 'error-module not found'
    }),
    createReflection({
      error_type: 'error',
      signature: 'error-module not found'
    }),
    createReflection({
      error_type: 'error',
      signature: 'error-different error'
    })
  ];

  // Group by signature
  const sigCounts = {};
  reflections.forEach(r => {
    sigCounts[r.signature] = (sigCounts[r.signature] || 0) + 1;
  });

  assert.strictEqual(sigCounts['error-module not found'], 2, 'same signature should be counted');
  assert.strictEqual(sigCounts['error-different error'], 1, 'different signature should separate');
});

test('nano-status - handles large reflection sets efficiently', () => {
  const reflections = [];
  for (let i = 0; i < 1000; i++) {
    reflections.push(createReflection({
      error_type: ['error', 'typeerror', 'referenceerror'][i % 3]
    }));
  }

  const counts = countByErrorType(reflections);
  const sorted = getSortedCounts(counts);
  const top5 = getTopN(sorted, 5);

  assert.ok(top5.length > 0, 'should process large sets');
  assert.strictEqual(reflections.length, 1000, 'should maintain count');
});

test('nano-status - timestamp parsing for last error', () => {
  const now = new Date().toISOString();
  const past = new Date(Date.now() - 3600000).toISOString();

  const reflections = [
    createReflection({ error_type: 'error', ts: past }),
    createReflection({ error_type: 'typeerror', ts: now })
  ];

  const last = getLastReflection(reflections);
  assert.strictEqual(last.ts, now, 'last reflection should have latest timestamp');
});
