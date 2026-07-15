import { useState } from 'react'
import { Copy, Check, FileText, RefreshCw, Download, Zap } from 'lucide-react'
import { RepoInfo } from './RepoInfo'
import { HealthScore } from './HealthScore'
import { IssueList } from './IssueList'
import type { ReviewResult as ReviewResultType, RepoInfo as RepoInfoType } from '@/types'
import { generateIssueMarkdown } from '@/utils/markdown'

const surfaceBg = '#1b1b1b'
const surfaceHover = '#252525'
const borderColor = '#333333'
const textPrimary = '#ffffff'
const textSecondary = '#b3b3b3'
const textMuted = '#777777'
const accent = '#ff9900'
const success = '#35a854'
const danger = '#e5484d'

interface ReviewResultProps {
  result: ReviewResultType
  repoInfo: RepoInfoType
  isSample: boolean
  onRetry: () => void
}

export function ReviewResult({ result, repoInfo, isSample, onRetry }: ReviewResultProps) {
  const [copied, setCopied] = useState(false)
  const [showMarkdown, setShowMarkdown] = useState(false)

  const handleCopy = async () => {
    const markdown = generateIssueMarkdown(result)
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const markdown = generateIssueMarkdown(result)
    const blob = new Blob([markdown], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `repo-review-${result.repo.replace('/', '-')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Sticky toolbar */}
      <div
        className="sticky top-0 z-40 px-4 py-3 flex items-center justify-between flex-wrap gap-2"
        style={{
          background: 'rgba(15, 15, 15, 0.98)',
          borderBottom: `1px solid ${borderColor}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: textSecondary }}>审查完成</span>
          {isSample && (
            <span
              className="px-2 py-0.5 text-xs font-bold flex items-center gap-1"
              style={{
                color: accent,
                border: `1px solid rgba(255, 153, 0, 0.4)`,
                borderRadius: '3px',
              }}
            >
              <Zap className="w-3 h-3" />
              示例模式
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMarkdown(!showMarkdown)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
            style={{
              color: textMuted,
              borderRadius: '3px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = surfaceHover
              e.currentTarget.style.color = textPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = textMuted
            }}
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">{showMarkdown ? '隐藏 Markdown' : '查看 Markdown'}</span>
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
            style={{
              color: textMuted,
              borderRadius: '3px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = surfaceHover
              e.currentTarget.style.color = textPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = textMuted
            }}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" style={{ color: success }} />
                <span style={{ color: success }}>已复制</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">复制 Markdown</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors"
            style={{
              color: textMuted,
              borderRadius: '3px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = surfaceHover
              e.currentTarget.style.color = textPrimary
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = textMuted
            }}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">下载报告</span>
          </button>
        </div>
      </div>

      {showMarkdown && (
        <div
          className="mt-4 mb-4"
          style={{
            background: surfaceBg,
            border: `1px solid ${borderColor}`,
            borderRadius: '4px',
            padding: '16px',
          }}
        >
          <pre
            className="overflow-x-auto text-sm"
            style={{
              background: '#0f0f0f',
              color: textSecondary,
              padding: '16px',
              borderRadius: '3px',
              border: `1px solid ${borderColor}`,
              fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
              lineHeight: 1.6,
            }}
          >
            {generateIssueMarkdown(result)}
          </pre>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="lg:col-span-2 space-y-4">
          <RepoInfo info={repoInfo} />

          <div
            className="p-4 sm:p-5"
            style={{
              background: surfaceBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
            }}
          >
            <h3 className="font-bold mb-3" style={{ color: textPrimary, fontSize: '16px' }}>整体评估</h3>
            <p style={{ color: textSecondary, fontSize: '14px' }}>{result.summary}</p>
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span style={{ color: textMuted }}>审查文件数:</span>
              <span className="font-bold" style={{ color: textPrimary }}>{result.fileCount}</span>
            </div>
          </div>

          <IssueList title="高优先级问题" issues={result.highIssues} severity="high" />
          <IssueList title="中优先级问题" issues={result.mediumIssues} severity="medium" />
          <IssueList title="低优先级问题" issues={result.lowIssues} severity="low" />
        </div>

        <div className="space-y-4">
          <HealthScore score={result.healthScore} />

          <div
            className="p-4 sm:p-5"
            style={{
              background: surfaceBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
            }}
          >
            <h3 className="font-bold mb-3" style={{ color: textPrimary, fontSize: '16px' }}>安全风险</h3>
            {result.securityRisks.length > 0 ? (
              <ul className="space-y-2">
                {result.securityRisks.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span style={{ color: danger }}>●</span>
                    <span style={{ color: textSecondary }} className="truncate">{issue.description}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-4" style={{ color: success, fontSize: '13px' }}>未发现安全风险</p>
            )}
          </div>

          <div
            className="p-4 sm:p-5"
            style={{
              background: surfaceBg,
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
            }}
          >
            <h3 className="font-bold mb-3" style={{ color: textPrimary, fontSize: '16px' }}>测试覆盖建议</h3>
            <div className="mb-3">
              <p style={{ color: textMuted, fontSize: '12px', marginBottom: '2px' }}>测试覆盖率评分</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold" style={{ color: textPrimary }}>
                  {result.testCoverage.score}
                </span>
                <span style={{ color: textMuted, fontSize: '14px' }}>/100</span>
              </div>
            </div>
            {result.testCoverage.suggestions.length > 0 ? (
              <ul className="space-y-2">
                {result.testCoverage.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span style={{ color: accent }}>•</span>
                    <span style={{ color: textSecondary }}>{suggestion}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center py-2" style={{ color: textMuted, fontSize: '13px' }}>暂无测试建议</p>
            )}
          </div>

          <button
            onClick={onRetry}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 font-bold transition-colors"
            style={{
              background: surfaceHover,
              color: textPrimary,
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
              fontSize: '14px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#303030' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = surfaceHover }}
          >
            <RefreshCw className="w-4 h-4" />
            重新分析
          </button>
        </div>
      </div>
    </div>
  )
}
