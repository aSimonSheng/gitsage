import git from '../git.js';
import ai from '../ai.js';
import { getConfig } from '../config.js';

export async function generatePrTitleAndBody(baseRef: string): Promise<{ title: string; body: string }> {
  let diff: string = '';
  try {
    diff = await git.getDiffRange(`${baseRef}...HEAD`);
  } catch {
    // Fallback to staged/un-staged diff if range failed
    diff = (await git.getDiff()) || (await git.getDiffUnstaged());
  }
  if (!diff) {
    throw new Error('No changes found to generate PR content.');
  }

  const cfg = getConfig();
  const chunkSize = cfg.ai?.chunkSizeChars ?? 8000;
  const maxChunks = cfg.ai?.maxChunks ?? 3;
  const chunks: string[] = [];
  for (let i = 0; i < diff.length && chunks.length < maxChunks; i += chunkSize) {
    chunks.push(diff.slice(i, i + chunkSize));
  }

  if (chunks.length > 1) {
    const summaries: string[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkPrompt = `
Summarize Chunk ${i + 1}/${chunks.length} of a git diff for a PR.
Provide 3-6 bullet points, terse and actionable.

Git diff (chunk ${i + 1}):
${chunks[i]}
      `.trim();
      const summary = await ai.complete([
        { role: 'system', content: 'You write concise change summaries.' },
        { role: 'user', content: chunkPrompt },
      ]);
      summaries.push(summary);
    }
    const combinePrompt = `
Combine the following chunk summaries into:
1) A single PR Title (<= 72 chars)
2) A Markdown body with sections: Summary, Changes, Impact, Risks
Keep it practical and terse. No code fences.

Chunk summaries:
${summaries.map((s, idx) => `Chunk ${idx + 1}:\n${s}`).join('\n\n')}
    `.trim();
    const combined = await ai.complete([
      { role: 'system', content: 'You write professional, concise PR descriptions.' },
      { role: 'user', content: combinePrompt },
    ]);
    const lines = combined.split('\n').map((l: string) => l.trim());
    let title = lines[0] || 'Update';
    title = title.replace(/^#+\s*/, '');
    const body = lines.slice(1).join('\n').trim() || 'Summary: Update';
    return { title, body };
  }

  const safeDiff = chunks[0];
  const prompt = `
You are a senior engineer preparing a GitHub Pull Request.
Given the git diff, produce:
- A concise, impactful PR Title (<= 72 chars)
- A Markdown body with sections: Summary, Changes, Impact, Risks
Keep it practical and terse. No code fences around the output.

Git diff:
${safeDiff}
  `.trim();
  const result = await ai.complete([
    { role: 'system', content: 'You write professional, concise PR descriptions.' },
    { role: 'user', content: prompt },
  ]);

  const lines = result.split('\n').map((l: string) => l.trim());
  let title = lines[0] || 'Update';
  // Remove leading markdown headers from title if present
  title = title.replace(/^#+\s*/, '');
  const body = lines.slice(1).join('\n').trim() || 'Summary: Update';
  return { title, body };
}
