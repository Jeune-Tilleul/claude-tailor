import { mkdirSync, rmSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Create temporary test directory
 */
export function createTestDir(name) {
  const dir = join(tmpdir(), `tailor-nano-test-${name}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

/**
 * Clean up test directory
 */
export function cleanupTestDir(dir) {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Create test JSONL reflections file
 */
export function createTestReflections(dir, reflections) {
  mkdirSync(join(dir, '.claude-tailor', 'memory'), { recursive: true });
  const path = join(dir, '.claude-tailor', 'memory', 'reflections.jsonl');
  const content = reflections.map(r => JSON.stringify(r)).join('\n');
  writeFileSync(path, content + '\n');
  return path;
}

/**
 * Mock reflection entry
 */
export function createReflection(overrides = {}) {
  return {
    id: `nano-${Date.now()}-test`,
    ts: new Date().toISOString(),
    error_type: 'error',
    snippet: 'Error: test error',
    context: {
      file: 'test.js',
      operation: 'testFunc',
      module: 'test-module'
    },
    signature: 'error-test',
    ...overrides
  };
}

/**
 * Create test settings.local.json
 */
export function createTestSettings(dir, settings = {}) {
  mkdirSync(join(dir, '.claude'), { recursive: true });
  const path = join(dir, '.claude', 'settings.local.json');
  const defaultSettings = { hooks: [] };
  writeFileSync(path, JSON.stringify({ ...defaultSettings, ...settings }, null, 2));
  return path;
}

/**
 * Read and parse JSON file
 */
export function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/**
 * Read JSONL file and return array
 */
export function readJSONL(path) {
  const content = readFileSync(path, 'utf-8');
  return content
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}
