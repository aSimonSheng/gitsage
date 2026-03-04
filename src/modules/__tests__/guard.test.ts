import { describe, it, expect } from 'vitest';
import { validateCommitMessage, explainValidation } from '../../modules/guard';

describe('validateCommitMessage', () => {
  it('accepts valid conventional messages', () => {
    const ok = [
      'feat(api): add user endpoint',
      'fix(parser)!: handle edge case',
      'docs: update README',
      'chore(repo): bump deps',
    ];
    for (const msg of ok) {
      expect(validateCommitMessage(msg)).toBe(true);
    }
  });

  it('rejects invalid messages', () => {
    const bad = ['update stuff', 'feat: ', 'feat():', 'feat - wrong'];
    for (const msg of bad) {
      expect(validateCommitMessage(msg)).toBe(false);
      expect(explainValidation(msg)).toMatch(/Commit message issues|Message is empty|Missing/);
    }
  });
});
