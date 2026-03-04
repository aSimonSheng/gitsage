import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import git from '../git.js';

const TYPE_TITLES: Record<string, string> = {
  feat: 'Features',
  fix: 'Fixes',
  docs: 'Documentation',
  style: 'Styling',
  refactor: 'Refactoring',
  test: 'Tests',
  chore: 'Chores',
  perf: 'Performance',
  ci: 'CI',
  build: 'Build',
  revert: 'Reverts',
};

function parseType(msg: string): { type: string | null; scope: string | null; subject: string; breaking: boolean } {
  const m = msg.match(/^(\w+)(\(([^)]+)\))?(!)?:\s(.+)/);
  if (!m) return { type: null, scope: null, subject: msg, breaking: false };
  const type = m[1];
  const scope = m[3] || null;
  const subject = m[5];
  const breaking = Boolean(m[4]) || /BREAKING CHANGE:/i.test(msg);
  return { type, scope, subject, breaking };
}

export async function generateChangelog(since?: string): Promise<string> {
  const sinceRef = since || (await git.getLastTag()) || undefined;
  const log = await git.getLogSince(sinceRef);
  const groups: Record<string, string[]> = {};
  const breakingChanges: string[] = [];
  for (const entry of log) {
    const parsed = parseType(entry.message);
    if (parsed.breaking) {
      breakingChanges.push(`- ${parsed.subject} (${entry.hash.slice(0, 7)})`);
    }
    if (!parsed.type || !(parsed.type in TYPE_TITLES)) continue;
    const title = TYPE_TITLES[parsed.type];
    groups[title] = groups[title] || [];
    groups[title].push(`- ${parsed.subject} (${entry.hash.slice(0, 7)})`);
  }
  const lines: string[] = [];
  lines.push('## Changelog');
  if (sinceRef) {
    lines.push(`_since ${sinceRef}_`);
  }
  if (breakingChanges.length) {
    lines.push('\n### Breaking Changes');
    lines.push(...breakingChanges);
  }
  for (const [title, items] of Object.entries(groups)) {
    if (!items.length) continue;
    lines.push(`\n### ${title}`);
    lines.push(...items);
  }
  if (lines.length === 1) {
    lines.push('_No conventional commits found._');
  }
  return lines.join('\n');
}

export async function suggestNextVersion(): Promise<string> {
  const lastTag = await git.getLastTag();
  const sinceRef = lastTag || undefined;
  const log = await git.getLogSince(sinceRef);
  let hasBreaking = false;
  let hasFeat = false;
  for (const entry of log) {
    const parsed = parseType(entry.message);
    if (parsed.breaking) hasBreaking = true;
    if (parsed.type === 'feat') hasFeat = true;
  }
  let current = '0.1.0';
  try {
    const pkgPath = join(process.cwd(), 'package.json');
    if (existsSync(pkgPath)) {
      const pkgJson = JSON.parse(readFileSync(pkgPath, 'utf8'));
      current = pkgJson.version || current;
    }
  } catch {
    // noop
  }
  const [major, minor, patch] = current.split('.').map((n: string) => parseInt(n, 10) || 0);
  if (hasBreaking) {
    return `${major + 1}.0.0`;
  }
  if (hasFeat) {
    return `${major}.${minor + 1}.0`;
  }
  return `${major}.${minor}.${patch + 1}`;
}
