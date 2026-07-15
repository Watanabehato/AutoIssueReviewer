import type { ReviewResult, RepoInfo } from '@/types'

export const sampleRepoInfo: RepoInfo = {
  owner: 'Watanabehato',
  repo: 'AutoIssueReviewer',
  name: 'AutoIssueReviewer',
  description: 'AI 驱动的 GitHub 代码审查工具，自动审查仓库代码并提交 Issue',
  language: 'Python',
  stars: 42,
  forks: 8,
  defaultBranch: 'main',
}

export const sampleReviewResult: ReviewResult = {
  repo: 'Watanabehato/AutoIssueReviewer',
  healthScore: 78,
  summary: '仓库整体代码质量良好，有一定的安全意识和错误处理机制。主要问题集中在代码可维护性和测试覆盖率方面。',
  highIssues: [
    {
      file: 'auto_issue/reviewer.py',
      description: 'API Key 以明文形式存储在客户端内存中，虽然不会持久化，但在审查过程中存在内存泄漏风险。',
      severity: 'high',
      suggestion: '考虑使用更安全的密钥管理方式，如环境变量或密钥托管服务。',
      category: 'security',
    },
    {
      file: 'auto_issue/fetcher.py',
      description: '文件内容读取时未设置合理的超时时间，大文件可能导致程序挂起。',
      severity: 'high',
      suggestion: '添加超时机制，使用 timeout 参数限制文件读取时间。',
      category: 'performance',
    },
  ],
  mediumIssues: [
    {
      file: 'auto_issue/cli.py',
      description: '颜色输出在 Windows 终端可能显示异常，缺少完整的兼容性处理。',
      severity: 'medium',
      suggestion: '使用 colorama 库或其他跨平台方案统一处理终端颜色。',
      category: 'maintainability',
    },
    {
      file: 'auto_issue/config.py',
      description: '配置验证不够严格，缺少对必填字段的完整检查。',
      severity: 'medium',
      suggestion: '添加配置验证函数，确保所有必要字段都已正确设置。',
      category: 'maintainability',
    },
    {
      file: 'auto_issue/issue_creator.py',
      description: '错误处理较为简单，缺少详细的错误信息和重试机制。',
      severity: 'medium',
      suggestion: '增加更细粒度的错误处理，区分不同类型的错误并提供相应的重试策略。',
      category: 'maintainability',
    },
  ],
  lowIssues: [
    {
      file: 'auto_issue/utils.py',
      description: '函数命名可以更具描述性，如 get_executable 可以改为 find_executable_path。',
      severity: 'low',
      suggestion: '改进函数命名，提高代码可读性。',
      category: 'maintainability',
    },
    {
      file: 'auto_issue/constants.py',
      description: '部分常量值可能需要根据实际情况调整，建议提取到配置文件中。',
      severity: 'low',
      suggestion: '将可变常量移至配置文件，提高灵活性。',
      category: 'maintainability',
    },
  ],
  securityRisks: [
    {
      file: 'auto_issue/reviewer.py',
      description: 'API Key 以明文形式存储在客户端内存中，虽然不会持久化，但在审查过程中存在内存泄漏风险。',
      severity: 'high',
      suggestion: '考虑使用更安全的密钥管理方式，如环境变量或密钥托管服务。',
      category: 'security',
    },
  ],
  maintainabilityIssues: [
    {
      file: 'auto_issue/cli.py',
      description: '颜色输出在 Windows 终端可能显示异常，缺少完整的兼容性处理。',
      severity: 'medium',
      suggestion: '使用 colorama 库或其他跨平台方案统一处理终端颜色。',
      category: 'maintainability',
    },
    {
      file: 'auto_issue/config.py',
      description: '配置验证不够严格，缺少对必填字段的完整检查。',
      severity: 'medium',
      suggestion: '添加配置验证函数，确保所有必要字段都已正确设置。',
      category: 'maintainability',
    },
    {
      file: 'auto_issue/utils.py',
      description: '函数命名可以更具描述性，如 get_executable 可以改为 find_executable_path。',
      severity: 'low',
      suggestion: '改进函数命名，提高代码可读性。',
      category: 'maintainability',
    },
    {
      file: 'auto_issue/constants.py',
      description: '部分常量值可能需要根据实际情况调整，建议提取到配置文件中。',
      severity: 'low',
      suggestion: '将可变常量移至配置文件，提高灵活性。',
      category: 'maintainability',
    },
  ],
  testCoverage: {
    score: 65,
    suggestions: [
      '为 cli.py 添加更多测试用例，覆盖各种命令行参数组合',
      '为 reviewer.py 添加模拟 API 调用的测试',
      '增加集成测试，验证完整的审查流程',
      '使用 pytest-cov 监控测试覆盖率',
    ],
  },
  fileCount: 8,
  timestamp: '2024-01-15T10:30:00Z',
}
