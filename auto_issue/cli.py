"""AutoIssue CLI 主入口"""

import sys
import os
import tempfile
import shutil
import argparse
from pathlib import Path

from .config import Config, load_config, generate_sample_config
from .fetcher import clone_repo, collect_code_files
from .reviewer import CodeReviewer
from .issue_creator import check_gh_auth, submit_review_as_issue, _get_gh_executable


# ── ANSI 颜色（Windows 兼容） ───────────────────────────────────────────────────
def _supports_color():
    return sys.stdout.isatty() and os.environ.get("NO_COLOR") is None


RESET = "\033[0m" if _supports_color() else ""
BOLD  = "\033[1m"  if _supports_color() else ""
GREEN = "\033[32m" if _supports_color() else ""
CYAN  = "\033[36m" if _supports_color() else ""
YELLOW= "\033[33m" if _supports_color() else ""
RED   = "\033[31m" if _supports_color() else ""

# Windows 终端安全输出（避免 GBK 编码问题）
def _safe_print(*args, **kwargs):
    try:
        print(*args, **kwargs)
    except UnicodeEncodeError:
        # 将无法编码的字符替换为 ?
        text = " ".join(str(a) for a in args)
        safe = text.encode(sys.stdout.encoding or "utf-8", errors="replace").decode(
            sys.stdout.encoding or "utf-8", errors="replace"
        )
        print(safe, **{k: v for k, v in kwargs.items() if k != "end"})


def _banner():
    print(f"""
{CYAN}{BOLD}===========================================
   AutoIssue --- AI Code Review Tool v1.0
==========================================={RESET}
""")


