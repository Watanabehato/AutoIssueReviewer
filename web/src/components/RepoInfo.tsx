import { Star, GitFork, Code2, Clock } from 'lucide-react'
import type { RepoInfo as RepoInfoType } from '@/types'

const surfaceBg = '#1b1b1b'
const borderColor = '#333333'
const textPrimary = '#ffffff'
const textSecondary = '#b3b3b3'
const textMuted = '#777777'
const accent = '#ff9900'

interface RepoInfoProps {
  info: RepoInfoType
}

export function RepoInfo({ info }: RepoInfoProps) {
  return (
    <div
      style={{
        background: surfaceBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
      }}
      className="p-4 sm:p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: textPrimary }}>
            <Code2 className="w-5 h-5" style={{ color: accent }} />
            {info.name}
          </h3>
          <p className="mt-1" style={{ color: textMuted, fontSize: '13px' }}>
            {info.owner}/{info.repo}
          </p>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 text-xs font-bold"
          style={{
            background: '#0f0f0f',
            color: accent,
            border: `1px solid ${borderColor}`,
            borderRadius: '3px',
          }}
        >
          {info.language}
        </div>
      </div>

      {info.description && (
        <p className="mb-4" style={{ color: textSecondary, fontSize: '14px' }}>
          {info.description}
        </p>
      )}

      <div className="flex items-center gap-4" style={{ fontSize: '13px' }}>
        <div className="flex items-center gap-1.5" style={{ color: textSecondary }}>
          <Star className="w-4 h-4" style={{ color: accent }} />
          <span>{info.stars}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: textMuted }}>
          <GitFork className="w-4 h-4" />
          <span>{info.forks}</span>
        </div>
        <div className="flex items-center gap-1.5" style={{ color: textMuted }}>
          <Clock className="w-4 h-4" />
          <span>分支: {info.defaultBranch}</span>
        </div>
      </div>
    </div>
  )
}
