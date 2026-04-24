"""AI 代码审查模块：调用 OpenAI 兼容 API 对代码进行审查，支持多 key/多模型自动切换"""

import time
import itertools
from typing import Optional
from openai import OpenAI, APIError, RateLimitError, APIConnectionError

from .config import Config
from .fetcher import CodeFile


# ── Prompt 模板 ────────────────────────────────────────────────────────────────

SYSTEM_PROMPT_ZH = """你是一位资深软件工程师，正在对 GitHub 仓库进行全面代码审查。
请从以下维度进行分析：
1. **Bug 与逻辑错误**：潜在的运行时错误、边界条件、空指针等
2. **安全漏洞**：SQL 注入、XSS、硬编码密钥、不安全的依赖等
3. **代码质量**：可读性差、重复代码、过长函数、命名不规范等
4. **性能问题**：低效算法、N+1 查询、内存泄漏等
5. **最佳实践**：违反语言惯用法、缺少错误处理、缺少注释等

输出要求：
- 每个问题用 Markdown 格式说明，包含：文件路径、问题描述、严重程度（🔴高/🟡中/🟢低）、修复建议
- 如果某批文件没有发现问题，请回复"无明显问题"
- 不要输出与问题无关的内容"""

SYSTEM_PROMPT_EN = """You are a senior software engineer performing a comprehensive code review of a GitHub repository.
Analyze code from these dimensions:
1. **Bugs & Logic Errors**: Potential runtime errors, edge cases, null pointers, etc.
2. **Security Vulnerabilities**: SQL injection, XSS, hardcoded secrets, insecure dependencies, etc.
3. **Code Quality**: Poor readability, duplicated code, overly long functions, bad naming, etc.
4. **Performance Issues**: Inefficient algorithms, N+1 queries, memory leaks, etc.
5. **Best Practices**: Anti-patterns, missing error handling, missing comments, etc.

Output format:
- For each issue: file path, issue description, severity (🔴High/🟡Medium/🟢Low), fix suggestion
- If no issues found in a batch, reply "No significant issues found"
- Do not include unrelated content"""

BATCH_USER_PROMPT_ZH = """请审查以下 {count} 个代码文件：

{files_content}

---
请输出发现的所有问题。"""

BATCH_USER_PROMPT_EN = """Please review the following {count} code files:

{files_content}

---
Please output all issues found."""

SUMMARY_PROMPT_ZH = """以下是对仓库 `{repo}` 所有代码文件的分批审查结果：

{reviews}

---
请根据以上审查结果，生成一份结构化的总结报告，包括：
1. **整体评估**：仓库代码质量的总体印象（1-2 句话）
2. **问题统计**：高/中/低严重程度问题的数量汇总
3. **重点问题清单**：列出所有高严重程度（🔴）问题，以及中等严重程度（🟡）的代表性问题
4. **改进建议**：3-5 条最重要的改进方向

输出格式：直接输出 Markdown，供作为 GitHub Issue 正文使用。"""

SUMMARY_PROMPT_EN = """The following are the batch review results for all code files in repository `{repo}`:

{reviews}

---
Based on the review results above, generate a structured summary report including:
1. **Overall Assessment**: General impression of code quality (1-2 sentences)
2. **Issue Statistics**: Count of high/medium/low severity issues
3. **Key Issues**: All high severity (🔴) issues and representative medium severity (🟡) issues
4. **Recommendations**: 3-5 most important improvement directions

Output format: Pure Markdown, suitable for use as a GitHub Issue body."""


# ── 核心审查类 ──────────────────────────────────────────────────────────────────

