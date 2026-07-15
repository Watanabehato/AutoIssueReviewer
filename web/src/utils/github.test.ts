import { parseGithubUrl, detectLanguage, fetchFileContent, fetchRepoInfo, fetchRepoStructure, shouldExclude } from './github'

describe('parseGithubUrl', () => {
  it('should parse full HTTPS URL', () => {
    const result = parseGithubUrl('https://github.com/owner/repo')
    expect(result).toEqual({ owner: 'owner', repo: 'repo', valid: true })
  })

  it('should parse HTTPS URL with path', () => {
    const result = parseGithubUrl('https://github.com/owner/repo/tree/main/src')
    expect(result).toEqual({ owner: 'owner', repo: 'repo', valid: true })
  })

  it('should parse SSH URL', () => {
    const result = parseGithubUrl('git@github.com:owner/repo.git')
    expect(result).toEqual({ owner: 'owner', repo: 'repo', valid: true })
  })

  it('should parse owner/repo format', () => {
    const result = parseGithubUrl('owner/repo')
    expect(result).toEqual({ owner: 'owner', repo: 'repo', valid: true })
  })

  it('should reject invalid URLs', () => {
    const result = parseGithubUrl('https://example.com')
    expect(result).toEqual({ owner: '', repo: '', valid: false })
  })

  it('should handle empty string', () => {
    const result = parseGithubUrl('')
    expect(result).toEqual({ owner: '', repo: '', valid: false })
  })

  it('should trim whitespace and strip .git from HTTPS URLs', () => {
    expect(parseGithubUrl('  https://github.com/owner/repo.git  ')).toEqual({
      owner: 'owner', repo: 'repo', valid: true,
    })
  })

  it('should reject incomplete and query-only repository URLs', () => {
    expect(parseGithubUrl('owner/')).toEqual({ owner: '', repo: '', valid: false })
    expect(parseGithubUrl('https://github.com/owner')).toEqual({ owner: '', repo: '', valid: false })
  })
})

describe('GitHub API requests', () => {
  afterEach(() => vi.restoreAllMocks())

  it('fetches the complete recursive tree and encodes branch names', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ tree: [{ path: 'src/deep/file.ts', type: 'blob', size: 12 }] }),
    } as Response)

    await expect(fetchRepoStructure('owner', 'repo', 'feature/a b')).resolves.toEqual([
      { path: 'src/deep/file.ts', type: 'file', size: 12 },
    ])

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/owner/repo/git/trees/feature%2Fa%20b?recursive=1'
    )
  })

  it('rejects truncated trees instead of silently skipping files', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ tree: [], truncated: true }),
    } as Response)

    await expect(fetchRepoStructure('owner', 'repo')).rejects.toThrow('too large')
  })

  it('decodes UTF-8 base64 file content without mojibake', async () => {
    const original = '你好，RepoLens!'
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: async () => original,
    } as Response)

    await expect(fetchFileContent('owner', 'repo', '文档/a b.md', 'feature/i18n'))
      .resolves.toBe(original)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cdn.jsdelivr.net/gh/owner/repo@feature%2Fi18n/%E6%96%87%E6%A1%A3/a%20b.md'
    )
  })

  it('falls back to jsDelivr when the anonymous GitHub rate limit is exhausted', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: false, status: 403 } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ files: [{ name: '/src/deep/file.ts', size: 12 }] }),
      } as Response)

    await expect(fetchRepoInfo('limited-owner', 'limited-repo')).resolves.toMatchObject({
      owner: 'limited-owner', repo: 'limited-repo', defaultBranch: 'HEAD',
    })
    await expect(fetchRepoStructure('limited-owner', 'limited-repo', 'HEAD')).resolves.toEqual([
      { path: 'src/deep/file.ts', type: 'file', size: 12 },
    ])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})

describe('detectLanguage', () => {
  it('should detect Python', () => {
    expect(detectLanguage('main.py')).toBe('Python')
  })

  it('should detect JavaScript', () => {
    expect(detectLanguage('app.js')).toBe('JavaScript')
  })

  it('should detect TypeScript', () => {
    expect(detectLanguage('index.ts')).toBe('TypeScript')
  })

  it('should detect Dockerfile', () => {
    expect(detectLanguage('Dockerfile')).toBe('Dockerfile')
    expect(detectLanguage('docker/Dockerfile')).toBe('Dockerfile')
  })

  it('should detect unknown language', () => {
    expect(detectLanguage('data.xyz')).toBe('Text')
  })
})

describe('shouldExclude', () => {
  it('should exclude node_modules', () => {
    expect(shouldExclude('node_modules/pkg/index.js')).toBe(true)
  })

  it('should exclude .git directory', () => {
    expect(shouldExclude('.git/config')).toBe(true)
    expect(shouldExclude('src/.git/index')).toBe(true)
  })

  it('should exclude dist/build directories', () => {
    expect(shouldExclude('dist/main.js')).toBe(true)
    expect(shouldExclude('build/index.html')).toBe(true)
  })

  it('should exclude lock files', () => {
    expect(shouldExclude('package-lock.json')).toBe(true)
    expect(shouldExclude('Cargo.lock')).toBe(true)
  })

  it('should exclude binary files', () => {
    expect(shouldExclude('image.png')).toBe(true)
    expect(shouldExclude('archive.zip')).toBe(true)
  })

  it('should not exclude normal code files', () => {
    expect(shouldExclude('src/main.py')).toBe(false)
    expect(shouldExclude('src/components/App.tsx')).toBe(false)
    expect(shouldExclude('README.md')).toBe(false)
  })
})
