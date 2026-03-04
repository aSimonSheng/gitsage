# GitSage

AI 驱动的 Git 助手：自动生成提交信息、PR 标题/描述、变更分析与规范校验。

## 快速开始

```bash
gitsage init
```

- 在初始化中选择 AI 提供商或国内 OpenAI 兼容预设（Kimi/智谱/DeepSeek/通义）
- 可选择安装 commit-msg 钩子，强制 Conventional Commits

生成并创建 PR（自动推送当前分支并用 GitHub CLI 创建 PR）：

```bash
gitsage pr --base origin/main --push --open
```

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `gitsage analyze` | 分析当前改动 |
| `gitsage init` | 交互式配置与安装 commit hook |
| `gitsage pr --push --open` | 生成并创建 GitHub PR |
| `gitsage doctor` | 自检配置、网络、git 与 gh |
| `gitsage config export [path]` | 导出当前配置为 JSON |
| `gitsage config import <path>` | 从 JSON 导入配置 |

## 国内可用（OpenAI 兼容）

在 `gitsage init` 中可选择以下预设：
- Kimi（Moonshot）：https://api.moonshot.cn，model=moonshot-v1-8k
- 智谱 GLM：https://open.bigmodel.cn/api/paas/v4，model=glm-4
- DeepSeek：https://api.deepseek.com，model=deepseek-chat
- 通义 Qwen（DashScope 兼容）：https://dashscope.aliyuncs.com/compatible-mode，model=qwen-plus

也可手动设置：

```bash
gitsage config set openai.baseURL https://api.moonshot.cn
gitsage config set openai.model moonshot-v1-8k
gitsage config set openai.apiKey <你的Key>
```

## 稳定性与配置

- 超时/重试：`gitsage config set ai.requestTimeoutMs 20000`
- 长 Diff 分片/截断：`gitsage config set ai.chunkSizeChars 8000`、`gitsage config set ai.maxChunks 3`
- 持久化目录：`GITSAGE_CONFIG_DIR`，系统目录不可写时自动降级到项目 `.gitsage/config.json`
- 代理：支持 `HTTPS_PROXY`、`HTTP_PROXY`、`NO_PROXY`

## 自检

```bash
gitsage doctor
```

检查项包括：
- Git 仓库/当前分支与 gh CLI
- AI 提供商、API Key（掩码）、baseURL
- 基础网络连通性（baseURL）
- 代理环境变量

## 发布与版本

使用 semantic-release 自动生成版本与 CHANGELOG。合入 main 后自动在 GitHub 发布 Release。需要发布到 npm 时配置 `NPM_TOKEN`。*** End Patch***} ?>>``` -->
