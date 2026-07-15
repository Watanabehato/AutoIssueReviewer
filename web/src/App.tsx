import { useState, useCallback } from 'react'
import { Header } from '@/components/Header'
import { RepoInput } from '@/components/RepoInput'
import { AIConfigModal } from '@/components/AIConfigModal'
import { ReviewProgress } from '@/components/ReviewProgress'
import { ReviewResult } from '@/components/ReviewResult'
import { CLIModal } from '@/components/CLIModal'
import { FileOutput, Gauge, ShieldCheck } from 'lucide-react'
import { fetchRepoInfo, collectCodeFiles } from '@/utils/github'
import { reviewFiles } from '@/utils/ai'
import { sampleRepoInfo, sampleReviewResult } from '@/data/sampleData'
import type { ReviewResult as ReviewResultType, RepoInfo as RepoInfoType, ReviewStatus, AIConfig } from '@/types'

const borderColor = '#333333'
const textMuted = '#777777'
const accent = '#ff9900'

const capabilityItems = [
  { icon: ShieldCheck, label: '风险扫描', value: 'Security', detail: '漏洞与不安全模式' },
  { icon: Gauge, label: '质量评估', value: '0-100', detail: '可维护性健康度' },
  { icon: FileOutput, label: '结构化报告', value: 'Markdown', detail: '可直接用于 Issue' },
]

function App() {
  const [status, setStatus] = useState<ReviewStatus>({
    status: 'idle',
    step: 0,
    totalSteps: 0,
    currentFile: '',
    message: '',
  })
  const [reviewResult, setReviewResult] = useState<ReviewResultType | null>(null)
  const [repoInfo, setRepoInfo] = useState<RepoInfoType | null>(null)
  const [isSample, setIsSample] = useState(false)
  const [showAIConfig, setShowAIConfig] = useState(false)
  const [showCLI, setShowCLI] = useState(false)
  const [aiConfig, setAiConfig] = useState<AIConfig | null>(null)
  const [pendingRepo, setPendingRepo] = useState<{ owner: string; repo: string } | null>(null)

  const handleTrySample = useCallback(() => {
    setIsSample(true)
    setRepoInfo(sampleRepoInfo)
    setReviewResult(sampleReviewResult)
    setStatus({
      status: 'completed',
      step: 1,
      totalSteps: 1,
      currentFile: '',
      message: '',
    })
  }, [])

  const performReview = useCallback(async (owner: string, repo: string, config: AIConfig) => {
    setIsSample(false)
    setReviewResult(null)
    setRepoInfo(null)

    try {
      setStatus({
        status: 'loading',
        step: 0,
        totalSteps: 3,
        currentFile: '',
        message: '正在获取仓库信息...',
      })

      const info = await fetchRepoInfo(owner, repo)
      setRepoInfo(info)

      setStatus({
        status: 'loading',
        step: 1,
        totalSteps: 3,
        currentFile: '',
        message: '正在收集代码文件...',
      })

      const files = await collectCodeFiles(owner, repo, info.defaultBranch, 50, 200)

      if (files.length === 0) {
        setStatus({
          status: 'error',
          step: 0,
          totalSteps: 0,
          currentFile: '',
          message: '未找到可审查的代码文件',
          error: '请检查仓库是否包含代码文件',
        })
        return
      }

      setStatus({
        status: 'reviewing',
        step: 0,
        totalSteps: Math.ceil(files.length / 5),
        currentFile: '',
        message: '',
      })

      const result = await reviewFiles(
        files,
        config,
        (step, total, file) => {
          setStatus({
            status: 'reviewing',
            step,
            totalSteps: total,
            currentFile: file,
            message: '',
          })
        }
      )

      result.repo = `${owner}/${repo}`
      setReviewResult(result)
      setStatus({
        status: 'completed',
        step: 1,
        totalSteps: 1,
        currentFile: '',
        message: '',
      })
    } catch (error) {
      console.error('Review error:', error)
      setStatus({
        status: 'error',
        step: 0,
        totalSteps: 0,
        currentFile: '',
        message: '分析失败，请稍后重试',
        error: error instanceof Error ? error.message : '未知错误',
      })
    }
  }, [])

  const handleRepoSubmit = useCallback((owner: string, repo: string) => {
    if (!aiConfig) {
      setPendingRepo({ owner, repo })
      setShowAIConfig(true)
      return
    }
    void performReview(owner, repo, aiConfig)
  }, [aiConfig, performReview])

  const handleAIConfigSubmit = useCallback((config: AIConfig) => {
    setAiConfig(config)
    setShowAIConfig(false)
    if (pendingRepo) {
      const { owner, repo } = pendingRepo
      setPendingRepo(null)
      void performReview(owner, repo, config)
    }
  }, [pendingRepo, performReview])

  const handleRetry = useCallback(() => {
    setStatus({
      status: 'idle',
      step: 0,
      totalSteps: 0,
      currentFile: '',
      message: '',
    })
    setReviewResult(null)
    setRepoInfo(null)
    setIsSample(false)
  }, [])

  return (
    <div className="app-shell">
      <Header onViewCLI={() => setShowCLI(true)} />

      <main className="px-4 py-6 sm:px-6 lg:px-8">
        {status.status === 'idle' && (
          <div className="py-8 sm:py-14">
            <RepoInput
              onSubmit={handleRepoSubmit}
              onTrySample={handleTrySample}
              isLoading={false}
            />

            <div className="capability-grid">
              {capabilityItems.map(({ icon: Icon, label, value, detail }) => (
                <div key={label} className="capability-item">
                  <div className="capability-icon"><Icon className="w-4 h-4" /></div>
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3>{label}</h3>
                      <span>{value}</span>
                    </div>
                    <p>{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(status.status === 'loading' || status.status === 'reviewing' || status.status === 'error') && (
          <div className="py-8 sm:py-12">
            <ReviewProgress status={status} />
            {status.status === 'error' && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleRetry}
                  className="px-5 py-2.5 font-bold transition-colors"
                  style={{
                    background: accent,
                    color: '#111111',
                    borderRadius: '4px',
                    fontSize: '14px',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#ffad28' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = accent }}
                >
                  返回首页
                </button>
              </div>
            )}
          </div>
        )}

        {status.status === 'completed' && reviewResult && repoInfo && (
          <div className="py-4">
            <ReviewResult
              result={reviewResult}
              repoInfo={repoInfo}
              isSample={isSample}
              onRetry={handleRetry}
            />
          </div>
        )}
      </main>

      <footer
        style={{
          background: '#000000',
          borderTop: `1px solid ${borderColor}`,
          marginTop: '32px',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div style={{ color: textMuted, fontSize: '13px' }}>
              RepoLens AI · GitHub 代码质量智能分析工具
            </div>
            <div style={{ color: textMuted, fontSize: '13px' }}>
              API Key 仅保存在内存中，不会持久化
            </div>
          </div>
        </div>
      </footer>

      <AIConfigModal
        isOpen={showAIConfig}
        onClose={() => {
          setShowAIConfig(false)
          setPendingRepo(null)
        }}
        onSubmit={handleAIConfigSubmit}
      />

      <CLIModal
        isOpen={showCLI}
        onClose={() => setShowCLI(false)}
      />
    </div>
  )
}

export default App
