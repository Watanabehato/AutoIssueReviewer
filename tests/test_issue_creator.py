import subprocess
from unittest.mock import Mock

from auto_issue import issue_creator
from auto_issue.config import Config


def test_run_gh_returns_failed_process_when_executable_is_missing(monkeypatch):
    monkeypatch.setattr(issue_creator, "_get_gh_executable", lambda: "missing-gh")
    monkeypatch.setattr(issue_creator.subprocess, "run", Mock(side_effect=FileNotFoundError("missing")))

    result = issue_creator._run_gh(["auth", "status"])

    assert result.returncode == 127
    assert "missing" in result.stderr


def test_create_issue_sends_body_via_stdin(monkeypatch):
    run_gh = Mock(return_value=subprocess.CompletedProcess([], 0, "https://example.test/1\n", ""))
    monkeypatch.setattr(issue_creator, "_run_gh", run_gh)

    url = issue_creator.create_issue("owner/repo", "title", "x" * 40_000)

    assert url == "https://example.test/1"
    args = run_gh.call_args.args[0]
    assert args[-2:] == ["--body-file", "-"]
    assert run_gh.call_args.kwargs["input_text"] == "x" * 40_000


def test_build_issue_body_respects_github_size_limit():
    body = issue_creator.build_issue_body(
        "owner/repo", "summary", ["x" * 70_000], 1, Config()
    )

    assert len(body) <= issue_creator.MAX_ISSUE_BODY_CHARS
    assert "已截断" in body


def test_build_issue_body_can_preserve_full_output():
    body = issue_creator.build_issue_body(
        "owner/repo", "summary", ["x" * 70_000], 1, Config(), truncate=False
    )

    assert len(body) > issue_creator.MAX_ISSUE_BODY_CHARS
    assert "已截断" not in body
