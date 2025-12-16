import test from 'node:test';
import assert from 'node:assert';
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { createTestDir, cleanupTestDir, readJSON } from './test-utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

/**
 * Mock install process by running install.js in test directory
 */
function runInstall(testDir, args = []) {
  const result = spawnSync('node', [join(projectRoot, 'install.js'), ...args], {
    cwd: testDir,
    stdio: 'pipe'
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

test('install.js - creates .claude-tailor/memory directory', () => {
  const testDir = createTestDir('install-dirs');

  try {
    runInstall(testDir);
    const memoryDir = join(testDir, '.claude-tailor', 'memory');
    assert.strictEqual(existsSync(memoryDir), true, 'memory directory should exist');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - creates .claude/commands directory', () => {
  const testDir = createTestDir('install-commands-dir');

  try {
    runInstall(testDir);
    const commandsDir = join(testDir, '.claude', 'commands');
    assert.strictEqual(existsSync(commandsDir), true, 'commands directory should exist');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - copies hook.js to installation target', () => {
  const testDir = createTestDir('install-hook-copy');

  try {
    runInstall(testDir);
    const hookPath = join(testDir, '.claude-tailor', 'hook.js');
    assert.strictEqual(existsSync(hookPath), true, 'hook.js should be copied');

    const content = readFileSync(hookPath, 'utf-8');
    assert.match(content, /import.*readFileSync/, 'hook.js should contain required code');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - copies mark.md to installation target', () => {
  const testDir = createTestDir('install-mark-copy');

  try {
    runInstall(testDir);
    const markPath = join(testDir, '.claude', 'commands', 'mark.md');
    assert.strictEqual(existsSync(markPath), true, 'mark.md should be copied');

    const content = readFileSync(markPath, 'utf-8');
    assert.match(content, /Save.*restore.*session.*progress/i, 'mark.md should contain expected content');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - creates CLAUDE.md when it does not exist', () => {
  const testDir = createTestDir('install-claude-create');

  try {
    runInstall(testDir);
    const claudePath = join(testDir, 'CLAUDE.md');
    assert.strictEqual(existsSync(claudePath), true, 'CLAUDE.md should be created');

    const content = readFileSync(claudePath, 'utf-8');
    assert.match(content, /tailor-nano/, 'CLAUDE.md should contain tailor-nano patterns');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - appends to existing CLAUDE.md without duplicates', () => {
  const testDir = createTestDir('install-claude-append');
  const claudePath = join(testDir, 'CLAUDE.md');

  try {
    // Create existing CLAUDE.md
    mkdirSync(testDir, { recursive: true });
    writeFileSync(claudePath, 'Existing content\n');

    runInstall(testDir);

    const content = readFileSync(claudePath, 'utf-8');
    assert.match(content, /Existing content/, 'existing content should be preserved');
    assert.match(content, /tailor-nano/, 'tailor-nano patterns should be added');

    // Count occurrences in first install result
    const countAfterFirst = (content.match(/tailor-nano/g) || []).length;
    assert.ok(countAfterFirst > 0, 'tailor-nano should appear in template');

    // Verify no duplication by running install again
    runInstall(testDir);
    const contentAfter = readFileSync(claudePath, 'utf-8');
    const countAfterSecond = (contentAfter.match(/tailor-nano/g) || []).length;
    assert.strictEqual(
      countAfterSecond,
      countAfterFirst,
      `tailor-nano count should not increase on second run (first: ${countAfterFirst}, second: ${countAfterSecond})`
    );
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - registers SessionStart hook in settings.local.json', () => {
  const testDir = createTestDir('install-hook-register');

  try {
    runInstall(testDir);
    const settingsPath = join(testDir, '.claude', 'settings.local.json');
    assert.strictEqual(existsSync(settingsPath), true, 'settings.local.json should be created');

    const settings = readJSON(settingsPath);
    assert.ok(typeof settings.hooks === 'object', 'hooks should be an object');
    assert.ok(Array.isArray(settings.hooks.SessionStart), 'SessionStart should be an array');
    assert.ok(settings.hooks.SessionStart.length > 0, 'SessionStart array should not be empty');

    // Look for hook with session-start path
    const sessionHook = settings.hooks.SessionStart[0];
    assert.ok(sessionHook.hooks, 'hook should have hooks array');
    const command = sessionHook.hooks.find(h => h.command?.includes('session-start'));
    assert.ok(command, 'session-start hook should be registered');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - does not duplicate SessionStart hook on idempotent run', () => {
  const testDir = createTestDir('install-idempotent');

  try {
    // First install
    runInstall(testDir);
    const settingsPath = join(testDir, '.claude', 'settings.local.json');
    let settings = readJSON(settingsPath);
    const hookCountFirst = settings.hooks.SessionStart.length;
    assert.ok(hookCountFirst > 0, 'should have at least one hook after first install');

    const sessionHookCountFirst = settings.hooks.SessionStart.filter(h =>
      h.hooks?.some(hook => hook.command?.includes('session-start'))
    ).length;
    assert.strictEqual(
      sessionHookCountFirst,
      1,
      'should have exactly one session-start hook after first install'
    );

    // Second install
    runInstall(testDir);
    settings = readJSON(settingsPath);

    const sessionHookCountSecond = settings.hooks.SessionStart.filter(h =>
      h.hooks?.some(hook => hook.command?.includes('session-start'))
    ).length;

    assert.strictEqual(
      sessionHookCountSecond,
      sessionHookCountFirst,
      `session-start hook count should not increase on second run`
    );
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - preserves existing hooks in settings', () => {
  const testDir = createTestDir('install-preserve-hooks');

  try {
    // Create settings with existing hook in new format
    const settingsPath = join(testDir, '.claude', 'settings.local.json');
    mkdirSync(dirname(settingsPath), { recursive: true });
    writeFileSync(settingsPath, JSON.stringify({
      hooks: {
        PreToolUse: [
          {
            hooks: [
              { type: 'command', command: './existing-hook.js' }
            ]
          }
        ]
      }
    }, null, 2));

    runInstall(testDir);

    const settings = readJSON(settingsPath);
    // Existing PreToolUse hook should be preserved
    assert.ok(settings.hooks.PreToolUse, 'PreToolUse should still exist');
    const existingHook = settings.hooks.PreToolUse.find(h =>
      h.hooks?.some(hook => hook.command?.includes('existing'))
    );
    assert.ok(existingHook, 'existing hook should be preserved');
    // SessionStart should be added
    assert.ok(settings.hooks.SessionStart, 'SessionStart should be added');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - creates valid settings.local.json with proper JSON', () => {
  const testDir = createTestDir('install-valid-json');

  try {
    runInstall(testDir);
    const settingsPath = join(testDir, '.claude', 'settings.local.json');

    // Should not throw on parse
    const settings = readJSON(settingsPath);
    assert.ok(settings, 'settings should parse as valid JSON');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - dry-run mode does not create any files', () => {
  const testDir = createTestDir('install-dry-run');

  try {
    runInstall(testDir, ['--dry-run']);

    // Check that nothing was created
    assert.strictEqual(existsSync(join(testDir, '.claude-tailor')), false, 'should not create .claude-tailor');
    assert.strictEqual(existsSync(join(testDir, '.claude')), false, 'should not create .claude');
    assert.strictEqual(existsSync(join(testDir, 'CLAUDE.md')), false, 'should not create CLAUDE.md');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - dry-run mode with -n flag', () => {
  const testDir = createTestDir('install-dry-run-short');

  try {
    const result = runInstall(testDir, ['-n']);

    // Check output contains dry run messages
    const output = result.stdout.toString();
    assert.match(output, /DRY RUN/, 'output should indicate dry run mode');

    // Verify nothing was created
    assert.strictEqual(existsSync(join(testDir, '.claude-tailor')), false, 'should not create .claude-tailor');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - force mode overwrites existing files', () => {
  const testDir = createTestDir('install-force');

  try {
    // First install
    runInstall(testDir);
    const hookPath = join(testDir, '.claude-tailor', 'hook.js');
    assert.ok(existsSync(hookPath), 'hook.js should exist after first install');

    // Modify the file
    writeFileSync(hookPath, '// modified content');
    const modifiedContent = readFileSync(hookPath, 'utf-8');
    assert.strictEqual(modifiedContent, '// modified content', 'file should be modified');

    // Run install with --force
    runInstall(testDir, ['--force']);
    const restoredContent = readFileSync(hookPath, 'utf-8');
    assert.notStrictEqual(restoredContent, '// modified content', 'file should be overwritten');
    assert.match(restoredContent, /import.*readFileSync/, 'file should contain original content');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - force mode with -f flag', () => {
  const testDir = createTestDir('install-force-short');

  try {
    // Create existing file
    const hookDir = join(testDir, '.claude-tailor');
    mkdirSync(hookDir, { recursive: true });
    const hookPath = join(hookDir, 'hook.js');
    writeFileSync(hookPath, '// old version');

    // Run install with -f
    runInstall(testDir, ['-f']);
    const content = readFileSync(hookPath, 'utf-8');
    assert.notStrictEqual(content, '// old version', 'file should be overwritten');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - --claude-md=skip does not modify existing CLAUDE.md', () => {
  const testDir = createTestDir('install-claude-skip');
  const claudePath = join(testDir, 'CLAUDE.md');

  try {
    // Create existing CLAUDE.md
    mkdirSync(testDir, { recursive: true });
    writeFileSync(claudePath, 'Original content\n');

    runInstall(testDir, ['--claude-md=skip']);

    const content = readFileSync(claudePath, 'utf-8');
    assert.strictEqual(content, 'Original content\n', 'CLAUDE.md should not be modified');
    assert.ok(!content.includes('tailor-nano'), 'should not contain tailor-nano patterns');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - --claude-md=overwrite replaces existing CLAUDE.md', () => {
  const testDir = createTestDir('install-claude-overwrite');
  const claudePath = join(testDir, 'CLAUDE.md');

  try {
    // Create existing CLAUDE.md
    mkdirSync(testDir, { recursive: true });
    writeFileSync(claudePath, 'Original content\n');

    runInstall(testDir, ['--claude-md=overwrite']);

    const content = readFileSync(claudePath, 'utf-8');
    assert.ok(!content.includes('Original content'), 'original content should be gone');
    assert.match(content, /tailor-nano/, 'should contain tailor-nano patterns');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - --claude-md=merge appends to existing CLAUDE.md', () => {
  const testDir = createTestDir('install-claude-merge');
  const claudePath = join(testDir, 'CLAUDE.md');

  try {
    // Create existing CLAUDE.md
    mkdirSync(testDir, { recursive: true });
    writeFileSync(claudePath, 'Original content\n');

    runInstall(testDir, ['--claude-md=merge']);

    const content = readFileSync(claudePath, 'utf-8');
    assert.match(content, /Original content/, 'original content should be preserved');
    assert.match(content, /tailor-nano/, 'should contain tailor-nano patterns');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - default behavior without --claude-md creates new file', () => {
  const testDir = createTestDir('install-claude-new');
  const claudePath = join(testDir, 'CLAUDE.md');

  try {
    runInstall(testDir);

    assert.ok(existsSync(claudePath), 'CLAUDE.md should be created');
    const content = readFileSync(claudePath, 'utf-8');
    assert.match(content, /tailor-nano/, 'should contain tailor-nano patterns');
  } finally {
    cleanupTestDir(testDir);
  }
});

test('install.js - without force, does not overwrite existing hook.js', () => {
  const testDir = createTestDir('install-no-force');

  try {
    // First install
    runInstall(testDir);
    const hookPath = join(testDir, '.claude-tailor', 'hook.js');

    // Modify the file
    writeFileSync(hookPath, '// modified');

    // Run install again without force
    runInstall(testDir);
    const content = readFileSync(hookPath, 'utf-8');
    assert.strictEqual(content, '// modified', 'file should not be overwritten without --force');
  } finally {
    cleanupTestDir(testDir);
  }
});
