import { Activity, Code2, ScanSearch, Terminal } from 'lucide-react'

interface HeaderProps {
  onViewCLI: () => void
}

export function Header({ onViewCLI }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__accent" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-[72px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="brand-mark" aria-hidden="true">
              <ScanSearch className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[17px] sm:text-lg font-bold text-white">RepoLens AI</h1>
                <span className="status-indicator" title="服务就绪">
                  <Activity className="w-3 h-3" />
                  <span className="hidden md:inline">READY</span>
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-500">Repository intelligence console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onViewCLI}
              className="header-action"
              title="查看 CLI 工具"
            >
              <Terminal className="w-4 h-4" />
              <span className="hidden sm:inline">CLI 工具</span>
            </button>
            <a
              href="https://github.com/Watanabehato/AutoIssueReviewer"
              target="_blank"
              rel="noopener noreferrer"
              className="header-action"
              title="在 GitHub 查看源码"
            >
              <Code2 className="w-4 h-4" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
