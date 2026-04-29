"""共享测试夹具"""

import pytest
from auto_issue.config import Config


@pytest.fixture
def sample_config() -> Config:
    """提供一个标准测试配置"""
    return Config(
        api_key="sk-test-key",
        api_base_url="https://api.test.com/v1",
        model="test-model",
        max_file_size_kb=200,
        max_files_per_batch=5,
        max_repo_files=100,
    )
