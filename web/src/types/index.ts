export interface RepoInfo {
  owner: string
  repo: string
  name: string
  description: string
  language: string
  stars: number
  forks: number
  defaultBranch: string
}

export interface CodeFile {
  path: string
  content: string
  sizeKb: number
  language: string
}

export interface ReviewIssue {
  file: string
  description: string
  severity: 'high' | 'medium' | 'low'
  suggestion: string
  category: 'security' | 'maintainability' | 'performance' | 'bug' | 'test' | 'other'
}

export interface ReviewResult {
  repo: string
  healthScore: number
  summary: string
  highIssues: ReviewIssue[]
  mediumIssues: ReviewIssue[]
  lowIssues: ReviewIssue[]
  securityRisks: ReviewIssue[]
  maintainabilityIssues: ReviewIssue[]
  testCoverage: {
    score: number
    suggestions: string[]
  }
  fileCount: number
  timestamp: string
}

export interface AIConfig {
  apiBaseUrl: string
  apiKey: string
  model: string
}

export interface ReviewStatus {
  status: 'idle' | 'loading' | 'reviewing' | 'completed' | 'error'
  step: number
  totalSteps: number
  currentFile: string
  message: string
  error?: string
}

export interface ParsedRepoUrl {
  owner: string
  repo: string
  valid: boolean
}
