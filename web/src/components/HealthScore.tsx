const textPrimary = '#ffffff'
const textMuted = '#777777'
const accent = '#ff9900'
const success = '#35a854'
const danger = '#e5484d'

interface HealthScoreProps {
  score: number
}

export function HealthScore({ score }: HealthScoreProps) {
  const getColor = () => {
    if (score >= 80) return success
    if (score >= 60) return accent
    return danger
  }

  const getLabel = () => {
    if (score >= 80) return '优秀'
    if (score >= 60) return '良好'
    if (score >= 40) return '一般'
    return '较差'
  }

  const color = getColor()

  return (
    <div
      style={{
        background: '#0f0f0f',
        border: '1px solid #333',
        borderRadius: '4px',
      }}
      className="p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p style={{ color: textMuted, fontSize: '13px', marginBottom: '4px' }}>仓库健康度评分</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-bold" style={{ color: textPrimary }}>
              {score}
            </span>
            <span style={{ color: textMuted, fontSize: '16px' }}>/100</span>
          </div>
        </div>
        <div
          className="px-3 py-1.5 text-sm font-bold"
          style={{
            color: color,
            background: 'transparent',
            border: `1px solid ${color}`,
            borderRadius: '3px',
          }}
        >
          {getLabel()}
        </div>
      </div>

      <div className="mt-4">
        <div
          className="h-2 overflow-hidden"
          style={{ background: '#1b1b1b', borderRadius: '2px' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${score}%`,
              background: color,
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      <div className="mt-2 flex justify-between" style={{ color: textMuted, fontSize: '11px' }}>
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  )
}
