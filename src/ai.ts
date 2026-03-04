import fetch from 'node-fetch';
import { ProxyAgent } from 'proxy-agent';
import { getConfig } from './config.js';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIClient {
  private agent = new ProxyAgent() as any;
  async generateCommitMessage(diff: string): Promise<string> {
    const cfg = getConfig();
    const max = cfg.ai?.maxDiffChars ?? 15000;
    const safeDiff = diff.length > max ? diff.slice(0, max) + '\n[...diff truncated...]' : diff;
    const prompt = `
Generate a concise, conventional commit message for the following changes.
Follow the format: <type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

Keep it under 72 characters. Only return the commit message, nothing else.

Git diff:
${safeDiff}
    `.trim();

    return this.complete([
      { role: 'system', content: 'You are a helpful assistant that generates clear git commit messages.' },
      { role: 'user', content: prompt },
    ]);
  }

  async analyzeChanges(diff: string): Promise<string> {
    const cfg = getConfig();
    const max = cfg.ai?.maxDiffChars ?? 15000;
    const safeDiff = diff.length > max ? diff.slice(0, max) + '\n[...diff truncated...]' : diff;
    const prompt = `
Analyze these git changes and provide:
1. Summary of what was changed
2. Potential impact
3. Suggestions for improvement

Be concise and practical.

Git diff:
${safeDiff}
    `.trim();

    return this.complete([
      { role: 'system', content: 'You are an expert code reviewer.' },
      { role: 'user', content: prompt },
    ]);
  }

  async complete(messages: AIMessage[]): Promise<string> {
    const config = getConfig();
    if (config.aiProvider === 'openai') return this.openAIComplete(messages);
    return this.anthropicComplete(messages);
  }

  private async requestWithRetry(url: string, init: any, attempts = 3): Promise<any> {
    const cfg = getConfig();
    const timeoutMs = cfg.ai?.requestTimeoutMs ?? 20000;
    for (let i = 0; i < attempts; i++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { ...init, signal: controller.signal, agent: this.agent as any });
        clearTimeout(timer);
        if (res.status === 429 || res.status >= 500) {
          if (i < attempts - 1) {
            await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
            continue;
          }
        }
        return res;
      } catch (e) {
        clearTimeout(timer);
        if (i === attempts - 1) throw e;
        await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
      }
    }
    throw new Error('Unreachable');
  }

  private async openAIComplete(messages: AIMessage[]): Promise<string> {
    const config = getConfig();
    const apiKey = config.openai.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Use "gitsage config set openai.apiKey <key>"');
    }

    const base = (config.openai.baseURL && config.openai.baseURL.trim().replace(/\/+$/, '')) || 'https://api.openai.com';
    const url = `${base}/v1/chat/completions`;
    const response = await this.requestWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.openai.model,
          messages,
          temperature: 0.7,
          max_tokens: config.openai.maxTokens ?? 512,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data: any = await response.json();
    return data.choices[0].message.content.trim();
  }

  private async anthropicComplete(messages: AIMessage[]): Promise<string> {
    const config = getConfig();
    const apiKey = config.anthropic.apiKey || process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('Anthropic API key not configured. Use "gitsage config set anthropic.apiKey <key>"');
    }

    const systemMessage = messages.find(m => m.role === 'system')?.content || '';
    const conversationMessages = messages.filter(m => m.role !== 'system');

    const base = (config.anthropic.baseURL && config.anthropic.baseURL.trim().replace(/\/+$/, '')) || 'https://api.anthropic.com';
    const url = `${base}/v1/messages`;
    const response = await this.requestWithRetry(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: config.anthropic.model,
          system: systemMessage,
          messages: conversationMessages,
          max_tokens: config.anthropic.maxTokens ?? 1024,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data: any = await response.json();
    return data.content[0].text.trim();
  }
}

export default new AIClient();
