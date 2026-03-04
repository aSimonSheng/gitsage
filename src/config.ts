import Conf from 'conf';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const defaults = {
  aiProvider: 'openai',
  openai: {
    apiKey: '',
    model: 'gpt-4',
    baseURL: '',
    maxTokens: 512,
  },
  anthropic: {
    apiKey: '',
    model: 'claude-3-opus',
    baseURL: '',
    maxTokens: 1024,
  },
  ai: {
    requestTimeoutMs: 20000,
    maxDiffChars: 15000,
    chunkSizeChars: 8000,
    maxChunks: 3
  },
};

type ConfLike = { store: any; set: (key: string, value: any) => void };

function deepSet(obj: any, path: string, value: any) {
  const keys = path.split('.');
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
}

let config: ConfLike;
try {
  const projectName = 'gitsage';
  const envDir = process.env.GITSAGE_CONFIG_DIR;
  config = new Conf({
    projectName,
    ...(envDir ? { cwd: envDir } : {}),
    defaults,
  }) as unknown as ConfLike;
} catch {
  const fallbackPath =
    process.env.GITSAGE_CONFIG_DIR
      ? join(process.env.GITSAGE_CONFIG_DIR, 'config.json')
      : join(process.cwd(), '.gitsage', 'config.json');
  const dir = dirname(fallbackPath);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  let store: any = defaults;
  if (existsSync(fallbackPath)) {
    try {
      const raw = JSON.parse(readFileSync(fallbackPath, 'utf8'));
      store = { ...defaults, ...raw };
    } catch {
      store = defaults;
    }
  }
  config = {
    store,
    set: (key: string, value: any) => {
      deepSet(store, key, value);
      writeFileSync(fallbackPath, JSON.stringify(store, null, 2), 'utf8');
    },
  };
}

export interface Config {
  aiProvider: 'openai' | 'anthropic';
  openai: {
    apiKey: string;
    model: string;
    baseURL?: string;
    maxTokens?: number;
  };
  anthropic: {
    apiKey: string;
    model: string;
    baseURL?: string;
    maxTokens?: number;
  };
  ai: {
    requestTimeoutMs: number;
    maxDiffChars: number;
    chunkSizeChars: number;
    maxChunks: number;
  }
}

export function getConfig(): Config {
  return config.store as Config;
}

export function setConfig(key: string, value: any) {
  config.set(key, value);
}

export default config;