class CodeReviewer:
    def __init__(self, config: Config):
        self.config = config
        self.lang = config.review_language

        # 构建 (api_key, model) 组合列表
        keys = config.api_keys if config.api_keys else [config.api_key]
        models = config.models if config.models else [config.model]

        # 去重并保持顺序
        seen = set()
        self._model_pool = []
        for k, m in itertools.product(keys, models):
            if (k, m) not in seen:
                seen.add((k, m))
                self._model_pool.append((k, m))

        if len(self._model_pool) == 1:
            (k, m) = self._model_pool[0]
            self.client = OpenAI(api_key=k, base_url=config.api_base_url)
            self._model_iter = None
        else:
            self._model_iter = itertools.cycle(self._model_pool)
            # 取第一个
            k, m = next(self._model_iter)
            self.client = OpenAI(api_key=k, base_url=config.api_base_url)

        self._current_key = keys[0] if keys else ""
        self._current_model = models[0] if models else config.model
        self._total_models = len(self._model_pool)

    def _switch_model(self) -> None:
        """切换到下一个模型组合"""
        if self._model_iter:
            k, m = next(self._model_iter)
            self.client = OpenAI(api_key=k, base_url=self.config.api_base_url)
            self._current_key = k
            self._current_model = m

    def _chat(self, system: str, user: str, retries: int = 5) -> str:
        """调用 Chat API，带自动重试和多模型切换"""
        model_desc = f"{self._current_model}" if self._total_models == 1 else \
                     f"{self._current_model} ({self._current_key[:8]}...)"

        for model_retry in range(self._total_models):
            for attempt in range(retries):
                try:
                    response = self.client.chat.completions.create(
                        model=self._current_model,
                        messages=[
                            {"role": "system", "content": system},
                            {"role": "user", "content": user},
                        ],
                        max_tokens=self.config.max_tokens,
                        temperature=0.2,
                    )
                    return response.choices[0].message.content.strip()
                except RateLimitError:
                    wait = 2 ** attempt * 10
                    print(f"  [限流] {model_desc} 等待 {wait}s 后重试...")
                    time.sleep(wait)
                except APIConnectionError as e:
                    if attempt < retries - 1:
                        print(f"  [连接错误] {model_desc} {e}，5s 后重试...")
                        time.sleep(5)
                    else:
                        print(f"  [连接错误] {model_desc} 重试耗尽，尝试切换模型...")
                        break
                except APIError as e:
                    # 从错误响应中提取 retry_after 秒数
                    retry_after = getattr(e, "response", None) and getattr(e.response, "headers", None) and \
                                  e.response.headers.get("retry-after")
                    if retry_after:
                        wait = int(retry_after)
                    else:
                        wait = 2 ** attempt * 30   # 指数退避

                    # 判断是否为不可重试的错误（如 401/403/404）
                    status = getattr(e, "status_code", None)
                    no_retry = status in (401, 403, 404)

                    if no_retry or attempt >= retries - 1:
                        # 提取错误信息
                        body = getattr(e, "body", None)
                        if isinstance(body, dict):
                            err_msg = body.get("detail") or body.get("message") or str(body)
                        elif isinstance(body, str):
                            err_msg = body
                        else:
                            err_msg = str(body) if body else str(e)

                        if no_retry:
                            print(f"  [API 错误 {status}] {model_desc} {err_msg[:80]}，尝试切换模型...")
                        else:
                            print(f"  [API 错误 {status}] {model_desc} {err_msg[:80]}，重试耗尽，尝试切换模型...")
                        break
                    else:
                        body = getattr(e, "body", None)
                        if isinstance(body, dict):
                            err_msg = body.get("detail") or body.get("message") or str(body)
                        elif isinstance(body, str):
                            err_msg = body
                        else:
                            err_msg = str(body) if body else str(e)
                        print(f"  [API 错误 {status}] {model_desc} {err_msg[:100]}，{wait}s 后重试...")
                        time.sleep(wait)
            else:
                # 内层 for 循环完整执行（break 跳出时 else 不执行）
                continue
            # break 跳到这里，切换模型继续
            if model_retry < self._total_models - 1:
                self._switch_model()
                model_desc = f"{self._current_model} ({self._current_key[:8]}...)"
                print(f"  [切换模型] -> {model_desc}")
                continue
            break

        raise RuntimeError(f"所有 {self._total_models} 个模型组合均失败")

    def _format_files_for_prompt(self, files: list[CodeFile]) -> str:
        """将文件列表格式化为 Prompt 中的代码块"""
        parts = []
        for f in files:
            parts.append(
                f"### 文件：`{f.path}` ({f.language})\n"
                f"```{f.language.lower()}\n{f.content}\n```"
            )
        return "\n\n".join(parts)

    def review_batch(
        self,
        files: list[CodeFile],
        batch_index: int,
        total_batches: int,
    ) -> str:
        """审查一批文件，返回审查结果文本"""
        print(f"  [AI 审查] 第 {batch_index}/{total_batches} 批，共 {len(files)} 个文件...")

        system = SYSTEM_PROMPT_ZH if self.lang == "zh" else SYSTEM_PROMPT_EN
        files_content = self._format_files_for_prompt(files)

        if self.lang == "zh":
            user = BATCH_USER_PROMPT_ZH.format(
                count=len(files),
                files_content=files_content,
            )
        else:
            user = BATCH_USER_PROMPT_EN.format(
                count=len(files),
                files_content=files_content,
            )

        result = self._chat(system, user)
        return result

    def generate_summary(
        self,
        repo: str,
        batch_reviews: list[str],
    ) -> str:
        """根据所有批次的审查结果生成最终汇总报告"""
        print("  [AI 汇总] 正在生成综合审查报告...")

        # 过滤掉"无问题"的批次，减少 token 消耗
        meaningful_reviews = [
            r for r in batch_reviews
            if "无明显问题" not in r and "no significant issues" not in r.lower()
        ]

        if not meaningful_reviews:
            if self.lang == "zh":
                return f"## 代码审查结果\n\n经过全面审查，仓库 `{repo}` 的代码**未发现明显问题**。代码质量良好。"
            else:
                return f"## Code Review Results\n\nAfter comprehensive review, **no significant issues** were found in `{repo}`. Code quality is good."

        all_reviews = "\n\n---\n\n".join(
            f"**第 {i+1} 批审查结果：**\n{r}"
            for i, r in enumerate(meaningful_reviews)
        )

        if self.lang == "zh":
            user = SUMMARY_PROMPT_ZH.format(repo=repo, reviews=all_reviews)
            system = "你是一位资深代码审查专家，请根据提供的审查结果生成简洁、结构化的汇总报告。"
        else:
            user = SUMMARY_PROMPT_EN.format(repo=repo, reviews=all_reviews)
            system = "You are a senior code review expert. Generate a concise, structured summary report based on the provided review results."

        return self._chat(system, user)

    def review_repo(
        self,
        repo: str,
        files: list[CodeFile],
    ) -> tuple[str, list[str]]:
        """
        对整个仓库进行审查。
        返回 (最终汇总报告, 各批次原始结果列表)
        """
        from .fetcher import batch_files

        batches = list(batch_files(files, self.config.max_files_per_batch))
        total = len(batches)

        if total == 0:
            return "未找到可审查的代码文件。", []

        # 显示使用的模型信息
        if self._total_models > 1:
            model_list = " / ".join(f"{m}" for (k, m) in self._model_pool)
            print(f"  [模型] {model_list}（自动切换）")

        batch_reviews = []
        for i, batch in enumerate(batches, 1):
            review = self.review_batch(batch, i, total)
            batch_reviews.append(review)
            # 批次之间添加冷却间隔，防止 API 限流
            if i < total and self.config.batch_delay_seconds > 0:
                print(f"  [冷却] 等待 {self.config.batch_delay_seconds}s 后继续下一批...")
                time.sleep(self.config.batch_delay_seconds)

        summary = self.generate_summary(repo, batch_reviews)
        return summary, batch_reviews
