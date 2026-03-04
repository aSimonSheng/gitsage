# GitSage

> Your AI-powered Git companion that understands your code

<div align="center">

![GitSage](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

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
# Using OpenAI
export OPENAI_API_KEY=your-key-here

# Or using Anthropic
export ANTHROPIC_API_KEY=your-key-here
gitsage config set aiProvider anthropic
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
| `gitsage config list` | Show configuration |
| `gitsage config set <key> <value>` | Update configuration |

### Configuration

```bash
# Set OpenAI key
gitsage config set openai.apiKey sk-...

# Set model
gitsage config set openai.model gpt-4

# Switch to Anthropic
gitsage config set aiProvider anthropic
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/yourusername/gitsage/issues).

## 📝 License

MIT © GitSage Team

---

<div align="center">

**Made with ❤️ by the GitSage Team**

</div>
