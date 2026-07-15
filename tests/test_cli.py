from argparse import Namespace

from auto_issue import cli
from auto_issue.config import Config
from auto_issue.fetcher import CodeFile


def _args(**overrides):
    values = {
        "repo": "owner/repo", "branch": None, "config": None,
        "api_key": None, "api_base": None, "model": None, "lang": None,
        "dry_run": True, "verbose": False, "output": None, "no_issue": True,
    }
    values.update(overrides)
    return Namespace(**values)


def _run_review(monkeypatch, config, args):
    captured = {}

    class FakeReviewer:
        def __init__(self, received_config):
            captured["config"] = received_config

        def review_repo(self, repo, files):
            return "summary", []

    monkeypatch.setattr(cli, "load_config", lambda _: config)
    monkeypatch.setattr(cli, "clone_repo", lambda *_, **__: "repo")
    monkeypatch.setattr(cli, "collect_code_files", lambda *_, **__: [
        CodeFile("main.py", "x = 1", 1, "Python")
    ])
    monkeypatch.setattr(cli, "CodeReviewer", FakeReviewer)

    cli.cmd_review(args)
    return captured["config"]


def test_cli_key_and_model_overrides_replace_multi_value_pools(monkeypatch):
    config = Config(api_key="file-key", api_keys=["file-key"], model="file-model", models=["file-model"])

    result = _run_review(monkeypatch, config, _args(api_key="cli-key", model="cli-model"))

    assert result.api_keys == ["cli-key"]
    assert result.models == ["cli-model"]


def test_cli_accepts_multi_key_only_configuration(monkeypatch):
    config = Config(api_key="", api_keys=["key-1", "key-2"], models=["model"])

    result = _run_review(monkeypatch, config, _args())

    assert result.api_keys == ["key-1", "key-2"]
