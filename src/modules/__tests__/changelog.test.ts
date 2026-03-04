import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import * as changelog from '../../modules/changelog';

// Mock git module imported as '../git.js' in changelog.ts
vi.mock('../../git.js', () => {
  return {
    default: {
      getLogSince: vi.fn(),
      getLastTag: vi.fn(),
    },
  };
});

const gitMock = await import('../../git.js');
const getLogSinceMock = gitMock.default.getLogSince as unknown as Mock;
const getLastTagMock = gitMock.default.getLastTag as unknown as Mock;

describe('changelog and version suggestion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('groups conventional commits into sections', async () => {
    getLogSinceMock.mockResolvedValueOnce([
      { hash: 'a1b2c3d', message: 'feat(api): add endpoint' },
      { hash: 'b2c3d4e', message: 'fix(core): null check' },
      { hash: 'c3d4e5f', message: 'docs: update usage' },
    ]);
    const md = await changelog.generateChangelog();
    expect(md).toMatch(/### Features/);
    expect(md).toMatch(/add endpoint/);
    expect(md).toMatch(/### Fixes/);
    expect(md).toMatch(/null check/);
    expect(md).toMatch(/### Documentation/);
  });

  it('suggests next version based on commit types', async () => {
    getLastTagMock.mockResolvedValueOnce(null);
    getLogSinceMock.mockResolvedValueOnce([
      { hash: 'a1', message: 'feat(ui): new button' },
      { hash: 'b2', message: 'chore: bump dep' },
    ]);
    const vMinor = await changelog.suggestNextVersion();
    expect(vMinor.endsWith('.0')).toBe(true);
  });

  it('prioritizes breaking changes for major bump', async () => {
    getLastTagMock.mockResolvedValueOnce(null);
    getLogSinceMock.mockResolvedValueOnce([
      { hash: 'a1', message: 'feat(api)!: break API' },
      { hash: 'b2', message: 'fix: bug' },
    ]);
    const vMajor = await changelog.suggestNextVersion();
    expect(vMajor.split('.')[1]).toBe('0'); // x.0.0
  });
});
