import { generateIssueMarkdown } from './markdown'
import { sampleReviewResult } from '@/data/sampleData'

describe('generateIssueMarkdown', () => {
  it('should generate markdown with all sections', () => {
    const markdown = generateIssueMarkdown(sampleReviewResult)

    expect(markdown).toContain('# 🤖 RepoLens AI 代码审查报告')
    expect(markdown).toContain('## 📊 整体评估')
    expect(markdown).toContain('## 📈 问题统计')
    expect(markdown).toContain('## 🔴 高优先级问题')
    expect(markdown).toContain('## 🟡 中优先级问题')
    expect(markdown).toContain('## 🟢 低优先级问题')
    expect(markdown).toContain('## 🛡️ 安全风险')
    expect(markdown).toContain('## 🔧 可维护性问题')
    expect(markdown).toContain('## 🧪 测试覆盖建议')
  })

  it('should include repo information', () => {
    const markdown = generateIssueMarkdown(sampleReviewResult)
    expect(markdown).toContain('Watanabehato/AutoIssueReviewer')
    expect(markdown).toContain('8')
  })

  it('should include health score', () => {
    const markdown = generateIssueMarkdown(sampleReviewResult)
    expect(markdown).toContain('78/100')
  })

  it('should include issue details', () => {
    const markdown = generateIssueMarkdown(sampleReviewResult)
    expect(markdown).toContain('API Key')
    expect(markdown).toContain('auto_issue/reviewer.py')
    expect(markdown).toContain('修复建议')
  })

  it('should include test coverage suggestions', () => {
    const markdown = generateIssueMarkdown(sampleReviewResult)
    expect(markdown).toContain('65/100')
    expect(markdown).toContain('为 cli.py 添加更多测试用例')
  })
})
