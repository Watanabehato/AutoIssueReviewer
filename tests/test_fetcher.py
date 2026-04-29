"""测试代码获取模块"""

import pytest
from pathlib import Path
from auto_issue.fetcher import (
    CodeFile,
    _detect_language,
    _should_exclude,
    batch_files,
    collect_code_files,
)
from auto_issue.config import Config


class TestDetectLanguage:
    """测试语言检测"""

    def test_python(self):
        assert _detect_language("main.py") == "Python"

    def test_javascript(self):
        assert _detect_language("app.js") == "JavaScript"

    def test_typescript(self):
        assert _detect_language("index.ts") == "TypeScript"

    def test_dockerfile(self):
        assert _detect_language("Dockerfile") == "Dockerfile"
        assert _detect_language("docker/Dockerfile") == "Dockerfile"

    def test_makefile(self):
        assert _detect_language("Makefile") == "Makefile"

    def test_unknown_extension(self):
        assert _detect_language("data.xyz") == "Text"

    def test_no_extension(self):
        assert _detect_language("README") == "Text"


class TestShouldExclude:
    """测试文件排除逻辑"""

    def test_exclude_node_modules(self):
        assert _should_exclude("node_modules/pkg/index.js", ["node_modules/*"]) is True

    def test_exclude_git_dir(self):
        assert _should_exclude(".git/config", [".git/*"]) is True

    def test_exclude_lock_files(self):
        assert _should_exclude("Cargo.lock", ["*.lock"]) is True

    def test_exclude_pycache(self):
        assert _should_exclude("__pycache__/module.pyc", ["__pycache__/*"]) is True

    def test_not_exclude_normal_file(self):
        assert _should_exclude("src/main.py", ["node_modules/*", ".git/*"]) is False

    def test_exclude_by_filename(self):
        assert _should_exclude("path/to/file.min.js", ["*.min.js"]) is True


class TestBatchFiles:
    """测试文件批处理"""

    def test_batch_size_3(self):
        """10 个文件，批次大小 3 → 4 批（3, 3, 3, 1）"""
        files = [CodeFile(path=f"f{i}.py", content="", size_kb=1.0, language="Python") for i in range(10)]
        batches = list(batch_files(files, 3))
        assert len(batches) == 4
        assert len(batches[0]) == 3
        assert len(batches[1]) == 3
        assert len(batches[2]) == 3
        assert len(batches[3]) == 1

    def test_batch_size_larger_than_list(self):
        """批次大小大于文件数 → 1 批"""
        files = [CodeFile(path=f"f{i}.py", content="", size_kb=1.0, language="Python") for i in range(3)]
        batches = list(batch_files(files, 10))
        assert len(batches) == 1
        assert len(batches[0]) == 3

    def test_empty_list(self):
        """空列表 → 0 批"""
        batches = list(batch_files([], 5))
        assert len(batches) == 0


class TestCollectCodeFiles:
    """测试代码文件收集"""

    def test_collect_basic(self, tmp_path):
        """基本文件收集"""
        (tmp_path / "main.py").write_text("print('hello')")
        (tmp_path / "utils.js").write_text("console.log('hello')")
        (tmp_path / "README.md").write_text("# Hello")

        cfg = Config(max_repo_files=100)
        files = collect_code_files(str(tmp_path), cfg)
        assert len(files) == 3

    def test_collect_respects_max_size(self, tmp_path):
        """超过大小限制的文件被跳过"""
        (tmp_path / "small.py").write_text("x = 1")
        (tmp_path / "large.py").write_text("x = 1" * 100000)  # ~500KB

        cfg = Config(max_file_size_kb=1)  # 1KB 限制
        files = collect_code_files(str(tmp_path), cfg)
        assert len(files) == 1
        assert files[0].path == "small.py"

    def test_collect_skips_git_dir(self, tmp_path):
        """跳过 .git 目录"""
        git_dir = tmp_path / ".git"
        git_dir.mkdir()
        (git_dir / "config").write_text("[core]")
        (tmp_path / "main.py").write_text("x = 1")

        cfg = Config(max_repo_files=100)
        files = collect_code_files(str(tmp_path), cfg)
        assert len(files) == 1
        assert files[0].path == "main.py"

    def test_collect_skips_binary(self, tmp_path):
        """跳过二进制文件"""
        (tmp_path / "code.py").write_text("x = 1")
        (tmp_path / "binary.bin").write_bytes(b"\x80\x81\x82\x83")

        cfg = Config(max_repo_files=100)
        files = collect_code_files(str(tmp_path), cfg)
        assert len(files) == 1
        assert files[0].path == "code.py"

    def test_collect_respects_max_repo_files(self, tmp_path):
        """达到最大文件数限制时停止"""
        for i in range(10):
            (tmp_path / f"f{i:02d}.py").write_text(f"x = {i}")

        cfg = Config(max_repo_files=5)
        files = collect_code_files(str(tmp_path), cfg)
        assert len(files) == 5
