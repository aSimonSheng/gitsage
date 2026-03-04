#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync, readFileSync as fsReadFileSync, writeFileSync, chmodSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { mkdtempSync } from 'fs';
import { spawnSync } from 'child_process';
import { getConfig, setConfig } from './config.js';
import git from './git.js';
import ai from './ai.js';
import { validateCommitMessage, explainValidation } from './modules/guard.js';
import { generatePrTitleAndBody } from './modules/pr.js';
import { generateChangelog, suggestNextVersion } from './modules/changelog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let pkgVersion = '0.0.0';
try {
  const pkgPath = join(__dirname, '../package.json');
  if (existsSync(pkgPath)) {
    const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
    pkgVersion = pkgJson.version || pkgVersion;
  }
} catch {
  // noop
}

const program = new Command();

program
  .name('gitsage')
  .description('AI-powered Git companion')
  .version(pkgVersion);

function printBanner() {
  console.log(chalk.cyan(`
   ____ _ _     ____
  / ___(_) |_  / ___| __ _  __ _  ___
 | |  _| | __| \\___ \\/ _\` |/ _\` |/ _ \\
 | |_| | | |_   ___) | (_| | (_| |  __/
  \\____|_|\\__| |____/ \\__,_|\\__, |\\___|
                                 |___/
`));
  console.log(chalk.gray('  Your AI-powered Git companion\n'));
}

