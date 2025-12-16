#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cwd = process.cwd();

// Parse command-line arguments
function parseArgs(args) {
  const opts = {
    dryRun: false,
    force: false,
    claudeMd: null // null means interactive/merge default
  };

  for (const arg of args) {
    if (arg === '--dry-run' || arg === '-n') {
      opts.dryRun = true;
    } else if (arg === '--force' || arg === '-f') {
      opts.force = true;
    } else if (arg.startsWith('--claude-md=')) {
      const value = arg.split('=')[1];
      if (['skip', 'overwrite', 'merge'].includes(value)) {
        opts.claudeMd = value;
      }
    }
  }

  return opts;
}

// Interactive prompt for CLAUDE.md decision
async function promptClaudeMd() {
  if (!process.stdin.isTTY) {
    return 'merge';
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('CLAUDE.md exists. Choose action: (s)kip, (o)verwrite, (m)erge [default: merge]: ', (answer) => {
      rl.close();
      const choice = answer.trim().toLowerCase();
      if (choice === 's' || choice === 'skip') resolve('skip');
      else if (choice === 'o' || choice === 'overwrite') resolve('overwrite');
      else resolve('merge');
    });
  });
}

const options = parseArgs(process.argv.slice(2));

async function main() {
  if (options.dryRun) {
    console.log('[DRY RUN] Would install tailor-nano...');
  } else {
    console.log('Installing tailor-nano...');
  }

  // 1. Create directories
  const memoryDir = join(cwd, '.claude-tailor', 'memory');
  const commandsDir = join(cwd, '.claude', 'commands');

  if (options.dryRun) {
    console.log(`[DRY RUN] Would create directory: ${memoryDir}`);
    console.log(`[DRY RUN] Would create directory: ${commandsDir}`);
  } else {
    mkdirSync(memoryDir, { recursive: true });
    mkdirSync(commandsDir, { recursive: true });
  }

  // 2. Copy hooks and make them executable
  const hookPath = join(cwd, '.claude-tailor', 'hook.js');
  const sessionStartPath = join(cwd, '.claude-tailor', 'session-start.sh');

  if (options.dryRun) {
    console.log(`[DRY RUN] Would copy hook.js to ${hookPath}`);
    console.log(`[DRY RUN] Would copy session-start.sh to ${sessionStartPath}`);
  } else {
    if (!options.force && existsSync(hookPath)) {
      console.log('hook.js already exists (use --force to overwrite)');
    } else {
      cpSync(join(__dirname, 'hook.js'), hookPath);
      chmodSync(hookPath, 0o755);
    }

    if (!options.force && existsSync(sessionStartPath)) {
      console.log('session-start.sh already exists (use --force to overwrite)');
    } else {
      cpSync(join(__dirname, 'session-start.sh'), sessionStartPath);
      chmodSync(sessionStartPath, 0o755);
    }
  }

  // 3. Copy commands
  const commands = ['mark.md', 'recall.md', 'test.md', 'reflect.md'];

  if (options.dryRun) {
    commands.forEach(cmd => {
      console.log(`[DRY RUN] Would copy ${cmd} to ${join(commandsDir, cmd)}`);
    });
  } else {
    commands.forEach(cmd => {
      const targetCmd = join(commandsDir, cmd);
      if (!options.force && existsSync(targetCmd)) {
        console.log(`${cmd} already exists (use --force to overwrite)`);
      } else {
        cpSync(join(__dirname, '..', 'commands', cmd), targetCmd);
      }
    });
  }

  // 4. Copy or append CLAUDE.md
  const templatePath = join(__dirname, '..', 'templates', 'CLAUDE.md.template');
  const targetPath = join(cwd, 'CLAUDE.md');
  const template = readFileSync(templatePath, 'utf-8');

  if (existsSync(targetPath)) {
    let action = options.claudeMd;
    if (!action) {
      action = await promptClaudeMd();
    }

    if (options.dryRun) {
      console.log(`[DRY RUN] CLAUDE.md exists, would ${action}`);
    } else {
      if (action === 'skip') {
        console.log('Skipped CLAUDE.md (already exists)');
      } else if (action === 'overwrite') {
        writeFileSync(targetPath, template);
        console.log('Overwrote CLAUDE.md');
      } else { // merge
        const existing = readFileSync(targetPath, 'utf-8');
        if (!existing.includes('tailor-nano')) {
          writeFileSync(targetPath, existing + '\n\n' + template);
          console.log('Appended patterns to existing CLAUDE.md');
        } else {
          console.log('CLAUDE.md already contains tailor-nano patterns');
        }
      }
    }
  } else {
    if (options.dryRun) {
      console.log(`[DRY RUN] Would create CLAUDE.md at ${targetPath}`);
    } else {
      writeFileSync(targetPath, template);
      console.log('Created CLAUDE.md');
    }
  }

  // 5. Merge hook into settings
  const settingsPath = join(cwd, '.claude', 'settings.local.json');
  let settings = { hooks: {} };

  if (existsSync(settingsPath)) {
    settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
  }

  // Add SessionStart hook
  const sessionStartHooks = settings.hooks?.SessionStart || [];
  const sessionStartExists = sessionStartHooks.some(h =>
    h.hooks?.some(hook => hook.command?.includes('session-start'))
  );

  if (!sessionStartExists) {
    if (options.dryRun) {
      console.log('[DRY RUN] Would register SessionStart hook in settings.local.json');
    } else {
      settings.hooks = settings.hooks || {};
      settings.hooks.SessionStart = settings.hooks.SessionStart || [];
      settings.hooks.SessionStart.push({
        hooks: [
          {
            type: 'command',
            command: './.claude-tailor/session-start.sh'
          }
        ]
      });
      writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
      console.log('Registered SessionStart hook in settings.local.json');
    }
  }

  if (options.dryRun) {
    console.log('\n[DRY RUN] Installation simulation complete!');
  } else {
    console.log('\nInstallation complete!');
    console.log('Restart Claude Code to activate.');
  }
}

main().catch(err => {
  console.error('Installation failed:', err.message);
  process.exit(1);
});
