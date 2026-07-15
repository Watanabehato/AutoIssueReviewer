import { useState } from 'react'
import { X, Lock, AlertTriangle } from 'lucide-react'
import type { AIConfig } from '@/types'

const surfaceBg = '#1b1b1b'
const surfaceHover = '#252525'
const borderColor = '#333333'
const textPrimary = '#ffffff'
const textSecondary = '#b3b3b3'
const textMuted = '#777777'
const accent = '#ff9900'
const accentHover = '#ffad28'
const onAccent = '#111111'

interface AIConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (config: AIConfig) => void
}

export function AIConfigModal({ isOpen, onClose, onSubmit }: AIConfigModalProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.openai.com/v1')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4o')

  const handleSubmit = () => {
    if (!apiKey.trim()) {
      alert('请输入 API Key')
      return
    }
    const normalizedBaseUrl = apiBaseUrl.trim() || 'https://api.openai.com/v1'
    try {
      const parsedUrl = new URL(normalizedBaseUrl)
      const isLocal = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname)
      if (parsedUrl.protocol !== 'https:' && !(isLocal && parsedUrl.protocol === 'http:')) {
        alert('API Base URL 必须使用 HTTPS（本机地址除外）')
        return
      }
    } catch {
      alert('请输入有效的 API Base URL')
      return
    }
    onSubmit({
      apiBaseUrl: normalizedBaseUrl,
      apiKey: apiKey.trim(),
      model: model.trim() || 'gpt-4o',
    })
    setApiKey('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: 'rgba(0, 0, 0, 0.7)' }}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-config-title"
        style={{
          background: surfaceBg,
          border: `1px solid ${borderColor}`,
          borderRadius: '4px',
        }}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 id="ai-config-title" className="text-lg font-bold" style={{ color: textPrimary }}>AI 配置</h3>
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

          <div
            className="mb-4 p-3"
            style={{
              background: '#0f0f0f',
              border: `1px solid ${borderColor}`,
              borderRadius: '4px',
            }}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: accent }} />
              <div style={{ fontSize: '13px', color: textSecondary }}>
                <p className="font-bold" style={{ color: textPrimary }}>隐私提示</p>
                <p className="mt-1" style={{ color: textMuted }}>
                  API Key 仅保存在当前页面内存中，并只发送到你配置的 AI API 服务；不会写入 localStorage 或日志，关闭页面后自动清除。
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="api-base-url" className="block text-sm font-bold mb-1.5" style={{ color: textSecondary }}>
                API Base URL
              </label>
              <input
                id="api-base-url"
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full outline-none"
                style={{
                  background: '#0f0f0f',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  padding: '10px 14px',
                  color: textPrimary,
                  fontSize: '14px',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
                onBlur={(e) => { e.currentTarget.style.borderColor = borderColor }}
              />
            </div>

            <div>
              <label htmlFor="api-key" className="block text-sm font-bold mb-1.5" style={{ color: textSecondary }}>
                API Key
              </label>
              <div className="relative">
                <input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxx..."
                  className="w-full outline-none"
                  style={{
                    background: '#0f0f0f',
                    border: `1px solid ${borderColor}`,
                    borderRadius: '4px',
                    padding: '10px 14px',
                    paddingRight: '40px',
                    color: textPrimary,
                    fontSize: '14px',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = borderColor }}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: textMuted }} />
              </div>
            </div>

            <div>
              <label htmlFor="model-name" className="block text-sm font-bold mb-1.5" style={{ color: textSecondary }}>
                模型名称
              </label>
              <input
                id="model-name"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gpt-4o"
                className="w-full outline-none"
                style={{
                  background: '#0f0f0f',
                  border: `1px solid ${borderColor}`,
                  borderRadius: '4px',
                  padding: '10px 14px',
                  color: textPrimary,
                  fontSize: '14px',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = accent }}
                onBlur={(e) => { e.currentTarget.style.borderColor = borderColor }}
              />
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 font-bold transition-colors"
              style={{
                background: 'transparent',
                color: textSecondary,
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                fontSize: '14px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = surfaceHover
                e.currentTarget.style.color = textPrimary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = textSecondary
              }}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 font-bold transition-colors"
              style={{
                background: accent,
                color: onAccent,
                borderRadius: '4px',
                fontSize: '14px',
                border: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = accentHover }}
              onMouseLeave={(e) => { e.currentTarget.style.background = accent }}
            >
              确认
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
