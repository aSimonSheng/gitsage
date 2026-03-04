import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as prmod from '../../modules/pr';

vi.mock('../../git.js', () => {
  return {
    default: {
      getDiffRange: vi.fn(),
      getDiff: vi.fn(),
      getDiffUnstaged: vi.fn(),
    },
  };
});

vi.mock('../../ai.js', () => {
  return {
    default: {
      complete: vi.fn(),
    },
  };
});

const gitMock = await import('../../git.js');
const aiMock = await import('../../ai.js');
const getDiffRangeMock = gitMock.default.getDiffRange as unknown as ReturnType<typeof vi.fn>;

describe('PR generation with chunking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('splits large diff into chunks and combines', async () => {
    const big = 'A'.repeat(9000) + 'B'.repeat(9000) + 'C'.repeat(2000);
    getDiffRangeMock.mockResolvedValueOnce(big);
    const complete = aiMock.default.complete as unknown as ReturnType<typeof vi.fn>;
    complete
      .mockResolvedValueOnce('Summary for chunk 1')
      .mockResolvedValueOnce('Summary for chunk 2')
      .mockResolvedValueOnce('Summary for chunk 3')
      .mockResolvedValueOnce('Combined Title\nCombined body line 1\nCombined body line 2');
    const res = await prmod.generatePrTitleAndBody('origin/main');
    expect(complete).toHaveBeenCalledTimes(4);
    expect(res.title).toContain('Combined Title');
    expect(res.body).toMatch(/Combined body/);
  });
});
