import Conf from 'conf';

const config = new Conf({
  projectName: 'gitsage',
  defaults: {
    aiProvider: 'openai',
    openai: {
      apiKey: '',
      model: 'gpt-4',
    },
    anthropic: {
      apiKey: '',
      model: 'claude-3-opus',
    },
  },
});

export interface Config {
  aiProvider: 'openai' | 'anthropic';
  openai: {
    apiKey: string;
    model: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
  };
}

export function getConfig(): Config {
  return config.store as Config;
}

export function setConfig(key: string, value: any) {
  config.set(key, value);
}

export default config;
