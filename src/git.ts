import simpleGit, { SimpleGit } from 'simple-git';

export class GitClient {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit();
  }

  async isRepo(): Promise<boolean> {
    try {
      await this.git.revparse(['--is-inside-work-tree']);
      return true;
    } catch {
      return false;
    }
  }

  async getStatus(): Promise<string> {
    const status = await this.git.status();
    return status.toString();
  }

  async getDiff(): Promise<string> {
    return await this.git.diff(['--staged']);
  }

  async getDiffUnstaged(): Promise<string> {
    return await this.git.diff();
  }

  async getDiffRange(range: string): Promise<string> {
    return await this.git.diff([range]);
  }

  async commit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  async addAll(): Promise<void> {
    await this.git.add('.');
  }

  async getRecentCommits(count: number = 10): Promise<string> {
    const log = await this.git.log({ maxCount: count });
    return log.all.map((commit) => `${commit.hash.substring(0, 7)} - ${commit.message}`).join('\n');
  }

  async getLogSince(ref?: string) {
    if (ref) {
      const log = await this.git.log({ from: ref, to: 'HEAD' });
      return log.all;
    }
    const log = await this.git.log();
    return log.all;
  }

  async getLastTag(): Promise<string | null> {
    try {
      const tags = await this.git.tags();
      if (!tags?.all?.length) return null;
      return tags.latest || tags.all[tags.all.length - 1];
    } catch {
      return null;
    }
  }
}

export default new GitClient();
