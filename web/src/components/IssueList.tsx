import { AlertTriangle, AlertCircle, Info, Shield, Wrench, Zap, Bug, CheckCircle } from 'lucide-react'
import type { ReviewIssue } from '@/types'

const surfaceBg = '#1b1b1b'
const borderColor = '#333333'
const textPrimary = '#ffffff'
const textSecondary = '#b3b3b3'
const textMuted = '#777777'
const accent = '#ff9900'
const danger = '#e5484d'

const severityConfig = {
  high: {
    label: '高',
    icon: AlertTriangle,
    borderLeft: danger,
    badgeBorder: 'rgba(229, 72, 77, 0.4)',
    badgeText: danger,
  },
  medium: {
    label: '中',
    icon: AlertCircle,
    borderLeft: accent,
    badgeBorder: 'rgba(255, 153, 0, 0.4)',
    badgeText: accent,
  },
  low: {
    label: '低',
    icon: Info,
    borderLeft: '#35a854',
    badgeBorder: 'rgba(53, 168, 84, 0.4)',
    badgeText: '#35a854',
  },
}

const categoryConfig = {
  security: { icon: Shield, label: '安全' },
  maintainability: { icon: Wrench, label: '可维护性' },
  performance: { icon: Zap, label: '性能' },
  bug: { icon: Bug, label: 'Bug' },
  test: { icon: CheckCircle, label: '测试' },
  other: { icon: Info, label: '其他' },
}

interface IssueListProps {
  title: string
  issues: ReviewIssue[]
  severity: 'high' | 'medium' | 'low'
}

export function IssueList({ title, issues, severity }: IssueListProps) {
  const config = severityConfig[severity]
  const Icon = config.icon

  if (issues.length === 0) {
    return (
      <div
        style={{
          background: surfaceBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
        }}
        className="p-4 sm:p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Icon className="w-5 h-5" style={{ color: config.badgeText }} />
          <h3 className="font-bold" style={{ color: textPrimary, fontSize: '16px' }}>{title}</h3>
          <span
            className="px-2 py-0.5 text-xs font-bold"
            style={{
              color: config.badgeText,
              border: `1px solid ${config.badgeBorder}`,
              borderRadius: '3px',
            }}
          >
            0
          </span>
        </div>
        <p className="text-center py-4" style={{ color: textMuted, fontSize: '13px' }}>暂无此类问题</p>
      </div>
    )
  }

  return (
    <div
      style={{
        background: surfaceBg,
        border: `1px solid ${borderColor}`,
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        className="px-4 sm:px-5 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" style={{ color: config.badgeText }} />
          <h3 className="font-bold" style={{ color: textPrimary, fontSize: '16px' }}>{title}</h3>
        </div>
        <span
          className="px-2 py-0.5 text-xs font-bold"
          style={{
            color: config.badgeText,
            border: `1px solid ${config.badgeBorder}`,
            borderRadius: '3px',
          }}
        >
          {issues.length}
        </span>
      </div>
      <div style={{ borderTop: `1px solid ${borderColor}` }}>
        {issues.map((issue, index) => {
          const CategoryIcon = categoryConfig[issue.category].icon
          return (
            <div
              key={index}
              className="px-4 sm:px-5 py-4"
              style={{
                borderBottom: index < issues.length - 1 ? `1px solid ${borderColor}` : 'none',
                borderLeft: `3px solid ${config.borderLeft}`,
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium mb-2" style={{ color: textPrimary, fontSize: '14px' }}>
                    {issue.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span
                      className="px-2 py-0.5 text-xs font-mono"
                      style={{
                        background: '#0f0f0f',
                        color: textMuted,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '3px',
                      }}
                    >
                      {issue.file}
                    </span>
                    <span
                      className="flex items-center gap-1 px-2 py-0.5 text-xs"
                      style={{
                        background: '#0f0f0f',
                        color: textMuted,
                        border: `1px solid ${borderColor}`,
                        borderRadius: '3px',
                      }}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      {categoryConfig[issue.category].label}
                    </span>
                  </div>
                  <div
                    className="p-3 mt-2"
                    style={{
                      background: '#0f0f0f',
                      border: `1px solid ${borderColor}`,
                      borderRadius: '3px',
                    }}
                  >
                    <p style={{ color: textMuted, fontSize: '11px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      修复建议
                    </p>
                    <p style={{ color: textSecondary, fontSize: '13px' }}>{issue.suggestion}</p>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
