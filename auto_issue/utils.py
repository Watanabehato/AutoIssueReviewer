"""共享工具函数"""

import os
import shutil

from .constants import GH_FALLBACK_PATH_WIN, NO_ISSUE_KEYWORDS


def get_executable(name: str) -> str:
    """获取可执行文件路径，优先用 shutil.which，Windows 兜底"""
    path = shutil.which(name)
    if path:
        return path
    if name == "gh" and os.path.isfile(GH_FALLBACK_PATH_WIN):
        return GH_FALLBACK_PATH_WIN
    return name


def has_no_issues(review_text: str) -> bool:
    """判断审查结果是否属于'无明显问题'"""
    text_lower = review_text.lower()
    return any(kw in text_lower for kw in NO_ISSUE_KEYWORDS)
