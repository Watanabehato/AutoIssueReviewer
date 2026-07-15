import { callAI, parseAIResult, reviewFiles } from './ai'
import type { AIConfig, CodeFile } from '@/types'

describe('parseAIResult', () => {
  it('should parse valid JSON result', () => {
    const json = JSON.stringify({
      summary: 'Test summary',
      healthScore: 85,
      issues: [
        {
          file: 'src/test.py',
          description: 'Test issue',
          severity: 'high' as const,
          suggestion: 'Fix it',
          category: 'bug' as const,
        },
      ],
      testCoverage: {
        score: 70,
        suggestions: ['Add tests'],
      },
    })

    const result = parseAIResult(json)
    expect(result.summary).toBe('Test summary')
    expect(result.healthScore).toBe(85)
    expect(result.issues).toHaveLength(1)
    expect(result.testCoverage.score).toBe(70)
  })

  it('should handle JSON with markdown code block', () => {
    const json = '```json\n{"summary": "Test", "healthScore": 90, "issues": [], "testCoverage": {"score": 80, "suggestions": []}}\n```'
    const result = parseAIResult(json)
    expect(result.summary).toBe('Test')
    expect(result.healthScore).toBe(90)
  })

  it('should reject invalid JSON', () => {
    expect(() => parseAIResult('not valid json')).toThrow('无法解析')
  })

  it('should reject missing required fields', () => {
    expect(() => parseAIResult('{"summary":"partial"}')).toThrow('无法解析')
  })

  it('should reject out-of-range scores and unknown issue enums', () => {
    const invalid = {
      summary: 'bad', healthScore: 101,
      issues: [{ file: 'a.ts', description: 'x', suggestion: 'y', severity: 'critical', category: 'unknown' }],
      testCoverage: { score: -1, suggestions: [] },
    }
    expect(() => parseAIResult(JSON.stringify(invalid))).toThrow('无法解析')
  })
})

describe('callAI', () => {
  const config: AIConfig = {
    apiBaseUrl: 'https://example.com/v1/', apiKey: 'test-key', model: 'test-model',
  }

  afterEach(() => vi.restoreAllMocks())

  it('normalizes a trailing slash in the API base URL', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: ' result ' } }] }),
    } as Response)

    await expect(callAI(config, 'system', 'user')).resolves.toBe('result')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.com/v1/chat/completions', expect.any(Object)
    )
  })

  it('rejects malformed successful API responses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    } as Response)

    await expect(callAI(config, 'system', 'user')).rejects.toThrow('缺少有效')
  })
})

describe('reviewFiles', () => {
  afterEach(() => vi.restoreAllMocks())

  it('averages test coverage independently from repository health', async () => {
    const files: CodeFile[] = Array.from({ length: 6 }, (_, index) => ({
      path: `src/${index}.ts`, content: 'export {}', sizeKb: 1, language: 'TypeScript',
    }))
    const responses = [
      { summary: 'one', healthScore: 90, issues: [], testCoverage: { score: 20, suggestions: ['A'] } },
      { summary: 'two', healthScore: 70, issues: [], testCoverage: { score: 40, suggestions: ['A', 'B'] } },
    ]
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(responses[0]) } }] }) } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: JSON.stringify(responses[1]) } }] }) } as Response)

    const result = await reviewFiles(files, {
      apiBaseUrl: 'https://example.com/v1', apiKey: 'key', model: 'model',
    })

    expect(result.healthScore).toBe(87)
    expect(result.testCoverage.score).toBe(23)
    expect(result.testCoverage.suggestions).toEqual(['A', 'B'])
  })
})
