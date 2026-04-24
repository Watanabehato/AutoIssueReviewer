"""GitHub 仓库代码获取模块：克隆仓库并读取代码文件"""

import os
import shutil
import subprocess
import tempfile
import fnmatch
from pathlib import Path
from typing import Generator, Optional
from dataclasses import dataclass

from .config import Config


def _get_executable(name: str) -> str:
    """获取可执行文件路径，避免 PATH 问题"""
    import shutil as _sh
    path = _sh.which(name)
    if path:
        return path
    # Windows 兜底路径
    if name == "gh" and os.path.isfile(r"C:\Program Files\GitHub CLI\gh.exe"):
        return r"C:\Program Files\GitHub CLI\gh.exe"
    return name


@dataclass
class CodeFile:
    path: str          # 相对于仓库根目录的路径
    content: str       # 文件内容
    size_kb: float     # 文件大小（KB）
    language: str      # 推断的编程语言


# 根据扩展名推断语言
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


def _detect_language(file_path: str) -> str:
    p = Path(file_path)
    # 特殊文件名
    if p.name.lower() == "dockerfile":
        return "Dockerfile"
    if p.name.lower() in ("makefile", "gnumakefile"):
        return "Makefile"
    return EXTENSION_LANGUAGE_MAP.get(p.suffix.lower(), "Text")


def _should_exclude(rel_path: str, patterns: list) -> bool:
    """检查文件是否应该被排除"""
    for pattern in patterns:
        if fnmatch.fnmatch(rel_path, pattern):
            return True
        # 也匹配仅文件名
        if fnmatch.fnmatch(Path(rel_path).name, pattern):
            return True
        # 目录匹配
        parts = Path(rel_path).parts
        for i in range(len(parts)):
            partial = str(Path(*parts[:i+1]))
            if fnmatch.fnmatch(partial + "/", pattern) or fnmatch.fnmatch(partial + "/*", pattern):
                pass
        # 简单目录前缀匹配
        pattern_clean = pattern.rstrip("/*")
        if "/" in pattern or "*" in pattern:
            if fnmatch.fnmatch(rel_path, pattern.replace("/*", "/**")):
                return True
            # 检查路径的任意前缀
            for i in range(len(parts) - 1):
                prefix = "/".join(parts[:i+1])
                if fnmatch.fnmatch(prefix, pattern_clean):
                    return True
    return False


def clone_repo(repo: str, target_dir: str, branch: Optional[str] = None) -> str:
    """
    克隆 GitHub 仓库到指定目录。
    repo 格式：owner/repo 或完整 HTTPS/SSH URL
    返回实际克隆到的目录路径。
    """
    if not repo.startswith("http") and not repo.startswith("git@"):
        # owner/repo 格式，使用 gh 克隆（已登录，可访问私有仓库）
        cmd = [_get_executable("gh"), "repo", "clone", repo, target_dir, "--"]
    else:
        cmd = [_get_executable("git"), "clone", repo, target_dir]

    if branch:
        cmd += ["--branch", branch, "--single-branch"]

    cmd += ["--depth", "1"]   # 浅克隆，只取最新快照

    print(f"  正在克隆仓库 {repo} ...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(
            f"克隆失败：{result.stderr.strip() or result.stdout.strip()}"
        )
    print(f"  克隆完成 → {target_dir}")
    return target_dir


def collect_code_files(
    repo_dir: str,
    config: Config,
    verbose: bool = False,
) -> list[CodeFile]:
    """
    遍历仓库目录，收集需要审查的代码文件。
    """
    repo_path = Path(repo_dir)
    files: list[CodeFile] = []
    skipped_count = 0

    for file_path in sorted(repo_path.rglob("*")):
        if not file_path.is_file():
            continue

        rel = file_path.relative_to(repo_path).as_posix()

        # 排除 .git 目录
        if rel.startswith(".git/") or "/.git/" in rel:
            continue

        # 按 pattern 排除
        if _should_exclude(rel, config.exclude_patterns):
            if verbose:
                print(f"  [跳过-规则] {rel}")
            skipped_count += 1
            continue

        # 按大小排除
        size_kb = file_path.stat().st_size / 1024
        if size_kb > config.max_file_size_kb:
            if verbose:
                print(f"  [跳过-大小 {size_kb:.1f}KB] {rel}")
            skipped_count += 1
            continue

        # 尝试读取文件内容（跳过二进制文件）
        try:
            content = file_path.read_text(encoding="utf-8", errors="strict")
        except (UnicodeDecodeError, PermissionError):
            if verbose:
                print(f"  [跳过-二进制] {rel}")
            skipped_count += 1
            continue

        language = _detect_language(rel)
        files.append(CodeFile(
            path=rel,
            content=content,
            size_kb=size_kb,
            language=language,
        ))

        if len(files) >= config.max_repo_files:
            print(f"  [提示] 已达到最大文件数限制 ({config.max_repo_files})，停止收集。")
            break

    print(f"  收集到 {len(files)} 个代码文件，跳过 {skipped_count} 个文件。")
    return files


def batch_files(
    files: list[CodeFile],
    batch_size: int,
) -> Generator[list[CodeFile], None, None]:
    """将文件列表按批次产出"""
    for i in range(0, len(files), batch_size):
        yield files[i: i + batch_size]
