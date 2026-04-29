"""AutoIssue 项目常量定义"""

# ── 版本信息 ──────────────────────────────────────────────────────────────────
__version__ = "1.0.0"

# ── 可执行文件路径 ──────────────────────────────────────────────────────────────
GH_FALLBACK_PATH_WIN = r"C:\Program Files\GitHub CLI\gh.exe"

# ── AI 重试策略 ─────────────────────────────────────────────────────────────────
RETRY_BASE_DELAY = 10           # 指数退避基数（秒）
RETRY_MAX_BACKOFF = 30          # 最大退避基数（秒）
RETRY_CONNECTION_DELAY = 5      # 连接错误固定等待（秒）
NON_RETRYABLE_STATUS_CODES = (401, 403, 404)  # 不可重试的 HTTP 状态码

# ── 配置文件 ─────────────────────────────────────────────────────────────────────
CONFIG_FILE_NAME = ".autoissue.json"

# ── GitHub 镜像源（按优先级排序）──────────────────────────────────────────────────
GITHUB_MIRRORS = [
    "https://ghproxy.com/https://github.com",
    "https://mirror.ghproxy.com/https://github.com",
    "https://gitclone.com/github.com",
]

# ── 无明显问题的关键词列表 ─────────────────────────────────────────────────────────
NO_ISSUE_KEYWORDS = [
    "无明显问题",
    "未发现明显问题",
    "no significant issues",
    "no issues found",
    "no issues were found",
    "no bugs",
    "no problems found",
]

# ── 文件类型映射 ─────────────────────────────────────────────────────────────────
EXTENSION_LANGUAGE_MAP = {
    ".py": "Python", ".js": "JavaScript", ".ts": "TypeScript",
    ".jsx": "JSX", ".tsx": "TSX", ".java": "Java",
    ".c": "C", ".cpp": "C++", ".h": "C/C++ Header",
    ".cs": "C#", ".go": "Go", ".rs": "Rust",
    ".php": "PHP", ".rb": "Ruby", ".swift": "Swift",
    ".kt": "Kotlin", ".scala": "Scala", ".r": "R",
    ".sh": "Shell", ".bash": "Shell", ".zsh": "Shell",
    ".yml": "YAML", ".yaml": "YAML", ".json": "JSON",
    ".toml": "TOML", ".xml": "XML", ".html": "HTML",
    ".css": "CSS", ".scss": "SCSS", ".less": "LESS",
    ".sql": "SQL", ".md": "Markdown", ".tf": "Terraform",
    ".vue": "Vue", ".svelte": "Svelte",
    ".dockerfile": "Dockerfile",
}
