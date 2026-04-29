"""配置管理模块：从配置文件和环境变量加载配置"""

import os
import json
from pathlib import Path
from dataclasses import dataclass, field
from typing import Optional


CONFIG_FILE_NAME = ".autoissue.json"


@dataclass
class Config:
    # AI API 配置（支持多 key/多模型，自动切换）
    api_base_url: str = "https://api.openai.com/v1"
    api_key: str = ""                    # 兼容单 key
    api_keys: list = field(default_factory=list)  # 多 key 列表，优先级高于 api_key
    model: str = "gpt-4o"                # 兼容单模型
    models: list = field(default_factory=list)      # 多模型列表，优先级高于 model
    max_tokens: int = 4096

    # 代码审查配置
    review_language: str = "zh"          # 审查结果语言：zh=中文，en=英文
    exclude_patterns: list = field(default_factory=lambda: [
        "*.lock", "*.sum", "*.min.js", "*.min.css",
        "node_modules/*", ".git/*", "dist/*", "build/*",
        "*.png", "*.jpg", "*.jpeg", "*.gif", "*.ico",
        "*.pdf", "*.zip", "*.tar", "*.gz",
        "__pycache__/*", "*.pyc", "*.pyo",
        ".venv/*", "venv/*", "env/*",
    ])
    max_file_size_kb: int = 200          # 超过此大小的文件跳过
    max_files_per_batch: int = 10        # 每批发送给 AI 的文件数
    max_repo_files: int = 200            # 最多处理的文件数
    batch_delay_seconds: float = 5.0     # 相邻批次之间的等待秒数（防止 API 限流）

    # Issue 配置
    issue_title_prefix: str = "[AutoReview]"
    issue_labels: list = field(default_factory=lambda: ["automated-review"])
    add_summary: bool = True             # 是否在 Issue 头部加总结


def load_config(config_path: Optional[str] = None) -> Config:
    """加载配置，优先级：命令行指定文件 > 当前目录 > HOME 目录 > 默认值"""
    cfg = Config()

    search_paths = []
    if config_path:
        search_paths.append(Path(config_path))
    search_paths.append(Path.cwd() / CONFIG_FILE_NAME)
    search_paths.append(Path.home() / CONFIG_FILE_NAME)

    loaded_path = None
    for p in search_paths:
        if p.exists():
            loaded_path = p
            break

    if loaded_path:
        try:
            with open(loaded_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for k, v in data.items():
                if hasattr(cfg, k):
                    setattr(cfg, k, v)
        except Exception as e:
            print(f"[警告] 读取配置文件 {loaded_path} 失败：{e}")

    # 处理多 key 和多模型的兼容逻辑
    # api_keys: 支持直接传列表，或传逗号分隔的字符串
    raw_keys = cfg.api_keys
    if isinstance(raw_keys, str):
        cfg.api_keys = [k.strip() for k in raw_keys.split(",") if k.strip()]
    elif not isinstance(raw_keys, list):
        cfg.api_keys = []

    # 兼容旧的单 key 配置
    if not cfg.api_keys and cfg.api_key:
        cfg.api_keys = [cfg.api_key]

    # models: 支持直接传列表，或传逗号分隔的字符串
    raw_models = cfg.models
    if isinstance(raw_models, str):
        cfg.models = [m.strip() for m in raw_models.split(",") if m.strip()]
    elif not isinstance(raw_models, list):
        cfg.models = []

    # 兼容旧的单模型配置
    if not cfg.models and cfg.model:
        cfg.models = [cfg.model]

    # 环境变量覆盖（优先级最高）
    if os.environ.get("OPENAI_API_KEY"):
        cfg.api_key = os.environ["OPENAI_API_KEY"]
        cfg.api_keys = [cfg.api_key]  # 同步更新列表
    if os.environ.get("OPENAI_API_BASE"):
        cfg.api_base_url = os.environ["OPENAI_API_BASE"]
    if os.environ.get("AUTOISSUE_MODEL"):
        cfg.model = os.environ["AUTOISSUE_MODEL"]
        cfg.models = [cfg.model]  # 同步更新列表

    return cfg


def generate_sample_config() -> str:
    """生成示例配置文件内容"""
    sample = {
        "api_base_url": "https://your-api-proxy.com/v1",
        # 支持多 key/多模型，自动切换（任一 key 报错则尝试下一个）
        "api_keys": ["sk-key1-xxxxxxxxxxxxxxxx", "sk-key2-xxxxxxxxxxxxxxxx"],
        "models": ["gpt-4o", "claude-haiku-4-5-20251001"],
        # 兼容单 key/单模型写法（会被合并到 api_keys/models 中）
        "api_key": "sk-xxxxxxxxxxxxxxxx",
        "model": "gpt-4o",
        "max_tokens": 4096,
        "review_language": "zh",
        "exclude_patterns": [
            "*.lock", "node_modules/*", ".git/*", "dist/*",
            "*.png", "*.jpg", "__pycache__/*", "*.pyc"
        ],
        "max_file_size_kb": 200,
        "max_files_per_batch": 10,
        "max_repo_files": 200,
        "batch_delay_seconds": 5.0,
        "issue_title_prefix": "[AutoReview]",
        "issue_labels": ["automated-review"],
        "add_summary": True
    }
    return json.dumps(sample, ensure_ascii=False, indent=2)
