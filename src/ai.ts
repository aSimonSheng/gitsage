import fetch from 'node-fetch';
import { getConfig } from './config.js';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class AIClient {
  async generateCommitMessage(diff: string): Promise<string> {
    const prompt = `
Generate a concise, conventional commit message for the following changes.
Follow the format: <type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

Keep it under 72 characters. Only return the commit message, nothing else.

Git diff:
${diff}
    `.trim();

    return this.complete([
      { role: 'system', content: 'You are a helpful assistant that generates clear git commit messages.' },
      { role: 'user', content: prompt },
    ]);
  }

  async analyzeChanges(diff: string): Promise<string> {
    const prompt = `
Analyze these git changes and provide:
1. Summary of what was changed
2. Potential impact
3. Suggestions for improvement

Be concise and practical.

Git diff:
${diff}
    `.trim();

    return this.complete([
      { role: 'system', content: 'You are an expert code reviewer.' },
      { role: 'user', content: prompt },
    ]);
  }

  async complete(messages: AIMessage[]): Promise<string> {
    const config = getConfig();

    if (config.aiProvider === 'openai') {
      return this.openAIComplete(messages);
    } else {
      return this.anthropicComplete(messages);
    }
  }

  private async openAIComplete(messages: AIMessage[]): Promise<string> {
    const config = getConfig();
    const apiKey = config.openai.apiKey || process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured. Use "gitsage config set openai.apiKey <key>"');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: config.openai.model,
        messages,
        temperature: 0.7,
      }),
    });

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

    const response = await fetch('https://api.anthropic.com/v1/messages', {
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
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${error}`);
    }

    const data: any = await response.json();
    return data.content[0].text.trim();
  }
}

export default new AIClient();
