<#
.SYNOPSIS
  Configures Token-Efficiency Guidelines ("Think Before Coding" & "Simplicity First")
  and installs Graphify into any Git repository / project for AI coding agents.

.DESCRIPTION
  Runs Graphify integration for:
  - Google Antigravity (.agents/rules, .agents/workflows, skills)
  - Gemini CLI (GEMINI.md, hooks)
  - Cursor (.cursorrules, .cursor/rules/)
  - Claude Code (CLAUDE.md, hooks)
  - Universal AGENTS.md (for Codex, OpenCode, Aider, Trae, Devin, etc.)
  - Installs Git hooks (post-commit, post-checkout, post-merge)
  - Generates initial code knowledge graph (AST-only, 0 API tokens)

.EXAMPLE
  .\scripts\setup-agent-rules-and-graphify.ps1
  .\scripts\setup-agent-rules-and-graphify.ps1 -TargetDir "C:\path\to\another\repo"
#>

param(
    [string]$TargetDir = (Get-Location).Path
)

$ErrorActionPreference = "Stop"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Setting up Coding Principles & Graphify in: $TargetDir" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$graphifyCmd = "$env:USERPROFILE\.local\bin\graphify.exe"
if (-not (Test-Path $graphifyCmd)) {
    Write-Warning "graphify.exe not found at $graphifyCmd. Please install it or ensure it is in PATH."
    exit 1
}

Push-Location $TargetDir
try {
    # 1. Run Graphify project installs for all agent platforms
    Write-Host "`n[1/5] Installing Graphify integrations for agents..." -ForegroundColor Yellow
    & $graphifyCmd install --project --platform antigravity
    & $graphifyCmd install --project --platform gemini
    & $graphifyCmd install --project --platform cursor
    & $graphifyCmd install --project --platform agents

    # 2. Install Git hooks if this is a Git repo
    if (Test-Path ".git") {
        Write-Host "`n[2/5] Installing Graphify Git hooks..." -ForegroundColor Yellow
        & $graphifyCmd hook install
    }

    # 3. Create .graphifyignore if missing
    if (-not (Test-Path ".graphifyignore")) {
        Write-Host "`n[3/5] Writing .graphifyignore..." -ForegroundColor Yellow
        @'
node_modules/
**/node_modules/**
.next/
**/.next/**
.turbo/
**/.turbo/**
dist/
build/
*.zip
*.exe
*.png
*.jpg
*.jpeg
*.pdf
*.log
'@ | Out-File -FilePath ".graphifyignore" -Encoding utf8
    }

    # 4. Ensure AGENTS.md with Core Principles
    Write-Host "`n[4/5] Writing AGENTS.md & Antigravity/Cursor rules..." -ForegroundColor Yellow
    $principlesContent = @'
# Agent Guidelines: Token Efficiency & Core Coding Principles

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
'@
    Set-Content -Path "AGENTS.md" -Value $principlesContent -Encoding utf8

    # Also ensure .agents/rules/coding_principles.md
    New-Item -ItemType Directory -Force -Path ".agents\rules" | Out-Null
    @"
---
trigger: always_on
description: Core coding principles: Think Before Coding, Simplicity First, and Token-Efficient Graph Navigation.
---

$principlesContent
"@ | Set-Content -Path ".agents\rules\coding_principles.md" -Encoding utf8

    # 5. Extract initial code knowledge graph (AST-only, 0 token cost)
    Write-Host "`n[5/5] Extracting local AST code graph (0 LLM tokens)..." -ForegroundColor Yellow
    & $graphifyCmd extract $TargetDir --code-only

    Write-Host "`nSuccessfully installed agent guidelines & graphify into: $TargetDir" -ForegroundColor Green
}
finally {
    Pop-Location
}
