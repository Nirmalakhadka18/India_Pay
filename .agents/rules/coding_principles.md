---
trigger: always_on
description: Core coding principles: Think Before Coding, Simplicity First, and Token-Efficient Graph Navigation.
---

# Project Coding Principles & Token Efficiency

## 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

LLMs often pick an interpretation silently and run with it. This principle forces explicit reasoning:
- **State assumptions explicitly**: If uncertain, ask rather than guess.
- **Present multiple interpretations**: Don't pick silently when ambiguity exists.
- **Push back when warranted**: If a simpler approach exists, say so.
- **Stop when confused**: Name what's unclear and ask for clarification.

## 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

Combat the tendency toward overengineering:
- **No features beyond what was asked.**
- **No abstractions for single-use code.**
- **No "flexibility" or "configurability" that wasn't requested.**
- **No error handling for impossible scenarios.**
- **If 200 lines could be 20 lines, write 20 lines.** Keep solutions lean, minimal, and direct.

## 3. Knowledge Graph & Code Navigation (graphify)
To save up to 50% tokens and keep context clean across sessions:
- For codebase and architecture questions, when `graphify-out/graph.json` exists, first run `graphify query "<question>"`.
- Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts.
- If `graphify-out/wiki/index.md` exists, navigate it instead of dumping raw files.
- After modifying code files in any session, run `graphify update .` to keep the graph current (AST-only, no API cost).
