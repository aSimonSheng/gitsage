import Conf from 'conf';

const config = new Conf({
  projectName: 'gitsage',
  defaults: {
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
      maxDiffChars: 15000
    }
  },
});

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
  }
}

export function getConfig(): Config {
  return config.store as Config;
}

export function setConfig(key: string, value: any) {
  config.set(key, value);
}

export default config;
