#!/usr/bin/env python3
"""
Remove comments without changing TypeScript types:
- Python: tokenize (drops # comments only)
- TS/JS/CSS: remove full-line // lines, then /* */ blocks (non-greedy)
- index.html: <!-- -->
"""
from __future__ import annotations

import io
import re
import sys
import tokenize
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {"__pycache__", ".git", "venv", ".venv", "node_modules", "dist"}


def strip_python_comments(source: str) -> str:
    tokens: list[tokenize.TokenInfo] = []
    try:
        for tok in tokenize.generate_tokens(io.StringIO(source).readline):
            if tok.type == tokenize.COMMENT:
                continue
            tokens.append(tok)
    except tokenize.TokenError:
        return source
    try:
        return tokenize.untokenize(tokens)
    except Exception:
        return source


def strip_js_like_line_comments_only(source: str) -> str:
    """Removes only full-line // comments. Does not strip /* */ (unsafe with TS types/regex)."""
    lines = source.splitlines(keepends=True)
    out_lines = []
    for line in lines:
        if re.match(r"^\s*//", line):
            continue
        out_lines.append(line)
    return "".join(out_lines)


def strip_js_like_comments_css(source: str) -> str:
    """For CSS: line // (rare) + block /* */."""
    text = strip_js_like_line_comments_only(source)
    return re.sub(r"/\*[\s\S]*?\*/", "", text)


def strip_html_comments(source: str) -> str:
    return re.sub(r"<!--[\s\S]*?-->", "", source)


def main() -> None:
    changed = 0
    total = 0

    backend = ROOT / "backend"
    if backend.is_dir():
        for path in backend.rglob("*.py"):
            if any(p in SKIP_DIRS for p in path.parts):
                continue
            total += 1
            src = path.read_text(encoding="utf-8")
            out = strip_python_comments(src)
            if out != src:
                path.write_text(out, encoding="utf-8")
                changed += 1

    frontend = ROOT / "frontend"
    src_root = frontend / "src"
    if src_root.is_dir():
        for path in src_root.rglob("*"):
            if path.is_dir():
                continue
            if any(p in SKIP_DIRS for p in path.parts):
                continue
            suf = path.suffix.lower()
            if suf not in {".ts", ".tsx", ".js", ".jsx", ".mjs", ".css"}:
                continue
            total += 1
            src = path.read_text(encoding="utf-8")
            if suf == ".css":
                out = strip_js_like_comments_css(src)
            else:
                out = strip_js_like_line_comments_only(src)
            if out != src:
                path.write_text(out, encoding="utf-8")
                changed += 1

    for name in ("eslint.config.js", "vite.config.ts"):
        p = frontend / name
        if p.is_file():
            total += 1
            src = p.read_text(encoding="utf-8")
            out = strip_js_like_line_comments_only(src)
            if out != src:
                p.write_text(out, encoding="utf-8")
                changed += 1

    index_html = frontend / "index.html"
    if index_html.is_file():
        total += 1
        src = index_html.read_text(encoding="utf-8")
        out = strip_html_comments(src)
        if out != src:
            index_html.write_text(out, encoding="utf-8")
            changed += 1

    print(f"strip_comments_safe: updated {changed} of {total} files", file=sys.stderr)


if __name__ == "__main__":
    main()
