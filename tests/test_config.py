"""测试配置管理模块"""

import json
import os
import pytest
from pathlib import Path
from auto_issue.config import Config, load_config


class TestConfigDefaults:
    """测试 Config 默认值"""

    def test_default_values(self):
        """默认配置值正确"""
        cfg = Config()
        assert cfg.api_base_url == "https://api.openai.com/v1"
        assert cfg.api_key == ""
        assert cfg.api_keys == []
        assert cfg.model == "gpt-4o"
        assert cfg.models == []
        assert cfg.max_tokens == 4096
        assert cfg.review_language == "zh"
        assert cfg.max_file_size_kb == 200
        assert cfg.max_files_per_batch == 10
        assert cfg.max_repo_files == 200
        assert cfg.batch_delay_seconds == 5.0
        assert cfg.issue_title_prefix == "[AutoReview]"
        assert cfg.issue_labels == ["automated-review"]
        assert cfg.add_summary is True

    def test_exclude_patterns_not_empty(self):
        """默认排除模式不为空"""
        cfg = Config()
        assert len(cfg.exclude_patterns) > 0
        assert "*.lock" in cfg.exclude_patterns
        assert "node_modules/*" in cfg.exclude_patterns


class TestLoadConfig:
    """测试 load_config 函数"""

    def test_load_from_file(self, tmp_path):
        """从文件加载配置"""
        config_file = tmp_path / ".autoissue.json"
        config_data = {
            "api_key": "sk-test-123",
            "model": "gpt-4-turbo",
            "review_language": "en",
        }
        config_file.write_text(json.dumps(config_data), encoding="utf-8")

        cfg = load_config(str(config_file))
        assert cfg.api_key == "sk-test-123"
        assert cfg.model == "gpt-4-turbo"
        assert cfg.review_language == "en"

    def test_load_missing_file(self, tmp_path, monkeypatch):
        """加载不存在的文件时返回默认配置"""
        config_file = tmp_path / "nonexistent.json"
        # 隔离 cwd 和 home，避免读取真实配置文件
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(Path, "home", lambda: tmp_path)
        cfg = load_config(str(config_file))
        assert cfg.api_key == ""
        assert cfg.model == "gpt-4o"

    def test_env_override(self, tmp_path, monkeypatch):
        """环境变量覆盖配置"""
        # 隔离 cwd 和 home，避免读取真实配置文件
        monkeypatch.chdir(tmp_path)
        monkeypatch.setattr(Path, "home", lambda: tmp_path)

        monkeypatch.setenv("OPENAI_API_KEY", "sk-env-key")
        monkeypatch.setenv("OPENAI_API_BASE", "https://env.api.com/v1")
        monkeypatch.setenv("AUTOISSUE_MODEL", "env-model")

        cfg = load_config()
        assert cfg.api_key == "sk-env-key"
        assert cfg.api_keys == ["sk-env-key"]
        assert cfg.api_base_url == "https://env.api.com/v1"
        assert cfg.model == "env-model"
        assert cfg.models == ["env-model"]

    def test_multi_key_string_normalization(self, tmp_path):
        """逗号分隔的字符串转换为列表"""
        config_file = tmp_path / ".autoissue.json"
        config_data = {
            "api_keys": "sk-key1,sk-key2,sk-key3",
            "models": "gpt-4o,claude-haiku",
        }
        config_file.write_text(json.dumps(config_data), encoding="utf-8")

        cfg = load_config(str(config_file))
        assert cfg.api_keys == ["sk-key1", "sk-key2", "sk-key3"]
        assert cfg.models == ["gpt-4o", "claude-haiku"]

    def test_single_key_migration(self, tmp_path):
        """单 key 自动迁移到 api_keys 列表"""
        config_file = tmp_path / ".autoissue.json"
        config_data = {
            "api_key": "sk-single-key",
            "model": "gpt-4o",
        }
        config_file.write_text(json.dumps(config_data), encoding="utf-8")

        cfg = load_config(str(config_file))
        assert cfg.api_keys == ["sk-single-key"]
        assert cfg.models == ["gpt-4o"]
