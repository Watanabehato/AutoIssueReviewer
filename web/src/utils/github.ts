import type { ParsedRepoUrl, RepoInfo, CodeFile } from '@/types'

const GITHUB_API_BASE = 'https://api.github.com'

export function parseGithubUrl(url: string): ParsedRepoUrl {
  const trimmed = url.trim()

  const patterns = [
    /^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)(?:\/.*)?$/,
    /^git@github\.com:([^/]+)\/([^/?#]+)(?:\.git)?$/,
    /^([^/]+)\/([^/?#]+)$/,
  ]

  for (const pattern of patterns) {
    const match = trimmed.match(pattern)
    if (match) {
      let repo = match[2]
      if (repo.endsWith('.git')) {
        repo = repo.slice(0, -4)
      }
      return {
        owner: match[1],
        repo,
        valid: true,
      }
    }
  }

  return { owner: '', repo: '', valid: false }
}

export async function fetchRepoInfo(owner: string, repo: string): Promise<RepoInfo> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch repo info: ${response.status}`)
  }

  const data = await response.json()
  return {
    owner,
    repo,
    name: data.name,
    description: data.description || '',
    language: data.language || 'Unknown',
    stars: data.stargazers_count,
    forks: data.forks_count,
    defaultBranch: data.default_branch || 'main',
  }
}

export async function fetchRepoStructure(
  owner: string,
  repo: string,
  branch: string = 'main'
): Promise<{ path: string; type: 'file' | 'dir'; size?: number }[]> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch repository tree: ${response.status}`)
  }

  const data = await response.json()
  if (data.truncated) {
    throw new Error('Repository tree is too large for the GitHub API; please use the CLI version')
  }

  return (data.tree || [])
    .filter((item: { type: string }) => item.type === 'blob' || item.type === 'tree')
    .map((item: { path: string; type: 'blob' | 'tree'; size?: number }) => ({
      path: item.path,
      type: item.type === 'blob' ? 'file' as const : 'dir' as const,
      size: item.size,
    }))
}

export async function fetchFileContent(owner: string, repo: string, filePath: string, branch: string): Promise<string> {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodePath(filePath)}?ref=${encodeURIComponent(branch)}`
  )
  if (!response.ok) {
    throw new Error(`Failed to fetch file: ${response.status}`)
  }

  const data = await response.json()
  if (data.content) {
    const binary = atob(data.content.replace(/\s/g, ''))
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }
  throw new Error('File content not available')
}

function encodePath(path: string): string {
  return path.split('/').map(encodeURIComponent).join('/')
}

const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript',
  '.jsx': 'JSX', '.tsx': 'TSX', '.java': 'Java',
  '.c': 'C', '.cpp': 'C++', '.h': 'C/C++ Header',
  '.cs': 'C#', '.go': 'Go', '.rs': 'Rust',
  '.php': 'PHP', '.rb': 'Ruby', '.swift': 'Swift',
  '.kt': 'Kotlin', '.scala': 'Scala', '.r': 'R',
  '.sh': 'Shell', '.bash': 'Shell', '.zsh': 'Shell',
  '.yml': 'YAML', '.yaml': 'YAML', '.json': 'JSON',
  '.toml': 'TOML', '.xml': 'XML', '.html': 'HTML',
  '.css': 'CSS', '.scss': 'SCSS', '.less': 'LESS',
  '.sql': 'SQL', '.md': 'Markdown', '.tf': 'Terraform',
  '.vue': 'Vue', '.svelte': 'Svelte',
}

export function detectLanguage(filePath: string): string {
  const lowerPath = filePath.toLowerCase()
  if (lowerPath === 'dockerfile') return 'Dockerfile'
  if (lowerPath.includes('dockerfile')) return 'Dockerfile'
  if (lowerPath === 'makefile' || lowerPath === 'gnumakefile') return 'Makefile'

  const ext = filePath.split('.').pop()?.toLowerCase()
  if (ext) {
    return EXTENSION_LANGUAGE_MAP[`.${ext}`] || 'Text'
  }
  return 'Text'
}

const EXCLUDE_PATTERNS = [
  'node_modules/',
  '.git/',
  'dist/',
  'build/',
  '.next/',
  'coverage/',
  '__pycache__/',
  '.venv/',
  'venv/',
  'env/',
  '.idea/',
  '.vscode/',
]

const EXCLUDE_EXTENSIONS = [
  '.lock', '.sum', '.min.js', '.min.css',
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg',
  '.pdf', '.zip', '.tar', '.gz', '.7z',
  '.pyc', '.pyo', '.pyd',
  '.exe', '.dll', '.so', '.dylib',
  '.db', '.sqlite', '.sqlite3',
]

export function shouldExclude(filePath: string): boolean {
  const lowerPath = filePath.toLowerCase()

  for (const pattern of EXCLUDE_PATTERNS) {
    if (lowerPath.startsWith(pattern) || lowerPath.includes(`/${pattern}`)) {
      return true
    }
  }

  const ext = filePath.split('.').pop()?.toLowerCase()
  if (ext && EXCLUDE_EXTENSIONS.includes(`.${ext}`)) {
    return true
  }

  const fileName = lowerPath.split('/').pop() || ''
  if (fileName.endsWith('.lock') || fileName.includes('-lock')) {
    return true
  }

  return false
}

export async function collectCodeFiles(
  owner: string,
  repo: string,
  branch: string,
  maxFiles: number = 50,
  maxFileSizeKb: number = 200
): Promise<CodeFile[]> {
  const files: CodeFile[] = []
  const structure = await fetchRepoStructure(owner, repo, branch)

  const codeItems = structure
    .filter(item => item.type === 'file')
    .filter(item => !shouldExclude(item.path))
    .filter(item => !item.size || (item.size / 1024) <= maxFileSizeKb)
    .slice(0, maxFiles)

  for (const item of codeItems) {
    try {
      const content = await fetchFileContent(owner, repo, item.path, branch)
      const sizeKb = (item.size || 0) / 1024
      const language = detectLanguage(item.path)

      files.push({
        path: item.path,
        content,
        sizeKb,
        language,
      })
    } catch {
      continue
    }
  }

  return files
}
