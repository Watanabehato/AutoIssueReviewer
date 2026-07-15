import { X, Copy, Check } from 'lucide-react'
import { useState } from 'react'

const surfaceBg = '#1b1b1b'
const surfaceHover = '#252525'
const borderColor = '#333333'
const textPrimary = '#ffffff'
const textSecondary = '#b3b3b3'
const textMuted = '#777777'
const accent = '#ff9900'
const onAccent = '#111111'
const danger = '#e5484d'

interface CLIModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CLIModal({ isOpen, onClose }: CLIModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    const commands = `# 安装
pip install git+https://github.com/Watanabehato/AutoIssueReviewer

# 初始化配置
autoissue init

# 审查仓库
autoissue review owner/repo

# 预览模式（不提交 Issue）
autoissue review owner/repo --dry-run

# 将报告保存为 Markdown
autoissue review owner/repo --output report.md --no-issue`
    await navigator.clipboard.writeText(commands)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cli-modal-title"
        style={{
          background: surfaceBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
        }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 id="cli-modal-title" className="text-lg font-bold" style={{ color: textPrimary }}>CLI 工具</h3>
            <button
              onClick={onClose}
              className="p-2 transition-colors"
              style={{ borderRadius: '4px', color: textMuted }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = surfaceHover
                e.currentTarget.style.color = textSecondary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = textMuted
              }}
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mb-4" style={{ color: textSecondary, fontSize: '14px' }}>
            RepoLens AI 也提供 Python CLI 工具，支持批量审查和自动提交 Issue。
          </p>

          <div
            className="overflow-hidden"
            style={{
              background: '#0f0f0f',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
            }}
          >
            <div
              className="flex items-center gap-2 px-4 py-2"
              style={{ borderBottom: `1px solid ${borderColor}` }}
            >
              <div className="w-3 h-3 rounded-full" style={{ background: danger }} />
              <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#35a854' }} />
              <span className="ml-2 text-xs font-mono" style={{ color: textMuted }}>terminal</span>
              <button
                onClick={handleCopy}
                className="ml-auto flex items-center gap-1 px-2 py-1 transition-colors"
                style={{
                  borderRadius: '3px',
                  fontSize: '12px',
                  color: textMuted,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = surfaceHover
                  e.currentTarget.style.color = textSecondary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = textMuted
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" style={{ color: '#35a854' }} />
                    <span style={{ color: '#35a854' }}>已复制</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    复制
                  </>
                )}
              </button>
            </div>
            <pre
              className="p-4 overflow-x-auto"
              style={{
                fontSize: '13px',
                color: textSecondary,
                fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
                lineHeight: 1.6,
              }}
            >
{`# 安装
pip install git+https://github.com/Watanabehato/AutoIssueReviewer

# 初始化配置
autoissue init

# 审查仓库
autoissue review owner/repo

# 预览模式（不提交 Issue）
autoissue review owner/repo --dry-run

# 将报告保存为 Markdown
autoissue review owner/repo --output report.md --no-issue`}
            </pre>
          </div>

          <div
            className="mt-4 p-4"
            style={{
              background: '#0f0f0f',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
            }}
          >
            <h4 className="font-bold mb-2" style={{ color: textPrimary, fontSize: '14px' }}>
              配置文件示例 (.autoissue.json)
            </h4>
            <pre
              className="p-3 overflow-x-auto"
              style={{
                fontSize: '12px',
                color: textMuted,
                fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
                lineHeight: 1.6,
                background: '#0f0f0f',
              }}
            >
{`{
  "api_base_url": "https://api.openai.com/v1",
  "api_key": "sk-xxxxxxxxxxxxxxxx",
  "model": "gpt-4o",
  "max_tokens": 4096,
  "review_language": "zh"
}`}
            </pre>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-5 py-2.5 font-bold transition-colors"
            style={{
              background: accent,
              color: onAccent,
              borderRadius: '4px',
              fontSize: '14px',
              border: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#ffad28' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = accent }}
          >
            知道了
          </button>
        </div>
      </div>
    </div>
  )
}
