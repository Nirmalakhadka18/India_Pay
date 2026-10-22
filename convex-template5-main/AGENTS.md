# Agent Guidelines: Token Efficiency & Core Coding Principles

These instructions apply to all coding agents working on this project (Antigravity, Gemini CLI, Claude Code, Cursor, Codex, OpenCode, Aider, Trae, Devin, etc.).

## 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

LLMs often pick an interpretation silently and run with it. This principle forces explicit reasoning:
- **State assumptions explicitly** — If uncertain, ask rather than guess.
- **Present multiple interpretations** — Don't pick silently when ambiguity exists.
- **Push back when warranted** — If a simpler approach exists, say so.
- **Stop when confused** — Name what's unclear and ask for clarification.

## 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

Combat the tendency toward overengineering:
- **No features beyond what was asked.**
- **No abstractions for single-use code.**
- **No "flexibility" or "configurability" that wasn't requested.**
- **No error handling for impossible scenarios.**
- **If 200 lines could be 20 lines, write 20 lines.** Keep solutions lean, minimal, and direct.

## 3. Knowledge Graph & Code Navigation (graphify)
This repository uses `graphify` to index symbols, relationships, and architecture into `graphify-out/`. Using graphify saves ~50% tokens and preserves account quota by eliminating blind raw-file dumping:
- Before running extensive grep searches or reading full files for codebase questions, check if `graphify-out/graph.json` exists.
- Run `graphify query "<question>"` to get a focused subgraph.
- Use `graphify explain "<symbol/node>"` for node details and `graphify path "<A>" "<B>"` for connection paths.
- After making code changes, run `graphify update .` to keep the graph synchronized (local AST, zero API token cost).
