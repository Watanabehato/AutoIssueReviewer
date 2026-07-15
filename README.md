# RepoLens AI — GitHub 代码质量智能分析

[![Python](https://img.shields.io/badge/python-3.10+-blue)](https://python.org)
[![TypeScript](https://img.shields.io/badge/typescript-5.8+-blue)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 产品定位

帮助个人开发者和小团队快速理解 GitHub 仓库的代码质量、安全风险和改进优先级。

## ✨ 核心功能

### 🖥️ Web Demo（无需安装）
- 输入公开 GitHub 仓库地址，一键分析代码质量
- **示例模式**：无需 API Key，打开即可完整体验
- **实时 AI 审查**：使用 OpenAI 兼容接口进行代码分析
- 审查结果包括：仓库健康度评分、高/中/低优先级问题、安全风险、可维护性问题、测试覆盖建议
- 一键复制 GitHub Issue 格式的审查报告

### 🧰 CLI 工具（批量审查）
- 支持批量审查多个仓库
- 自动提交审查结果为 GitHub Issue
- 支持多 API Key/多模型自动切换
- 详细的配置选项和命令行参数

## 🚀 快速开始

### Web Demo

直接访问 GitHub Pages 部署的 Web 应用：

```
https://watanabehato.github.io/AutoIssueReviewer
```

**或本地运行：**

```bash
cd web
npm install
npm run dev
```

### CLI 工具

```bash
# 安装
pip install -e .

# 初始化配置
autoissue init

# 审查仓库
autoissue review owner/repo

# 预览模式（不提交 Issue）
autoissue review owner/repo --dry-run

# 将报告保存为 Markdown
autoissue review owner/repo --output report.md --no-issue
```

## 🔒 隐私设计

- API Key 仅保存在当前页面内存中，**不会写入 localStorage、日志或仓库，只会发送到你配置的 AI API 服务**
- Web 版要求 AI API 允许来自 `https://watanabehato.github.io` 的 CORS 请求；不支持浏览器跨域调用的兼容服务请使用 CLI
- 关闭页面后 Key 将自动清除
- 所有数据处理均在客户端完成，不经过任何中间服务器

## 📊 审查维度

1. **Bug 与逻辑错误**：潜在的运行时错误、边界条件、空指针等
2. **安全漏洞**：SQL 注入、XSS、硬编码密钥、不安全的依赖等
3. **代码质量**：可读性差、重复代码、过长函数、命名不规范等
4. **性能问题**：低效算法、N+1 查询、内存泄漏等
5. **最佳实践**：违反语言惯用法、缺少错误处理、缺少注释等
6. **测试覆盖**：是否有单元测试、测试覆盖率如何

## 📁 项目结构

```
AutoIssueReviewer/
├── auto_issue/              # CLI 工具核心代码
│   ├── __init__.py
│   ├── cli.py               # CLI 入口
│   ├── config.py            # 配置管理
│   ├── constants.py         # 常量定义
│   ├── fetcher.py           # 仓库克隆与文件收集
│   ├── reviewer.py          # AI 代码审查
│   ├── issue_creator.py     # GitHub Issue 提交
│   └── utils.py             # 工具函数
├── web/                     # Web Demo（React + Vite）
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── data/            # 示例数据
│   │   ├── types/           # TypeScript 类型定义
│   │   ├── utils/           # 工具函数（GitHub API、AI 调用、Markdown 生成）
│   │   ├── App.tsx          # 主应用
│   │   └── main.tsx         # 入口文件
│   ├── package.json
│   ├── vite.config.ts
│   └── vitest.config.ts
├── tests/                   # Python 测试
├── .github/workflows/       # GitHub Actions 工作流
│   └── pages.yml            # GitHub Pages 自动部署
├── pyproject.toml
└── README.md
```

## 🔧 配置说明

### Web Demo AI 配置

在 Web 界面中输入以下配置：
- **API Base URL**：OpenAI 兼容接口地址，默认 `https://api.openai.com/v1`
- **API Key**：你的 API Key
- **模型名称**：如 `gpt-4o`

### CLI 配置文件

编辑 `.autoissue.json`：

```json
{
  "api_base_url": "https://api.openai.com/v1",
  "api_key": "sk-xxxxxxxxxxxxxxxx",
  "model": "gpt-4o",
  "max_tokens": 4096,
  "review_language": "zh",
  "exclude_patterns": [
    "*.lock", "node_modules/*", ".git/*", "dist/*"
  ],
  "max_file_size_kb": 200,
  "max_files_per_batch": 10,
  "max_repo_files": 200
}
```

## 🧪 测试

### Python 测试

```bash
pip install -e ".[test]"
pytest
```

### Web 测试

```bash
cd web
npm run test:run
```

## 🚀 部署

### GitHub Pages

项目已配置自动部署工作流，推送到 `main` 分支后自动部署到 GitHub Pages。

**手动部署步骤：**

1. 在 GitHub 仓库设置中开启 GitHub Pages
2. 选择 `GitHub Actions` 作为源
3. 推送代码到 `main` 分支

### 环境变量（可选）

| 环境变量 | 说明 |
|----------|------|
| `OPENAI_API_KEY` | API Key（CLI 模式） |
| `OPENAI_API_BASE` | API Base URL（CLI 模式） |
| `AUTOISSUE_MODEL` | 模型名称（CLI 模式） |

## 💡 使用建议

1. **示例模式**：点击"体验示例"按钮即可查看完整功能演示
2. **实时审查**：准备好 OpenAI 兼容的 API Key 后，输入仓库地址开始分析
3. **大型仓库**：建议设置合理的文件数量限制，避免 API 超时
4. **隐私保护**：不要在公共环境中输入真实 API Key

## 📝 更新日志

### v2.0.0 - Web Demo 版本
- 新增纯前端 Web 应用，支持部署到 GitHub Pages
- 添加示例模式，无需 API Key 即可体验
- 新增实时 AI 审查模式，支持 OpenAI 兼容接口
- 新增仓库健康度评分系统
- 新增问题优先级分类（高/中/低）
- 新增安全风险和可维护性分析
- 新增测试覆盖建议
- 新增 Issue Markdown 一键复制功能
- 添加完整的 TypeScript 类型定义
- 添加 26 个单元测试
- 支持响应式布局（桌面和手机）

### v1.0.0 - CLI 版本
- 初始版本，支持 CLI 命令行工具
- 自动克隆 GitHub 仓库
- 调用 OpenAI API 进行代码审查
- 自动提交审查结果为 GitHub Issue

## License

MIT
