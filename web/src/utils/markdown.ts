import type { ReviewResult } from '@/types'

export function generateIssueMarkdown(result: ReviewResult): string {
  const now = new Date(result.timestamp || Date.now()).toLocaleString('zh-CN')

  const severityEmoji = {
    high: '🔴',
    medium: '🟡',
    low: '🟢',
  }

  const categoryLabels = {
    security: '安全',
    maintainability: '可维护性',
    performance: '性能',
    bug: 'Bug',
    test: '测试',
    other: '其他',
  }

  const markdown = `# 🤖 RepoLens AI 代码审查报告

> **仓库**: \`${result.repo}\`
> **生成时间**: ${now}
> **审查文件数**: ${result.fileCount}
> **健康度评分**: ${result.healthScore}/100

---

## 📊 整体评估

${result.summary}

---

## 📈 问题统计

| 优先级 | 数量 |
|--------|------|
| 🔴 高 | ${result.highIssues.length} |
| 🟡 中 | ${result.mediumIssues.length} |
| 🟢 低 | ${result.lowIssues.length} |

---

## 🔴 高优先级问题

${result.highIssues.length > 0 ? result.highIssues.map(issue => `### ${severityEmoji[issue.severity]} ${issue.description}

- **文件**: \`${issue.file}\`
- **类别**: ${categoryLabels[issue.category]}
- **修复建议**: ${issue.suggestion}

`).join('\n') : '暂无高优先级问题'}

---

## 🟡 中优先级问题

${result.mediumIssues.length > 0 ? result.mediumIssues.map(issue => `### ${severityEmoji[issue.severity]} ${issue.description}

- **文件**: \`${issue.file}\`
- **类别**: ${categoryLabels[issue.category]}
- **修复建议**: ${issue.suggestion}

`).join('\n') : '暂无中优先级问题'}

---

## 🟢 低优先级问题

${result.lowIssues.length > 0 ? result.lowIssues.map(issue => `### ${severityEmoji[issue.severity]} ${issue.description}

- **文件**: \`${issue.file}\`
- **类别**: ${categoryLabels[issue.category]}
- **修复建议**: ${issue.suggestion}

`).join('\n') : '暂无低优先级问题'}

---

## 🛡️ 安全风险

${result.securityRisks.length > 0 ? result.securityRisks.map(issue => `- ${severityEmoji[issue.severity]} **${issue.description}** (\`${issue.file}\`)`).join('\n') : '未发现安全风险'}

---

## 🔧 可维护性问题

${result.maintainabilityIssues.length > 0 ? result.maintainabilityIssues.map(issue => `- ${severityEmoji[issue.severity]} **${issue.description}** (\`${issue.file}\`)`).join('\n') : '未发现可维护性问题'}

---

## 🧪 测试覆盖建议

**测试覆盖率评分**: ${result.testCoverage.score}/100

${result.testCoverage.suggestions.length > 0 ? result.testCoverage.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n') : '暂无测试建议'}

---

> *此报告由 [RepoLens AI](https://github.com/Watanabehato/AutoIssueReviewer) 自动生成，请结合实际情况判断问题的优先级。*
`

  return markdown
}