program
  .command('commit')
  .alias('c')
  .description('AI-assisted git commit with auto-generated message')
  .option('-a, --add', 'Add all changes first')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (options) => {
    printBanner();

    if (!(await git.isRepo())) {
      console.log(chalk.red('Error: Not a git repository'));
      process.exit(1);
    }

    if (options.add) {
      const spinner = ora('Adding all changes...').start();
      await git.addAll();
      spinner.succeed('Added all changes');
    }

    const diff = await git.getDiff();
    const unstagedDiff = await git.getDiffUnstaged();

    if (!diff && !unstagedDiff) {
      console.log(chalk.yellow('No changes to commit'));
      process.exit(0);
    }

    if (!diff && unstagedDiff) {
      console.log(chalk.yellow('Warning: Unstaged changes found. Use --add to include them.'));
    }

    const spinner = ora('Generating commit message...').start();
    try {
      const message = await ai.generateCommitMessage(diff || unstagedDiff);
      spinner.succeed('Generated commit message');

      console.log('\n' + chalk.green('Commit message:'));
      console.log(chalk.white(`  ${message}\n`));

      if (!options.yes) {
        const answer = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'confirm',
            message: 'Commit with this message?',
            default: true,
          },
        ]);

        if (!answer.confirm) {
          console.log(chalk.yellow('Commit cancelled'));
          process.exit(0);
        }
      }

      const commitSpinner = ora('Committing...').start();
      await git.commit(message);
      commitSpinner.succeed(chalk.green('Committed successfully!'));
    } catch (error: any) {
      spinner.fail('Failed');
      console.log(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command('analyze')
  .alias('a')
  .description('Analyze current changes')
  .action(async () => {
    printBanner();

    if (!(await git.isRepo())) {
      console.log(chalk.red('Error: Not a git repository'));
      process.exit(1);
    }

    const diff = await git.getDiff() || await git.getDiffUnstaged();

    if (!diff) {
      console.log(chalk.yellow('No changes to analyze'));
      process.exit(0);
    }

    const spinner = ora('Analyzing changes...').start();
    try {
      const analysis = await ai.analyzeChanges(diff);
      spinner.succeed('Analysis complete');

      console.log('\n' + chalk.cyan('Analysis:'));
      console.log(chalk.gray('──────────────────────────────'));
      console.log(analysis);
      console.log(chalk.gray('──────────────────────────────\n'));
    } catch (error: any) {
      spinner.fail('Failed');
      console.log(chalk.red(error.message));
      process.exit(1);
    }
  });

const configCmd = program.command('config').description('Configure GitSage');
configCmd
  .command('list')
  .description('List current configuration')
  .action(() => {
    console.log(chalk.cyan('\nCurrent configuration:'));
    console.log(chalk.gray('──────────────────────────────'));
    console.log(JSON.stringify(getConfig(), null, 2));
    console.log(chalk.gray('──────────────────────────────\n'));
  });

configCmd
  .command('set <key> <value>')
  .description('Set a configuration value')
  .action((key: string, value: string) => {
    setConfig(key, value);
    console.log(chalk.green(`Set ${key} = ${value}`));
  });

program
  .command('guard')
  .description('Validate or fix a commit message (Conventional Commits)')
  .argument('[message]', 'Commit message to validate')
  .option('--file <path>', 'Read commit message from file and optionally write back')
  .option('--fix', 'If invalid, auto-generate a valid message from diff')
  .option('--explain', 'Explain validation results')
  .action(async (message: string | undefined, options: { file?: string; fix?: boolean; explain?: boolean }) => {
    let msg = message;
    if (options.file) {
      try {
        msg = fsReadFileSync(options.file, 'utf8').trim();
      } catch (e) {
        console.log(chalk.red(`Cannot read file: ${options.file}`));
        process.exit(1);
      }
    }
    if (!msg) {
      console.log(chalk.yellow('No message provided; validating generated suggestion from diff...'));
      const diff = await git.getDiff() || await git.getDiffUnstaged();
      if (!diff) {
        console.log(chalk.red('No changes to infer a message from.'));
        process.exit(1);
      }
      msg = await ai.generateCommitMessage(diff);
      console.log(chalk.gray(`Suggested: ${msg}`));
    }

    const valid = validateCommitMessage(msg);
    if (valid) {
      console.log(chalk.green('✅ Commit message is valid.'));
      if (options.file) {
        // Ensure file content remains as is if valid
      }
      process.exit(0);
    }

    console.log(chalk.red('❌ Commit message is invalid.'));
    if (options.explain) {
      console.log(explainValidation(msg));
    }

    if (options.fix) {
      const diff = await git.getDiff() || await git.getDiffUnstaged();
      const fixed = await ai.generateCommitMessage(diff || '');
      console.log(chalk.yellow(`Fixed message: ${fixed}`));
      if (options.file) {
        writeFileSync(options.file, fixed + '\n', 'utf8');
        console.log(chalk.green(`Rewrote ${options.file}`));
      }
      process.exit(0);
    } else {
      process.exit(2);
    }
  });

const hookCmd = program.command('hook').description('Manage git hooks for GitSage');
hookCmd
  .command('install')
  .description('Install commit-msg hook that validates commit messages')
  .action(async () => {
    if (!(await git.isRepo())) {
      console.log(chalk.red('Error: Not a git repository'));
      process.exit(1);
    }
    const hookPath = join(process.cwd(), '.git', 'hooks', 'commit-msg');
    const script = `#!/bin/sh
# GitSage commit message guard
if command -v gitsage >/dev/null 2>&1; then
  gitsage guard --file "$1" --explain || exit 1
else
  echo "gitsage not found; skipping guard" >&2
fi
`;
    writeFileSync(hookPath, script, 'utf8');
    chmodSync(hookPath, 0o755);
    console.log(chalk.green('Installed commit-msg hook.'));
  });
hookCmd
  .command('uninstall')
  .description('Remove commit-msg hook installed by GitSage')
  .action(async () => {
    if (!(await git.isRepo())) {
      console.log(chalk.red('Error: Not a git repository'));
      process.exit(1);
    }
    const hookPath = join(process.cwd(), '.git', 'hooks', 'commit-msg');
    try {
      unlinkSync(hookPath);
      console.log(chalk.green('Removed commit-msg hook.'));
    } catch {
      console.log(chalk.yellow('No commit-msg hook to remove.'));
    }
  });

program
  .command('pr')
  .description('Generate PR title and description from changes')
  .option('--base <ref>', 'Compare base ref, e.g., origin/main', 'origin/main')
  .option('--write <path>', 'Write PR description markdown to file')
  .option('--push', 'Push current branch to origin before creating PR')
  .option('--open', 'Create PR via GitHub CLI after generation')
  .action(async (options: { base: string; write?: string; push?: boolean; open?: boolean }) => {
    printBanner();
    if (!(await git.isRepo())) {
      console.log(chalk.red('Error: Not a git repository'));
      process.exit(1);
    }
    const spinner = ora('Generating PR title and description...').start();
    try {
      const { title, body } = await generatePrTitleAndBody(options.base);
      spinner.succeed('Generated PR content');
      console.log(chalk.green('\nTitle:\n'), title);
      console.log(chalk.cyan('\nDescription:\n'));
      console.log(body);
      if (options.write) {
        writeFileSync(options.write, `# ${title}\n\n${body}\n`, 'utf8');
        console.log(chalk.gray(`\nWritten to ${options.write}`));
      }
      if (options.push || options.open) {
        const branch = await git.getCurrentBranch();
        if (options.push) {
          const pushed = await git.pushOrigin(branch, true);
          if (pushed) {
            console.log(chalk.green(`Pushed branch ${branch} to origin`));
          } else {
            console.log(chalk.yellow(`Failed to push branch ${branch}; please push manually.`));
          }
        }
        if (options.open) {
          const dir = mkdtempSync(`${tmpdir()}/gitsage-`);
          const prBodyPath = join(dir, 'PR_BODY.md');
          writeFileSync(prBodyPath, `${body}\n`, 'utf8');
          const args = ['pr', 'create', '-t', title, '-F', prBodyPath, '-f'];
          const res = spawnSync('gh', args, { stdio: 'inherit' });
          if (res.status === 0) {
            console.log(chalk.green('PR created successfully.'));
          } else {
            console.log(chalk.red('Failed to create PR via GitHub CLI.'));
          }
        }
      }
    } catch (e: any) {
      spinner.fail('Failed');
      console.log(chalk.red(e.message));
      process.exit(1);
    }
  });

program
  .command('changelog')
  .description('Generate changelog from conventional commits')
  .option('--since <ref>', 'Generate since a git ref (tag or commit)')
  .option('--write <path>', 'Write changelog to file instead of stdout')
  .action(async (options: { since?: string; write?: string }) => {
    const spinner = ora('Generating changelog...').start();
    try {
      const markdown = await generateChangelog(options.since);
      spinner.succeed('Changelog ready');
      if (options.write) {
        writeFileSync(options.write, markdown + '\n', 'utf8');
        console.log(chalk.gray(`Written to ${options.write}`));
      } else {
        console.log('\n' + markdown);
      }
    } catch (e: any) {
      spinner.fail('Failed');
      console.log(chalk.red(e.message));
      process.exit(1);
    }
  });

program
  .command('release')
  .description('Suggest next semantic version based on commits since last tag')
  .action(async () => {
    const spinner = ora('Analyzing commits for next version...').start();
    try {
      const next = await suggestNextVersion();
      spinner.succeed('Analysis complete');
      console.log(chalk.green(`Suggested next version: ${next}`));
    } catch (e: any) {
      spinner.fail('Failed');
      console.log(chalk.red(e.message));
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Interactive setup for GitSage (provider, API key, commit hook)')
  .action(async () => {
    printBanner();
    if (!(await git.isRepo())) {
      console.log(chalk.red('Error: Not a git repository'));
      process.exit(1);
    }
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Choose AI provider',
        choices: [
          { name: 'OpenAI', value: 'openai' },
          { name: 'Anthropic', value: 'anthropic' },
        ],
        default: 'openai',
      },
      {
        type: 'input',
        name: 'apiKey',
        message: (a: any) => `Enter ${a.provider} API key (leave blank to use environment variable)`,
        filter: (v: string) => v.trim(),
      },
      {
        type: 'confirm',
        name: 'installHook',
        message: 'Install commit-msg hook to enforce Conventional Commits?',
        default: true,
      },
    ]);
    setConfig('aiProvider', answers.provider);
    if (answers.provider === 'openai') {
      if (answers.apiKey) setConfig('openai.apiKey', answers.apiKey);
    } else {
      if (answers.apiKey) setConfig('anthropic.apiKey', answers.apiKey);
    }
    if (answers.installHook) {
      const hookPath = join(process.cwd(), '.git', 'hooks', 'commit-msg');
      const script = `#!/bin/sh
# GitSage commit message guard
if command -v gitsage >/dev/null 2>&1; then
  gitsage guard --file "$1" --explain || exit 1
else
  echo "gitsage not found; skipping guard" >&2
fi
`;
      writeFileSync(hookPath, script, 'utf8');
      chmodSync(hookPath, 0o755);
      console.log(chalk.green('Installed commit-msg hook.'));
    }
    console.log(chalk.green('GitSage is configured. Happy committing!'));
  });

program.parse();
