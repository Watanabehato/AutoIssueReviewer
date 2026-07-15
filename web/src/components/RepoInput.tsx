import { useState } from 'react'
import { ArrowRight, FolderGit2, Zap, AlertCircle, ShieldCheck } from 'lucide-react'
import { parseGithubUrl } from '@/utils/github'

interface RepoInputProps {
  onSubmit: (owner: string, repo: string) => void
  onTrySample: () => void
  isLoading: boolean
}

const textPrimary = '#ffffff'
const textSecondary = '#b3b3b3'
const textMuted = '#777777'
const danger = '#e5484d'

export function RepoInput({ onSubmit, onTrySample, isLoading }: RepoInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = () => {
    const parsed = parseGithubUrl(url)
    if (!parsed.valid) {
      setError('请输入有效的 GitHub 仓库地址')
      return
    }
    setError('')
    onSubmit(parsed.owner, parsed.repo)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit()
    }
  }

  return (
    <section className="w-full max-w-3xl mx-auto repo-console" aria-labelledby="repo-input-title">
      <div className="repo-console__header">
        <div>
          <div className="console-kicker">NEW ANALYSIS</div>
          <h2 id="repo-input-title" className="mt-1 text-xl sm:text-2xl font-bold" style={{ color: textPrimary }}>
            审查一个 GitHub 仓库
          </h2>
        </div>
        <div className="console-mode">
          <span className="console-mode__dot" />
          AI REVIEW
        </div>
      </div>

      <div className="p-5 sm:p-6">
          <p className="mb-5" style={{ color: textSecondary, fontSize: '14px' }}>
            输入公开仓库地址，生成代码健康度、风险清单与可执行的修复建议。
          </p>

          <div className="relative repo-url-field">
            <div
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: textMuted }}
            >
              <FolderGit2 className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError('')
              }}
              onKeyDown={handleKeyPress}
              placeholder="github.com/owner/repository"
              disabled={isLoading}
              className="w-full outline-none transition-colors repo-url-input"
              style={{
                borderColor: error ? danger : undefined,
                padding: '15px 16px 15px 48px',
                color: textPrimary,
                fontSize: '15px',
              }}
            />
            {error && (
              <div className="flex items-center gap-1.5 mt-2" style={{ color: danger, fontSize: '13px' }}>
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 mt-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="primary-action"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              {isLoading ? (
                <>
                  <div
                    className="w-5 h-5 border-2 rounded-full animate-spin"
                    style={{ borderColor: '#111', borderTopColor: 'transparent' }}
                  />
                  <span>分析中...</span>
                </>
              ) : (
                <>
                  <span>开始分析</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
            <button
              onClick={onTrySample}
              disabled={isLoading}
              className="secondary-action"
              style={{ opacity: isLoading ? 0.6 : 1 }}
            >
              <Zap className="w-4 h-4" />
              <span>体验示例</span>
            </button>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs" style={{ color: textMuted }}>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: '#4fc29b' }} />
              API Key 仅保留在当前会话内存
            </span>
            <span className="font-mono">HTTPS · SSH · owner/repo</span>
          </div>
      </div>
    </section>
  )
}
