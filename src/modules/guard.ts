const TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'test',
  'chore',
  'perf',
  'ci',
  'build',
  'revert',
];

export function validateCommitMessage(message: string): boolean {
  const conventional = new RegExp(
    `^(${TYPES.join('|')})(\\([\\w\\-.]+\\))?!?:\\s.{1,72}$`
  );
  return conventional.test(message.trim());
}

export function explainValidation(message: string): string {
  const parts: string[] = [];
  const msg = message.trim();
  if (msg.length === 0) {
    parts.push('- Message is empty.');
  }
  const typeMatch = new RegExp(`^(${TYPES.join('|')})`).test(msg);
  if (!typeMatch) {
    parts.push(`- Must start with one of: ${TYPES.join(', ')}`);
  }
  const scopeOk = /\([\w\-.]+\)/.test(msg) || /: /.test(msg);
  if (!scopeOk) {
    parts.push('- Missing scope parentheses before colon, e.g., feat(api): ...');
  }
  const colonOk = /: /.test(msg);
  if (!colonOk) {
    parts.push('- Must contain ": " separating header and description.');
  }
  const desc = msg.split(': ').slice(1).join(': ');
  if (!desc || desc.length === 0) {
    parts.push('- Missing short description after colon.');
  } else if (desc.length > 72) {
    parts.push('- Description should be <= 72 characters.');
  }
  if (parts.length === 0) {
    return 'Looks good.';
  }
  return ['Commit message issues:', ...parts].join('\n');
}
