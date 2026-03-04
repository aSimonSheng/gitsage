# GitSage

> Your AI-powered Git companion that understands your code

<div align="center">

![GitSage](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![CI](https://github.com/aSimonSheng/gitsage/actions/workflows/ci.yml/badge.svg)
![Release](https://github.com/aSimonSheng/gitsage/actions/workflows/release.yml/badge.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

</div>

---

## ✨ Features

- 🤖 **AI-Powered Commit Messages**: Never write a boring commit message again
- 🔍 **Smart Code Analysis**: Get instant feedback on your changes
- 🔄 **Seamless Git Integration**: Works with your existing workflow
- 🎨 **Beautiful CLI**: A joy to use every day
- 🔐 **Multi-Provider Support**: OpenAI, Anthropic, and more coming soon

## 🚀 Quick Start

### Installation

```bash
npm install -g gitsage
```

### Setup

Configure your AI provider:

```bash
# Using OpenAI (or set via gitsage init)
export OPENAI_API_KEY=your-key-here

# Or using Anthropic
export ANTHROPIC_API_KEY=your-key-here
gitsage config set aiProvider anthropic
```

### Quick Init

```bash
gitsage init
```

Chinese docs: see [README_CN.md](file:///Users/bytedance/pinggai/gitsage/README_CN.md)

China-friendly presets are available in init for OpenAI-compatible endpoints:
- Kimi (Moonshot): https://api.moonshot.cn
- Zhipu GLM: https://open.bigmodel.cn/api/paas/v4
- DeepSeek: https://api.deepseek.com
- Qwen (DashScope Compatible): https://dashscope.aliyuncs.com/compatible-mode

### Create PR with GitHub CLI

```bash
# Generate PR title/body, push current branch and open a PR
gitsage pr --base origin/main --push --open
```

### Usage

```bash
# Stage changes and let GitSage commits with AI-generated message
gitsage commit --add

# Or just generate message for staged changes
gitsage commit

# Analyze your changes
gitsage analyze
```

## 📖 Documentation

### Commands

| Command | Description |
|---------|-------------|
| `gitsage commit` | AI-assisted commit |
| `gitsage analyze` | Analyze current changes |
| `gitsage init` | Interactive setup and commit-msg hook |
| `gitsage pr --push --open` | Generate and open a GitHub PR |
| `gitsage doctor` | Diagnose config, network, git and gh |
| `gitsage config export [path]` | Export current config to JSON |
| `gitsage config import <path>` | Import config from JSON |
| `gitsage config list` | Show configuration |
| `gitsage config set <key> <value>` | Update configuration |

### Configuration

```bash
# Set OpenAI key
gitsage config set openai.apiKey sk-...

# Set model
gitsage config set openai.model gpt-4
gitsage config set openai.baseURL https://api.openai.com
gitsage config set openai.maxTokens 512

# Request safeguards
gitsage config set ai.requestTimeoutMs 20000
gitsage config set ai.maxDiffChars 15000

# Switch to Anthropic
gitsage config set aiProvider anthropic
gitsage config set anthropic.model claude-3-opus
gitsage config set anthropic.maxTokens 1024

# OpenAI-compatible (China-friendly) examples
gitsage config set openai.baseURL https://api.moonshot.cn
gitsage config set openai.model moonshot-v1-8k
```

### Release Automation

Semantic-release keeps versions and CHANGELOG up-to-date.
- Configure repository secrets: GITHUB_TOKEN (default) and NPM_TOKEN (optional for npm publish).
- Push to main with conventional commits; release workflow will publish GitHub Release and update CHANGELOG.md.

### Doctor (Self-Check)

```bash
gitsage doctor
```

It will check:
- Git repo/branch and gh CLI presence
- AI provider, API key presence (masked), baseURL
- Basic network reachability to baseURL (HTTP status indicates connectivity)
- Proxy env (HTTPS_PROXY/HTTP_PROXY/NO_PROXY)

If some checks fail, follow the hints to set config keys or proxies.

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/yourusername/gitsage/issues).

## 📝 License

MIT © GitSage Team

---

<div align="center">

**Made with ❤️ by the GitSage Team**

</div>
