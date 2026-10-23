# Coding Principles & Token Efficiency

## 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.
- **State assumptions explicitly**: If uncertain, ask rather than guess.
- **Present multiple interpretations**: Don't pick silently when ambiguity exists.
- **Push back when warranted**: If a simpler approach exists, say so.
- **Stop when confused**: Name what's unclear and ask for clarification.

## 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.
- **No features beyond what was asked.**
- **No abstractions for single-use code.**
- **No "flexibility" or "configurability" that wasn't requested.**
- **No error handling for impossible scenarios.**
- **If 200 lines could be 20 lines, write 20 lines.** Keep solutions lean, minimal, and direct.

## 3. graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
