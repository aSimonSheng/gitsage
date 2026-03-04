# Contributing to GitSage

Thanks for considering contributing! Please follow these guidelines to keep contributions predictable and easy to review.

## Development
- Node 18+ and npm.
- Install deps: `npm ci`
- Useful scripts:
  - `npm run build` — build with tsup
  - `npm run lint` / `npm run lint:fix`
  - `npm run typecheck`
  - `npm test`

## Commit Messages
- Follow Conventional Commits: `type(scope): subject`
- Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

## Pull Requests
- Keep PRs focused and small.
- Add tests for new behavior or bug fixes.
- Update documentation when needed.

## Code Style
- TypeScript strict mode
- ESLint + Prettier enforced

## Reporting Issues
- Use the issue templates.
- Provide reproduction steps and expected/actual behavior.

## Security
- Please avoid including secrets in code or logs.
- For security concerns, use “Security Policy” if available or open a private report.
