import { test } from 'node:test';
import assert from 'node:assert';
import { spawnSync, execSync } from 'child_process';
import { mkdirSync, rmSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

const hookPath = join(process.cwd(), 'src', 'session-start.sh');
const testDir = join(process.cwd(), 'test-session-start');

test.beforeEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true });
  }
  mkdirSync(testDir, { recursive: true });
});

test.afterEach(() => {
  if (existsSync(testDir)) {
    rmSync(testDir, { recursive: true });
  }
});

function runHook(cwd = testDir) {
  const result = spawnSync('bash', [hookPath], {
    cwd,
    encoding: 'utf-8',
    env: { ...process.env, LANG: 'en_US.UTF-8' }
  });
  return result;
}

test('session-start - outputs valid JSON', () => {
  const result = runHook();

  assert.strictEqual(result.status, 0, 'Hook should exit with code 0');
  assert.ok(result.stdout, 'Hook should output to stdout');

  const output = JSON.parse(result.stdout);
  assert.ok(output.hookSpecificOutput, 'Should have hookSpecificOutput');
  assert.strictEqual(output.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.ok(output.hookSpecificOutput.additionalContext, 'Should have additionalContext');
});

test('session-start - includes time in output', () => {
  const result = runHook();
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('Time:'), 'Should include Time');
  assert.ok(/\d{2}:\d{2}/.test(context), 'Should include time in HH:MM format');
});

test('session-start - includes Git status in output', () => {
  const result = runHook();
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('Git:'), 'Should include Git status');
});

test('session-start - handles no git repo gracefully', () => {
  // Run in /tmp to ensure we're not in a git repo
  const result = spawnSync('bash', [hookPath], {
    cwd: '/tmp',
    encoding: 'utf-8',
    env: { ...process.env, LANG: 'en_US.UTF-8' }
  });

  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('Git: no repo'), 'Should say "no repo" when not in git');
});

test('session-start - detects git repo and branch', () => {
  // Initialize git repo
  execSync('git init', { cwd: testDir });
  execSync('git config user.email "test@test.com"', { cwd: testDir });
  execSync('git config user.name "Test"', { cwd: testDir });
  execSync('git checkout -b test-branch', { cwd: testDir });
  writeFileSync(join(testDir, 'test.txt'), 'test');
  execSync('git add .', { cwd: testDir });
  execSync('git commit -m "initial"', { cwd: testDir });

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('Git: test-branch'), 'Should include branch name');
});

test('session-start - detects clean working tree', () => {
  // Initialize git repo
  execSync('git init', { cwd: testDir });
  execSync('git config user.email "test@test.com"', { cwd: testDir });
  execSync('git config user.name "Test"', { cwd: testDir });
  writeFileSync(join(testDir, 'test.txt'), 'test');
  execSync('git add .', { cwd: testDir });
  execSync('git commit -m "initial"', { cwd: testDir });

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('(clean)'), 'Should say clean when no uncommitted changes');
});

test('session-start - detects dirty working tree', () => {
  // Initialize git repo
  execSync('git init', { cwd: testDir });
  execSync('git config user.email "test@test.com"', { cwd: testDir });
  execSync('git config user.name "Test"', { cwd: testDir });
  writeFileSync(join(testDir, 'test.txt'), 'test');
  execSync('git add .', { cwd: testDir });
  execSync('git commit -m "initial"', { cwd: testDir });

  // Make uncommitted change
  writeFileSync(join(testDir, 'test.txt'), 'modified');

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('(dirty)'), 'Should say dirty when uncommitted changes');
});

test('session-start - detects commits ahead of upstream', () => {
  // Initialize git repo with upstream
  execSync('git init --bare upstream.git', { cwd: testDir });
  execSync('git clone upstream.git local', { cwd: testDir });
  const localDir = join(testDir, 'local');
  execSync('git config user.email "test@test.com"', { cwd: localDir });
  execSync('git config user.name "Test"', { cwd: localDir });

  writeFileSync(join(localDir, 'test.txt'), 'test');
  execSync('git add .', { cwd: localDir });
  execSync('git commit -m "commit 1"', { cwd: localDir });
  execSync('git push origin master', { cwd: localDir });

  // Add commits ahead of upstream
  writeFileSync(join(localDir, 'test2.txt'), 'test2');
  execSync('git add .', { cwd: localDir });
  execSync('git commit -m "commit 2"', { cwd: localDir });

  const result = runHook(localDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('↑1'), 'Should show 1 commit ahead');
});

test('session-start - handles detached HEAD', () => {
  // Initialize git repo
  execSync('git init', { cwd: testDir });
  execSync('git config user.email "test@test.com"', { cwd: testDir });
  execSync('git config user.name "Test"', { cwd: testDir });
  writeFileSync(join(testDir, 'test.txt'), 'test');
  execSync('git add .', { cwd: testDir });
  execSync('git commit -m "initial"', { cwd: testDir });
  const commitHash = execSync('git rev-parse HEAD', { cwd: testDir, encoding: 'utf-8' }).trim();

  // Detach HEAD (suppress warnings)
  execSync(`git checkout ${commitHash}`, {
    cwd: testDir,
    stdio: 'pipe'  // Suppress git warnings
  });

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  // In detached HEAD, git branch --show-current returns empty, script should use "detached"
  assert.ok(context.includes('Git: detached'), 'Should say detached when HEAD is detached');
});

