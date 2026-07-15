from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from auto_issue.config import Config
from auto_issue import reviewer
from auto_issue.fetcher import CodeFile


class FakeRateLimitError(Exception):
    pass


def _response(content: str):
    return SimpleNamespace(
        choices=[SimpleNamespace(message=SimpleNamespace(content=content))]
    )


def test_rate_limit_exhaustion_switches_to_next_model(monkeypatch):
    first_client = Mock()
    first_client.chat.completions.create.side_effect = FakeRateLimitError()
    second_client = Mock()
    second_client.chat.completions.create.return_value = _response("ok")
    clients = iter([first_client, second_client])

    monkeypatch.setattr(reviewer, "OpenAI", lambda **_: next(clients))
    monkeypatch.setattr(reviewer, "RateLimitError", FakeRateLimitError)
    monkeypatch.setattr(reviewer.time, "sleep", Mock())

    instance = reviewer.CodeReviewer(Config(api_keys=["key-1", "key-2"], models=["model"]))

    assert instance._chat("system", "user", retries=2) == "ok"
    assert first_client.chat.completions.create.call_count == 2
    assert second_client.chat.completions.create.call_count == 1
    assert instance._current_key == "key-2"


def test_rate_limit_exhaustion_raises_for_single_model(monkeypatch):
    client = Mock()
    client.chat.completions.create.side_effect = FakeRateLimitError()

    monkeypatch.setattr(reviewer, "OpenAI", lambda **_: client)
    monkeypatch.setattr(reviewer, "RateLimitError", FakeRateLimitError)
    monkeypatch.setattr(reviewer.time, "sleep", Mock())

    instance = reviewer.CodeReviewer(Config(api_key="key", model="model"))

    with pytest.raises(RuntimeError, match="所有 1 个模型组合均失败"):
        instance._chat("system", "user", retries=2)
    assert client.chat.completions.create.call_count == 2


def test_retry_after_supports_http_dates():
    assert reviewer._retry_after_seconds("0") == 0
    assert reviewer._retry_after_seconds("Wed, 21 Oct 2015 07:28:00 GMT") == 0


def test_prompt_content_is_truncated(monkeypatch):
    client = Mock()
    monkeypatch.setattr(reviewer, "OpenAI", lambda **_: client)
    instance = reviewer.CodeReviewer(Config(api_key="key"))
    file = CodeFile("large.py", "x" * (reviewer.MAX_CHARS_PER_FILE + 100), 20, "Python")

    prompt = instance._format_files_for_prompt([file])

    assert "内容已截断" in prompt
    assert len(prompt) < reviewer.MAX_CHARS_PER_FILE + 100
