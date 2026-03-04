import chalk from 'chalk';
import fetch from 'node-fetch';
import { ProxyAgent } from 'proxy-agent';
import { spawnSync } from 'child_process';
import { URL } from 'url';
import dns from 'dns';
import git from '../git.js';
import { getConfig } from '../config.js';

type CheckResult = { name: string; ok: boolean; info?: string };

async function checkGit(): Promise<CheckResult[]> {
  const out: CheckResult[] = [];
  const isRepo = await git.isRepo();
  out.push({ name: 'Git repository', ok: isRepo, info: isRepo ? 'OK' : 'Not a git repo' });
  if (isRepo) {
    try {
      const branch = await git.getCurrentBranch();
      out.push({ name: 'Current branch', ok: true, info: branch });
    } catch {
      out.push({ name: 'Current branch', ok: false, info: 'Unknown' });
    }
  }
  const gh = spawnSync('gh', ['--version'], { encoding: 'utf8' });
  out.push({ name: 'GitHub CLI (gh)', ok: gh.status === 0, info: gh.status === 0 ? gh.stdout.split('\n')[0] : 'Not found' });
  return out;
}

function maskKey(key?: string) {
  if (!key) return '';
  if (key.length <= 6) return '***';
  return key.slice(0, 3) + '***' + key.slice(-3);
}

async function checkAI(verbose = false): Promise<CheckResult[]> {
  const cfg = getConfig();
  const out: CheckResult[] = [];
  out.push({ name: 'AI provider', ok: true, info: cfg.aiProvider });
  if (cfg.aiProvider === 'openai') {
    const apiKey = cfg.openai.apiKey || process.env.OPENAI_API_KEY || '';
    const base = (cfg.openai.baseURL && cfg.openai.baseURL.trim()) || 'https://api.openai.com';
    out.push({ name: 'OpenAI key', ok: !!apiKey, info: apiKey ? maskKey(apiKey) : 'Missing (using env OPENAI_API_KEY if set)' });
    out.push({ name: 'OpenAI baseURL', ok: true, info: base });
    const net = await tryReach(base, verbose);
    out.push({ name: 'Network to baseURL', ok: net.ok, info: net.info });
  } else {
    const apiKey = cfg.anthropic.apiKey || process.env.ANTHROPIC_API_KEY || '';
    const base = (cfg.anthropic.baseURL && cfg.anthropic.baseURL.trim()) || 'https://api.anthropic.com';
    out.push({ name: 'Anthropic key', ok: !!apiKey, info: apiKey ? maskKey(apiKey) : 'Missing (using env ANTHROPIC_API_KEY if set)' });
    out.push({ name: 'Anthropic baseURL', ok: true, info: base });
    const net = await tryReach(base, verbose);
    out.push({ name: 'Network to baseURL', ok: net.ok, info: net.info });
  }
  const proxies = ['HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY'].map((k) => `${k}=${process.env[k] ?? ''}`).join(' ');
  out.push({ name: 'Proxy env', ok: true, info: proxies.trim() || '(empty)' });
  return out;
}

async function tryReach(base: string, verbose = false): Promise<{ ok: boolean; info: string }> {
  const url = base.replace(/\/+$/, '');
  try {
    if (verbose) {
      const u = new URL(url);
      const host = u.hostname;
      try {
        const records = await dns.promises.lookup(host);
        console.log(chalk.gray(`DNS ${host} -> ${records.address}`));
      } catch (e: any) {
        console.log(chalk.yellow(`DNS lookup failed for ${host}: ${e?.message || 'Unknown error'}`));
      }
    }
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2000);
    // We don't require 200; any HTTP response indicates basic reachability
    const agent = new ProxyAgent() as any;
    const res = await fetch(url, { method: 'GET', signal: controller.signal, agent });
    clearTimeout(t);
    return { ok: true, info: `HTTP ${res.status}` };
  } catch (e: any) {
    return { ok: false, info: e?.message || 'Network error' };
  }
}

export async function runDoctor(opts?: { verbose?: boolean }): Promise<void> {
  const checks: CheckResult[] = [];
  checks.push(...await checkGit());
  checks.push(...await checkAI(!!opts?.verbose));

  const okAll = checks.every(c => c.ok);
  for (const c of checks) {
    const tag = c.ok ? chalk.green('OK') : chalk.red('FAIL');
    const info = c.info ? ` - ${c.info}` : '';
    console.log(`${tag} ${c.name}${info}`);
  }
  if (!okAll) {
    console.log(chalk.yellow('\nSome checks failed. See above for details.'));
    console.log(chalk.gray('Hints: set API keys (gitsage config set ...), set openai.baseURL for China-friendly endpoints, configure proxies if needed.'));
  } else {
    console.log(chalk.green('\nEverything looks good.'));
  }
}

export default { runDoctor };