def _step(n: int, total: int, msg: str):
    print(f"\n{BOLD}[{n}/{total}] {msg}{RESET}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="autoissue",
        description="AutoIssue：自动获取 GitHub 仓库代码，用 AI 审查后提交 Issue",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法：
  # 审查公开仓库
  autoissue review owner/repo

  # 指定分支
  autoissue review owner/repo --branch develop

  # 使用自定义配置文件
  autoissue review owner/repo --config my-config.json

  # 只预览，不实际提交 Issue
  autoissue review owner/repo --dry-run

  # 生成示例配置文件
  autoissue init

  # 检查环境是否就绪
  autoissue check
""",
    )
    subparsers = parser.add_subparsers(dest="command", metavar="<command>")

    # ── review 子命令 ──────────────────────────────────────────────────────────
    review_p = subparsers.add_parser(
        "review",
        help="审查指定 GitHub 仓库并提交 Issue",
        description="克隆 GitHub 仓库，用 AI 审查所有代码，汇总后提交为一个 Issue。",
    )
    review_p.add_argument(
        "repo",
        nargs="?",
        default=None,
        help="GitHub 仓库，格式：owner/repo（例：torvalds/linux），不填则交互式输入",
    )
    review_p.add_argument(
        "--branch", "-b",
        default=None,
        help="指定分支（默认：仓库默认分支）",
    )
    review_p.add_argument(
        "--config", "-c",
        default=None,
        help=f"配置文件路径（默认自动搜索 .autoissue.json）",
    )
    review_p.add_argument(
        "--dry-run", "-n",
        action="store_true",
        help="只预览生成的 Issue 内容，不实际提交",
    )
    review_p.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="输出详细日志（包括跳过的文件）",
    )
    review_p.add_argument(
        "--output", "-o",
        default=None,
        help="将审查报告保存到指定文件（.md 格式）",
    )
    review_p.add_argument(
        "--no-issue",
        action="store_true",
        help="不提交 Issue，仅生成报告（配合 --output 使用）",
    )
    # 允许命令行覆盖常用配置项
    review_p.add_argument("--api-key",    default=None, help="AI API Key（覆盖配置文件）")
    review_p.add_argument("--api-base",   default=None, help="AI API Base URL（覆盖配置文件）")
    review_p.add_argument("--model",      default=None, help="使用的模型名（覆盖配置文件）")
    review_p.add_argument("--lang",       default=None, choices=["zh", "en"],
                          help="审查结果语言（zh=中文，en=英文）")

    # ── init 子命令 ────────────────────────────────────────────────────────────
    init_p = subparsers.add_parser(
        "init",
        help="在当前目录生成示例配置文件 .autoissue.json",
    )
    init_p.add_argument(
        "--force", "-f",
        action="store_true",
        help="强制覆盖已存在的配置文件",
    )

    # ── check 子命令 ───────────────────────────────────────────────────────────
    subparsers.add_parser(
        "check",
        help="检查运行环境（gh auth、Python 依赖等）",
    )

    return parser


# ── 子命令处理函数 ──────────────────────────────────────────────────────────────

def cmd_init(args: argparse.Namespace):
    """生成示例配置文件"""
    target = Path.cwd() / ".autoissue.json"
    if target.exists() and not args.force:
        print(f"{YELLOW}配置文件已存在：{target}{RESET}")
        print("使用 --force 强制覆盖。")
        return
    target.write_text(generate_sample_config(), encoding="utf-8")
    print(f"{GREEN}[OK] 已生成配置文件：{target}{RESET}")
    print("\n请编辑该文件，填入你的 API Key 和 Base URL，然后运行：")
    print(f"  autoissue review owner/repo\n")


def cmd_check(args: argparse.Namespace):
    """检查运行环境"""
    print("检查运行环境...\n")
    all_ok = True

    OK   = f"{GREEN}[OK]{RESET} "
    FAIL = f"{RED}[FAIL]{RESET} "
    WARN = f"{YELLOW}[WARN]{RESET} "

    # Python 版本
    v = sys.version_info
    ok = v >= (3, 10)
    print(f"  {OK if ok else FAIL}Python {v.major}.{v.minor}.{v.micro} {'(>= 3.10)' if ok else '(需要 >= 3.10)'}")
    all_ok = all_ok and ok

    # openai 包
    try:
        import openai
        print(f"  {OK}openai 包已安装 (v{openai.__version__})")
    except ImportError:
        print(f"  {FAIL}openai 包未安装，请运行：pip install openai")
        all_ok = False

    # gh CLI
    import subprocess
    result = subprocess.run([_get_gh_executable(), "--version"], capture_output=True, text=True)
    if result.returncode == 0:
        ver_line = result.stdout.splitlines()[0] if result.stdout else "unknown"
        print(f"  {OK}gh CLI 已安装 ({ver_line.strip()})")
    else:
        print(f"  {FAIL}gh CLI 未找到，请安装 GitHub CLI")
        all_ok = False

    # gh auth
    if check_gh_auth():
        print(f"  {OK}gh 已登录 (gh auth status OK)")
    else:
        print(f"  {WARN}gh 未登录，请运行：gh auth login")

    # 配置文件（当前目录 → HOME 目录）
    cfg_local = Path.cwd() / ".autoissue.json"
    cfg_home  = Path.home() / ".autoissue.json"
    if cfg_local.exists():
        print(f"  {OK}配置文件（当前目录）：{cfg_local}")
    elif cfg_home.exists():
        print(f"  {OK}配置文件（HOME 目录）：{cfg_home}")
    else:
        print(f"  {WARN}未找到 .autoissue.json，请运行 autoissue init 或设置环境变量")

    print()
    if all_ok:
        print(f"{GREEN}环境检查通过，可以开始使用！{RESET}")
    else:
        print(f"{RED}请解决上述问题后再运行。{RESET}")


def cmd_review(args: argparse.Namespace):
    """执行代码审查主流程"""
    _banner()

    # 0. 交互式收集仓库信息
    repo = args.repo
    if not repo:
        print("=" * 50)
        repo = input("请输入要审查的 GitHub 仓库 (owner/repo)：").strip()
        if not repo:
            print("仓库地址不能为空，退出。")
            sys.exit(1)

    branch = args.branch
    if not branch:
        branch_input = input("请输入要审查的分支（直接回车使用默认分支）：").strip()
        branch = branch_input if branch_input else None

    print("=" * 50 + "\n")

    # 1. 加载配置
    cfg: Config = load_config(args.config)

    # 命令行参数覆盖
    if args.api_key:   cfg.api_key       = args.api_key
    if args.api_base:  cfg.api_base_url  = args.api_base
    if args.model:     cfg.model         = args.model
    if args.lang:      cfg.review_language = args.lang

    # 校验必要配置
    if not cfg.api_key:
        print(f"{RED}❌ 未设置 API Key！{RESET}")
        print("请在 .autoissue.json 中设置 api_key，或设置环境变量 OPENAI_API_KEY。")
        sys.exit(1)

    print(f"  API Base URL : {cfg.api_base_url}")
    print(f"  模型         : {cfg.model}")
    print(f"  审查语言     : {'中文' if cfg.review_language == 'zh' else 'English'}")
    print(f"  Dry Run      : {'是' if args.dry_run else '否'}")

    # 2. 克隆仓库
    _step(2, 4, f"获取仓库代码：{repo}")
    tmp_dir = tempfile.mkdtemp(prefix="autoissue_")
    repo_dir = os.path.join(tmp_dir, "repo")
    try:
        clone_repo(repo, repo_dir, branch=branch)
        files = collect_code_files(repo_dir, cfg, verbose=args.verbose)

        if not files:
            print(f"{YELLOW}[WARN] 未找到可审查的代码文件，退出。{RESET}")
            return

        # 3. AI 审查
        _step(3, 4, f"AI 代码审查（共 {len(files)} 个文件，分 {-(-len(files)//cfg.max_files_per_batch)} 批）")
        reviewer = CodeReviewer(cfg)
        summary, batch_reviews = reviewer.review_repo(repo, files)

        # 4. 提交 / 保存
        _step(4, 4, "提交审查结果")

        # 保存到文件
        if args.output:
            out_path = Path(args.output)
            from .issue_creator import build_issue_body
            full_report = build_issue_body(
                repo=args.repo,
                summary=summary,
                batch_reviews=batch_reviews,
                file_count=len(files),
                config=cfg,
            )
            out_path.write_text(full_report, encoding="utf-8")
            print(f"  {GREEN}[OK] 报告已保存：{out_path}{RESET}")

        # 提交 Issue
        if not args.no_issue:
            url = submit_review_as_issue(
                repo=repo,
                summary=summary,
                batch_reviews=batch_reviews,
                file_count=len(files),
                config=cfg,
                dry_run=args.dry_run,
            )
            if url:
                print(f"\n{GREEN}{BOLD}[完成] Issue 地址：{url}{RESET}")
        else:
            print(f"  [--no-issue] 已跳过 Issue 提交。")

    finally:
        # 清理临时目录
        shutil.rmtree(tmp_dir, ignore_errors=True)


# ── 主入口 ──────────────────────────────────────────────────────────────────────

def main():
    # Windows 终端颜色支持
    if sys.platform == "win32":
        os.system("")  # 启用 ANSI 转义序列

    parser = build_parser()
    args = parser.parse_args()

    if args.command == "review":
        cmd_review(args)
    elif args.command == "init":
        cmd_init(args)
    elif args.command == "check":
        cmd_check(args)
    else:
        parser.print_help()
        sys.exit(0)


if __name__ == "__main__":
    main()