test('session-start - output format is concise', () => {
  const result = runHook();
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  // Should be one line with pipe separators
  assert.ok(context.includes('|'), 'Should use pipe separators');
  assert.ok(context.split('\n').length === 1, 'Should be one line');
  assert.ok(context.length < 200, 'Should be concise (< 200 chars)');
});

test('session-start - shows marks when progress files exist', () => {
  // Create memory directory with a progress file
  const memoryDir = join(testDir, '.claude-tailor', 'memory');
  mkdirSync(memoryDir, { recursive: true });
  writeFileSync(join(memoryDir, 'progress-auth.jsonl'), '{"ts":"2025-01-01"}');

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('Marks:'), 'Should show Marks section');
  assert.ok(context.includes('auth'), 'Should include progress file name');
});

test('session-start - shows reflection hint when >10 unanalyzed', () => {
  // Create memory directory with 15 unanalyzed reflections
  const memoryDir = join(testDir, '.claude-tailor', 'memory');
  mkdirSync(memoryDir, { recursive: true });

  let reflectionsContent = '';
  for (let i = 0; i < 15; i++) {
    reflectionsContent += `{"id":"${i}","error_type":"typeerror"}\n`;
  }
  writeFileSync(join(memoryDir, 'reflections.jsonl'), reflectionsContent);

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('Reflections:'), 'Should show Reflections section');
  assert.ok(context.includes('15 pending'), 'Should show count of unanalyzed');
  assert.ok(context.includes('/reflect'), 'Should suggest /reflect command');
});

test('session-start - hides reflection hint when ≤10 unanalyzed', () => {
  // Create memory directory with 10 unanalyzed reflections (boundary)
  const memoryDir = join(testDir, '.claude-tailor', 'memory');
  mkdirSync(memoryDir, { recursive: true });

  let reflectionsContent = '';
  for (let i = 0; i < 10; i++) {
    reflectionsContent += `{"id":"${i}","error_type":"typeerror"}\n`;
  }
  writeFileSync(join(memoryDir, 'reflections.jsonl'), reflectionsContent);

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(!context.includes('Reflections:'), 'Should NOT show Reflections hint for ≤10');
  assert.ok(!context.includes('/reflect'), 'Should NOT suggest /reflect');
});

test('session-start - counts only unanalyzed reflections', () => {
  // Create memory with 8 unanalyzed + 7 analyzed = 15 total
  const memoryDir = join(testDir, '.claude-tailor', 'memory');
  mkdirSync(memoryDir, { recursive: true });

  let reflectionsContent = '';
  // 8 unanalyzed
  for (let i = 0; i < 8; i++) {
    reflectionsContent += `{"id":"${i}","error_type":"typeerror"}\n`;
  }
  // 7 analyzed
  for (let i = 8; i < 15; i++) {
    reflectionsContent += `{"id":"${i}","error_type":"typeerror","analyzed":true}\n`;
  }
  writeFileSync(join(memoryDir, 'reflections.jsonl'), reflectionsContent);

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(!context.includes('Reflections:'), 'Should NOT show hint (only 8 unanalyzed)');
});

test('session-start - handles 11 unanalyzed exactly', () => {
  // Edge case: exactly 11 (minimum to trigger hint)
  const memoryDir = join(testDir, '.claude-tailor', 'memory');
  mkdirSync(memoryDir, { recursive: true });

  let reflectionsContent = '';
  for (let i = 0; i < 11; i++) {
    reflectionsContent += `{"id":"${i}","error_type":"typeerror"}\n`;
  }
  writeFileSync(join(memoryDir, 'reflections.jsonl'), reflectionsContent);

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;

  assert.ok(context.includes('Reflections:'), 'Should show hint at boundary (>10)');
  assert.ok(context.includes('11 pending'), 'Should show exact count');
});

test('session-start - no crash when reflections file missing', () => {
  // Create memory directory but NO reflections file
  const memoryDir = join(testDir, '.claude-tailor', 'memory');
  mkdirSync(memoryDir, { recursive: true });

  const result = runHook(testDir);
  assert.strictEqual(result.status, 0, 'Should exit cleanly without reflections file');

  const output = JSON.parse(result.stdout);
  const context = output.hookSpecificOutput.additionalContext;
  assert.ok(!context.includes('Reflections:'), 'Should NOT show Reflections hint');
});

test('session-start - reflection hint appears in systemMessage', () => {
  // Ensure hint is visible to user in systemMessage, not just additionalContext
  const memoryDir = join(testDir, '.claude-tailor', 'memory');
  mkdirSync(memoryDir, { recursive: true });

  let reflectionsContent = '';
  for (let i = 0; i < 12; i++) {
    reflectionsContent += `{"id":"${i}","error_type":"error"}\n`;
  }
  writeFileSync(join(memoryDir, 'reflections.jsonl'), reflectionsContent);

  const result = runHook(testDir);
  const output = JSON.parse(result.stdout);
  const systemMessage = output.systemMessage;

  assert.ok(systemMessage.includes('Reflections:'), 'Hint should appear in systemMessage');
  assert.ok(systemMessage.includes('12 pending'), 'Should show count in visible message');
});
