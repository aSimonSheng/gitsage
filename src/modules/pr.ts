import git from '../git.js';
import ai from '../ai.js';

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

  const prompt = `
You are a senior engineer preparing a GitHub Pull Request.
Given the git diff, produce:
- A concise, impactful PR Title (<= 72 chars)
- A Markdown body with sections: Summary, Changes, Impact, Risks
Keep it practical and terse. No code fences around the output.

Git diff:
${diff}
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
