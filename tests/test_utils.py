"""测试共享工具函数"""

from unittest.mock import patch
from auto_issue.utils import get_executable, has_no_issues


class TestGetExecutable:
    """测试 get_executable 函数"""

    @patch("auto_issue.utils.shutil.which")
    def test_found_in_path(self, mock_which):
        """当可执行文件在 PATH 中时，返回完整路径"""
        mock_which.return_value = "/usr/bin/gh"
        result = get_executable("gh")
        assert result == "/usr/bin/gh"
        mock_which.assert_called_once_with("gh")

    @patch("auto_issue.utils.os.path.isfile")
    @patch("auto_issue.utils.shutil.which")
    def test_not_found_no_fallback(self, mock_which, mock_isfile):
        """当可执行文件不在 PATH 且无 Windows 兜底时，返回原名"""
        mock_which.return_value = None
        mock_isfile.return_value = False
        result = get_executable("gh")
        assert result == "gh"

    @patch("auto_issue.utils.os.path.isfile")
    @patch("auto_issue.utils.shutil.which")
    def test_not_found_windows_fallback(self, mock_which, mock_isfile):
        """当 gh 不在 PATH 但 Windows 兜底路径存在时，返回兜底路径"""
        mock_which.return_value = None
        mock_isfile.return_value = True
        result = get_executable("gh")
        assert result == r"C:\Program Files\GitHub CLI\gh.exe"


class TestHasNoIssues:
    """测试 has_no_issues 函数"""

    def test_positive_chinese(self):
        """中文关键词匹配"""
        assert has_no_issues("无明显问题") is True
        assert has_no_issues("经过审查，未发现明显问题。") is True

    def test_positive_english(self):
        """英文关键词匹配"""
        assert has_no_issues("No significant issues found") is True
        assert has_no_issues("No issues were found in this batch.") is True

    def test_negative_with_issues(self):
        """有问题时不匹配"""
        assert has_no_issues("Found 3 bugs in the code") is False
        assert has_no_issues("🔴 High: SQL injection vulnerability") is False

    def test_case_insensitive(self):
        """大小写不敏感"""
        assert has_no_issues("NO ISSUES FOUND") is True
        assert has_no_issues("No Significant Issues") is True
