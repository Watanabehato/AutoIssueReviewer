// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { collectCodeFiles, fetchRepoInfo } from '@/utils/github'
import { reviewFiles } from '@/utils/ai'

vi.mock('lucide-react', async () => {
  const { createElement } = await import('react')
  const Icon = () => createElement('svg', { 'aria-hidden': 'true' })
  return {
    Activity: Icon, AlertCircle: Icon, AlertTriangle: Icon, ArrowRight: Icon,
    Bug: Icon, Check: Icon, CheckCircle: Icon, Clock: Icon, Code2: Icon,
    Copy: Icon, Download: Icon, FileCode: Icon, FileOutput: Icon, FileText: Icon,
    FolderGit2: Icon, Gauge: Icon, GitFork: Icon, Info: Icon, Loader2: Icon,
    Lock: Icon, RefreshCw: Icon, ScanSearch: Icon, Shield: Icon,
    ShieldCheck: Icon, Star: Icon, Terminal: Icon, Wrench: Icon, X: Icon, Zap: Icon,
  }
})

vi.mock('@/utils/github', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utils/github')>()
  return {
    ...actual,
    fetchRepoInfo: vi.fn(),
    collectCodeFiles: vi.fn(),
  }
})

vi.mock('@/utils/ai', () => ({ reviewFiles: vi.fn() }))

describe('App review flow', () => {
  beforeEach(() => {
    vi.mocked(fetchRepoInfo).mockResolvedValue({
      owner: 'owner', repo: 'repo', name: 'repo', description: '',
      language: 'TypeScript', stars: 1, forks: 0, defaultBranch: 'main',
    })
    vi.mocked(collectCodeFiles).mockResolvedValue([
      { path: 'src/index.ts', content: 'export {}', sizeKb: 1, language: 'TypeScript' },
    ])
    vi.mocked(reviewFiles).mockResolvedValue({
      repo: '', healthScore: 90, summary: 'Good', highIssues: [], mediumIssues: [],
      lowIssues: [], securityRisks: [], maintainabilityIssues: [],
      testCoverage: { score: 80, suggestions: [] }, fileCount: 1,
      timestamp: '2026-07-15T00:00:00.000Z',
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('continues the pending review immediately after the first AI configuration', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText(/owner\/repo/), 'owner/repo')
    await user.click(screen.getByRole('button', { name: /开始分析/ }))

    expect(screen.getByRole('dialog', { name: 'AI 配置' })).toBeTruthy()
    expect(fetchRepoInfo).not.toHaveBeenCalled()

    await user.type(screen.getByLabelText('API Key'), 'test-key')
    await user.click(screen.getByRole('button', { name: '确认' }))

    await waitFor(() => expect(fetchRepoInfo).toHaveBeenCalledWith('owner', 'repo'))
    await waitFor(() => expect(reviewFiles).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('审查完成')).toBeTruthy()
  })

  it('shows validation feedback for an invalid repository URL', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.type(screen.getByPlaceholderText(/owner\/repo/), 'not-a-repository')
    await user.click(screen.getByRole('button', { name: /开始分析/ }))

    expect(screen.getByText('请输入有效的 GitHub 仓库地址')).toBeTruthy()
    expect(fetchRepoInfo).not.toHaveBeenCalled()
  })

  it('renders the sample report without requiring an API key', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByRole('button', { name: /体验示例/ }))

    expect(screen.getByText('审查完成')).toBeTruthy()
    expect(screen.getByText('示例模式')).toBeTruthy()
    expect(fetchRepoInfo).not.toHaveBeenCalled()
  })
})
