import { Loader2, FileCode, AlertCircle } from 'lucide-react'
import type { ReviewStatus } from '@/types'

const surfaceBg = '#1b1b1b'
const borderColor = '#333333'
const textPrimary = '#ffffff'
const textSecondary = '#b3b3b3'
const textMuted = '#777777'
const accent = '#ff9900'
const danger = '#e5484d'

interface ReviewProgressProps {
  status: ReviewStatus
}

export function ReviewProgress({ status }: ReviewProgressProps) {
  const progress = status.totalSteps > 0
    ? (status.step / status.totalSteps) * 100
    : 0

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        style={{
          background: surfaceBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
        }}
        className="p-5 sm:p-6"
      >
        {status.status === 'loading' && (
          <div className="text-center py-4">
            <div
              className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#0f0f0f', borderRadius: '4px' }}
            >
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: accent }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: textPrimary }}>加载仓库信息</h3>
            <p className="mt-2" style={{ color: textSecondary, fontSize: '14px' }}>{status.message}</p>
          </div>
        )}

        {status.status === 'reviewing' && (
          <>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ background: '#0f0f0f', borderRadius: '4px' }}
                >
                  <FileCode className="w-5 h-5" style={{ color: accent }} />
                </div>
                <div>
                  <h3 className="font-bold" style={{ color: textPrimary, fontSize: '16px' }}>AI 代码审查中</h3>
                  <p style={{ color: textMuted, fontSize: '13px' }}>
                    第 {status.step} / {status.totalSteps} 批
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: accent }}>
                  {Math.round(progress)}%
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div
                className="h-2 overflow-hidden"
                style={{
                  background: '#0f0f0f',
                  borderRadius: '2px',
                }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${progress}%`,
                    background: accent,
                    borderRadius: '2px',
                  }}
                />
              </div>
            </div>

            <div className="text-center">
              <p style={{ color: textSecondary, fontSize: '14px', fontWeight: 500 }}>正在审查文件</p>
              <p
                className="mt-1 font-mono truncate px-4"
                style={{ color: textMuted, fontSize: '13px' }}
              >
                {status.currentFile}
              </p>
            </div>
          </>
        )}

        {status.status === 'error' && (
          <div className="text-center py-4">
            <div
              className="w-12 h-12 mx-auto mb-4 flex items-center justify-center"
              style={{ background: '#0f0f0f', borderRadius: '4px' }}
            >
              <AlertCircle className="w-6 h-6" style={{ color: danger }} />
            </div>
            <h3 className="text-lg font-bold" style={{ color: textPrimary }}>分析失败</h3>
            <p className="mt-2 break-words" style={{ color: danger, fontSize: '14px' }}>{status.error}</p>
            <p className="mt-2" style={{ color: textMuted, fontSize: '13px' }}>
              {status.message}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
