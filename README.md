# AutoIssue — AI 驱动的 GitHub 代码审查工具

[![Python](https://img.shields.io/badge/python-3.10+-blue)](https://python.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ⚠️ 免责声明

> - **请在虚拟环境中使用本工具**，以防第三方 API 中转站对传输的数据进行投毒或篡改。
> - 本软件完全开源，**不含任何与开发者相关的云端处理逻辑**，所有数据处理均在本地完成。
> - 使用第三方中转站 API 时，请确保其来源可靠，并注意保护您的 API Key 安全。

---

**AutoIssue** 是一个 CLI 工具，可以：

1. 自动克隆指定 GitHub 仓库（支持公开和私有仓库）
2. 遍历仓库内所有代码文件
3. 调用 **任何 OpenAI 兼容 API**（包括第三方中转站）进行 AI 代码审查
4. 将审查结果汇总后，自动提交为 GitHub Issue

---

## 快速开始

### 1. 安装依赖

```bash
# 克隆本项目
git clone https://github.com/Watanabehato/AutoIssueReviewer
cd AutoIssueReviewer

# 安装（推荐使用虚拟环境）
pip install -e .
```

### 2. 生成配置文件

```bash
autoissue init
```

这会在当前目录生成 `.autoissue.json`，编辑它填入你的 API 信息：

```json
{
  "api_base_url": "https://your-api-proxy.com/v1",
  "api_key": "sk-xxxxxxxxxxxxxxxx",
  "model": "gpt-4o",
  "max_tokens": 4096,
  "review_language": "zh",
  "issue_title_prefix": "[AutoReview]",
  "issue_labels": ["automated-review"]
}
```

#### 多 Key / 多模型支持

当配置多个 `api_keys` 和 `models` 时，AutoIssue 会自动切换：
- 任一 key 或模型报错（如 401/403/504 等）时，自动切换到下一个组合
- 组合循环：每个 key 会和每个模型配对

```json
{
  "api_base_url": "https://cdnapi.xcode.best/v1",
  "api_keys": [
    "sk-key1-xxxxxxxxxxxxxxxx",
    "sk-key2-xxxxxxxxxxxxxxxx"
  ],
  "models": [
    "claude-haiku-4-5-20251001",
    "gpt-4o-mini"
  ]
}
```

此配置会生成 4 种组合：`(key1, claude)` / `(key1, gpt-4o-mini)` / `(key2, claude)` / `(key2, gpt-4o-mini)`

### 3. 检查环境

```bash
autoissue check
```

### 4. 开始审查！

```bash
# 审查公开仓库，提交 Issue
autoissue review owner/repo

# 只预览报告，不实际提交 Issue（测试用）
autoissue review owner/repo --dry-run

# 将报告保存为 Markdown 文件
autoissue review owner/repo --output report.md --no-issue

# 指定分支
autoissue review owner/repo --branch develop
```

---

## 配置参数说明

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `api_base_url` | `https://api.openai.com/v1` | API 中转站地址 |
| `api_key` | *(必填)* | API Key（兼容单 key） |
| `api_keys` | `[]` | 多 Key 列表，支持逗号分隔字符串，自动切换 |
| `model` | `gpt-4o` | 模型（兼容单模型） |
| `models` | `[]` | 多模型列表，支持逗号分隔字符串，自动切换 |
| `max_tokens` | `4096` | 每次 API 调用最大 token 数 |
| `review_language` | `zh` | 审查语言：`zh`=中文，`en`=英文 |
| `exclude_patterns` | *(见默认值)* | 排除的文件 glob 模式列表 |
| `max_file_size_kb` | `200` | 超过此大小的文件跳过（KB） |
| `max_files_per_batch` | `10` | 每批发给 AI 的文件数 |
| `max_repo_files` | `200` | 最多处理的文件总数 |
| `batch_delay_seconds` | `5.0` | 相邻批次之间的等待秒数 |
| `issue_title_prefix` | `[AutoReview]` | Issue 标题前缀 |
| `issue_labels` | `["automated-review"]` | Issue 标签（需提前在仓库创建） |
| `add_summary` | `true` | 是否在 Issue 头部加总结 |

---

## 环境变量

可用环境变量覆盖配置文件中的 API 设置：

| 环境变量 | 对应配置 |
|----------|----------|
| `OPENAI_API_KEY` | `api_key` |
| `OPENAI_API_BASE` | `api_base_url` |
| `AUTOISSUE_MODEL` | `model` |

---

## CLI 完整参数

```
autoissue review <owner/repo> [选项]

选项：
  --branch, -b     指定分支（默认：仓库默认分支）
  --config, -c     指定配置文件路径
  --dry-run, -n    预览模式，不实际提交 Issue
  --verbose, -v    详细输出（显示跳过的文件）
  --output, -o     将报告保存为 Markdown 文件
  --no-issue       不提交 Issue（配合 --output）
  --api-key        临时指定 API Key
  --api-base       临时指定 API Base URL
  --model          临时指定模型
  --lang           审查语言（zh/en）
```

---

## 常见问题

**Q: 提示 "创建 Issue 失败：label not found"**
> 需要先在 GitHub 仓库的 Issues → Labels 中手动创建 `automated-review` 标签，或在配置中清空 `issue_labels`。

**Q: 如何审查私有仓库？**
> 确保已运行 `gh auth login` 并完成授权，AutoIssue 会自动使用 gh 的认证信息克隆私有仓库。

**Q: 仓库文件太多，审查太慢？**
> 调低 `max_repo_files`（如 50），或增加 `exclude_patterns` 来跳过测试文件、文档等。

---

## 项目结构

```
autoissue/
├── auto_issue/
│   ├── __init__.py        # 包初始化
│   ├── cli.py             # CLI 入口与参数解析
│   ├── config.py          # 配置管理
│   ├── fetcher.py         # 仓库克隆与文件收集
│   ├── reviewer.py        # AI 代码审查
│   └── issue_creator.py   # GitHub Issue 提交
├── pyproject.toml         # 项目配置
└── README.md              # 本文档
```

## License

MIT
