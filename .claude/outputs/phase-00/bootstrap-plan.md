# Project Bootstrap Plan — MedSafe

> Role: Senior Engineering Lead
> Scope: Everything from zero to a properly configured repository, ready for P0-T0
> Environment: Windows, PowerShell, VS Code, Git Bash
> Output: A committed GitHub repository with correct structure, tooling, and engineering memory
>
> This plan does not write application code.
> When this plan is complete, P0-T0 (writing the Prisma schema) begins immediately.

---

## CURRENT STATE vs TARGET STATE

**Current state:**
- Planning documents exist in a local folder (not a git repository)
- No GitHub repo exists
- No configured tooling
- No `prisma/` directory
- `frontend/` and `backend/` contain only `.gitkeep`

**Target state after this plan:**
- GitHub repository exists and is cloned locally
- Complete folder structure created
- All config files in place (`.gitignore`, `.gitattributes`, `.nvmrc`, VS Code workspace)
- All `.claude/` engineering memory committed to the repo
- `README.md` exists (minimal but correct)
- `prisma/` directory exists and ready to receive the schema (P0-T0)
- Vercel connected to GitHub (auto-deploy pipeline ready)
- First commit pushed

**Time estimate:** 2-3 hours

---

## SECTION 1: PREREQUISITES

Before executing this plan, confirm these tools are installed and configured on the machine.

### Required Tools

| Tool | Minimum Version | Check Command | Install |
|------|----------------|---------------|---------|
| Git | 2.40+ | `git --version` | git-scm.com |
| Node.js | 20 LTS | `node --version` | nodejs.org or nvm-windows |
| npm | 10+ | `npm --version` | bundled with Node |
| VS Code | Latest | `code --version` | code.visualstudio.com |
| GitHub account | — | github.com | — |
| Vercel account | — | vercel.com | — |

### Windows-Specific Configuration

Run these in PowerShell or Git Bash before anything else. These are global settings that affect all repositories on the machine.

**Line ending configuration (critical for cross-platform projects):**
```
git config --global core.autocrlf false
```
This tells Git to NOT automatically convert line endings. The `.gitattributes` file in this project handles line endings explicitly. Without this setting, Windows Git may silently modify files on checkout, causing CI failures.

**Default branch name:**
```
git config --global init.defaultBranch main
```

**User identity (if not already set):**
```
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Verify Git Bash in VS Code
VS Code's integrated terminal should use Git Bash, not PowerShell, for this project. Git Bash provides Unix-like commands that match the documentation and avoid Windows path separator issues with npm scripts.

After VS Code is installed, this is set in the workspace settings file (Section 4 below) — no manual action needed now.

---

## SECTION 2: REPOSITORY STRUCTURE

### GitHub Repository Settings

| Setting | Value | Reason |
|---------|-------|--------|
| Name | `medsafe` | Matches working project name |
| Visibility | **Public** | Required for Vercel free tier auto-deploy; portfolio visibility |
| Initialize with README | **No** | Create README locally and push — don't create a merge conflict on first clone |
| .gitignore template | **None** | Using a custom `.gitignore` (Section 3) |
| License | **MIT** | Standard open source for portfolio projects |

Add the MIT license after the initial commit, not during repository creation. This avoids a diverged history on the first clone.

### Branch Strategy

Simple strategy appropriate for a solo student project:

| Branch | Purpose | Rules |
|--------|---------|-------|
| `main` | Production-ready code | Always deployable; Vercel deploys from this branch |
| `dev` | Integration branch | Features merged here first; merge to main when stable |
| `feat/phase-1-foundation` | Feature work | Format: `feat/phase-N-description` |
| `fix/description` | Bug fixes | Format: `fix/short-description` |

**Note:** For the first several phases (0, 1, 2), working directly on `main` is acceptable given the solo context. Switch to the `dev`/feature branch workflow before Phase 3 (interaction engine) when the complexity increases.

---

## SECTION 3: COMPLETE FOLDER STRUCTURE

This is the final repository layout. Every directory and file is listed with its purpose.

```
medsafe/                          ← Repository root
│
├── .claude/                      ← Engineering memory system (committed)
│   ├── agents/
│   │   ├── planner.md            ← Planning agent prompt
│   │   ├── implementer.md        ← Implementation agent prompt
│   │   └── reviewer.md           ← Code review agent prompt
│   ├── memory/
│   │   ├── architecture.md       ← System design reference
│   │   ├── coding-rules.md       ← Standards and conventions
│   │   ├── defects.md            ← Mistake log (anti-hallucination)
│   │   ├── design-system.md      ← UI/UX decisions
│   │   ├── product-vision.md     ← Product goals and philosophy
│   │   ├── security.md           ← Security rules
│   │   ├── tech-stack.md         ← Locked technology decisions
│   │   └── testing.md            ← Testing strategy
│   ├── outputs/
│   │   ├── architecture-baseline.md      ← FINAL source of truth
│   │   ├── architecture-review.md        ← Review findings
│   │   ├── db-architecture-review.md     ← DB schema review
│   │   ├── master-roadmap.md             ← Phase strategy
│   │   ├── project-backlog.md            ← All tasks
│   │   ├── implementation-roadmap.md     ← Original roadmap
│   │   ├── phase-0-decision-register.md  ← Open decisions
│   │   ├── phase-0-lock-checklist.md     ← Phase 0 gate
│   │   ├── phase-0-research-plan.md      ← Research methodology
│   │   └── phase-00/
│   │       └── P0-T0-execution-plan.md   ← Current task plan
│   │   ├── phase-01/                     ← Phase 1 outputs (empty)
│   │   ├── phase-02/                     ← Phase 2 outputs (empty)
│   │   ├── phase-03/                     ← Phase 3 outputs (empty)
│   │   ├── phase-04/                     ← Phase 4 outputs (empty)
│   │   ├── phase-05/                     ← Phase 5 outputs (empty)
│   │   └── phase-06/                     ← Phase 6 outputs (empty)
│   └── workflows/
│       ├── implementation.md     ← Plan→build→review workflow
│       ├── prompts.md            ← Reusable session prompts
│       ├── session-end.md        ← End-of-session checklist
│       └── session-start.md      ← Start-of-session guide
│
├── .github/
│   ├── workflows/
│   │   └── .gitkeep              ← CI workflows added in P1-T7
│   └── pull_request_template.md  ← PR checklist
│
├── .vscode/
│   ├── extensions.json           ← Recommended extensions
│   ├── settings.json             ← Workspace settings
│   └── launch.json               ← Debug configurations
│
├── backend/                      ← FastAPI OCR service (Phase 5+)
│   └── .gitkeep                  ← Placeholder until Phase 5
│
├── frontend/                     ← Next.js 14 application (Phase 1+)
│   └── .gitkeep                  ← Placeholder until P1-T1
│
├── prisma/                       ← Database schema and SQL scripts
│   ├── .gitkeep                  ← Placeholder until P0-T0
│   └── README.md                 ← Explains what files go here and how to use them
│
├── .gitattributes                ← Line ending rules (critical for Windows)
├── .gitignore                    ← Files to exclude from version control
├── .nvmrc                        ← Node.js version pin (20)
├── CLAUDE.md                     ← AI session entry point
├── README.md                     ← Project overview (minimal initially)
└── _state.md                     ← Current project state (most important file)
```

### Directory Responsibilities Summary

| Directory | Owner | When Populated |
|-----------|-------|---------------|
| `.claude/` | Planning session | Now (all files already written) |
| `.github/` | DevOps | Phase 1 (CI) |
| `.vscode/` | Engineering setup | Now (bootstrap) |
| `backend/` | Phase 5 | FastAPI OCR service |
| `frontend/` | Phase 1 | Next.js app |
| `prisma/` | P0-T0 | Schema files |

---

## SECTION 4: INITIAL FILES TO CREATE

Every file that must exist before the first `git commit`.

### File 1: `.gitattributes`

**Purpose:** Enforces consistent line endings across Windows and Unix. Without this, Windows developers get CRLF line endings, Unix/Linux CI gets LF, and the diff history becomes noisy with invisible whitespace changes.

**Content specification:**
```
# Default: normalize all text files to LF on commit
* text=auto eol=lf

# Explicitly text files
*.md        text eol=lf
*.ts        text eol=lf
*.tsx       text eol=lf
*.js        text eol=lf
*.jsx       text eol=lf
*.json      text eol=lf
*.css       text eol=lf
*.html      text eol=lf
*.yml       text eol=lf
*.yaml      text eol=lf
*.env       text eol=lf
*.prisma    text eol=lf
*.sql       text eol=lf
*.py        text eol=lf
*.txt       text eol=lf
*.sh        text eol=lf

# Binary files — do not modify
*.png       binary
*.jpg       binary
*.jpeg      binary
*.ico       binary
*.gif       binary
*.pdf       binary
*.zip       binary
*.woff      binary
*.woff2     binary
*.ttf       binary
*.eot       binary
```

**Why this comes first:** If `.gitattributes` is committed after other files, Git may have already stored files with CRLF endings. Creating this file before any other files ensures the policy is in effect from the first commit.

---

### File 2: `.gitignore`

**Purpose:** Prevents committing build artifacts, secrets, and OS-specific files. This is a monorepo-level ignore covering all three project layers (Next.js, Python, and root-level tooling).

**Content specification — four sections:**

**Node.js / Next.js (frontend):**
```
node_modules/
.next/
out/
build/
dist/
.turbo/
*.tsbuildinfo
```

**Environment files (secrets — never commit):**
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local
```
Note: `.env.example` files ARE committed. They document what variables are needed without including actual values.

**Python / FastAPI (backend, Phase 5+):**
```
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
.venv/
venv/
env/
*.egg-info/
dist/
.eggs/
.pytest_cache/
.coverage
htmlcov/
```

**OS / Editor artifacts:**
```
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
Thumbs.db
Desktop.ini
*.swp
*.swo
*.bak
.idea/
*.suo
*.user
```

**Testing / Coverage:**
```
coverage/
.nyc_output/
```

**Logs:**
```
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

**What is NOT ignored (committed intentionally):**
- `.vscode/` — workspace settings help all developers (including returning sessions)
- `.claude/` — engineering memory is the most valuable thing in the repo
- `prisma/` — schema files are source code
- `.nvmrc` — version pinning

---

### File 3: `.nvmrc`

**Purpose:** Pins the Node.js version. Any developer (or CI runner) with nvm/nvm-windows installed runs `nvm use` in the root and gets the correct version automatically.

**Content:**
```
20
```

Single line, no trailing whitespace. Pins to Node.js 20 LTS.

**Windows note:** nvm-windows is the Windows equivalent of nvm (Unix). Install from: `github.com/coreybutler/nvm-windows`. After installing and running `nvm install 20` and `nvm use 20`, the correct Node.js version is active.

---

### File 4: `README.md`

**Purpose:** First thing anyone sees on GitHub. Initially minimal — it grows with the project.

**Content specification:**

```markdown
# MedSafe

> Free medicine expiry tracker and drug interaction checker for Indian households.

[![Status](https://img.shields.io/badge/status-in%20development-yellow)]()

## What It Does

MedSafe helps you track medicine expiry dates and warns you about dangerous drug
interactions between medicines in your cabinet — for free.

## Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI (OCR service, Phase 5+)
- **Database:** Supabase PostgreSQL + Prisma ORM
- **Auth:** Supabase Auth

## Status

Currently in Phase 0 (Planning & Data Validation).

See [_state.md](./_state.md) for current project status.

## Architecture

See [Architecture Baseline](./.claude/outputs/architecture-baseline.md)
for the complete technical design.

## Development

> Setup instructions will be added in Phase 1.

## License

MIT
```

**What to add later (Phase 1):** Live URL, screenshots, local setup instructions, environment variable documentation. Keep it minimal for now — an incomplete setup guide is worse than no setup guide.

---

### File 5: `prisma/README.md`

**Purpose:** Documents the three-file database setup process for anyone (including future Claude sessions) who needs to understand how to set up the database.

**Content specification:**

```markdown
# Database Setup — MedSafe

This directory contains three files that together define the complete database setup.

## Files

| File | Purpose | When to Run |
|------|---------|-------------|
| `schema.prisma` | Prisma schema — 8 models | Run `prisma migrate dev` from `frontend/` |
| `post-migration.sql` | CHECK constraints, partial indexes, performance indexes | Run in Supabase SQL editor after every migration |
| `rls-policies.sql` | Row Level Security policies | Run once in Supabase SQL editor after first migration |

## Setup Sequence

1. `npx prisma migrate dev --name init` (from `frontend/` directory)
2. Open Supabase SQL editor
3. Paste and run `post-migration.sql`
4. Paste and run `rls-policies.sql`

## Important

`post-migration.sql` contains constraints that Prisma cannot express in its
schema DSL. If this file is not run, the database will accept invalid data
silently. Always run it after any migration.

## Schema Overview

8 tables: users, family_members, medicines, medicine_ingredients,
interactions_cache, checked_pairs, notification_log, medicine_scan_log

See `.claude/outputs/architecture-baseline.md` (Part 2) for full schema documentation.
```

---

### File 6: `.github/pull_request_template.md`

**Purpose:** Reminds the developer to check their own work before merging. Solo project use: even when merging your own PRs, this checklist catches issues.

**Content specification:**

```markdown
## What

Brief description of what this PR does.

## Why

Why is this change needed?

## Testing

- [ ] Manual testing completed
- [ ] No console errors in browser
- [ ] Mobile layout checked (375px)
- [ ] API endpoints tested

## Checklist

- [ ] `_state.md` updated if a phase task was completed
- [ ] No `.env` files committed
- [ ] No `console.log` statements left in code
- [ ] TypeScript type errors: zero
- [ ] Lint errors: zero
- [ ] No TODOs introduced without corresponding issue or state.md entry

## Architecture

- [ ] No deviations from architecture-baseline.md without documentation
- [ ] No new packages added without justification in tech-stack.md
```

---

### File 7: `.vscode/extensions.json`

**Purpose:** When VS Code opens the workspace, it offers to install recommended extensions. This ensures consistent tooling without requiring manual setup.

**Content specification:**

```json
{
  "recommendations": [
    "prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "eamodio.gitlens",
    "usernamehako.errorlens",
    "humao.rest-client",
    "github.vscode-github-actions",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "christian-kohler.path-intellisense",
    "formulahendry.auto-rename-tag",
    "naumovs.color-highlight"
  ],
  "unwantedRecommendations": []
}
```

**Extension rationale:**

| Extension | Why |
|-----------|-----|
| `prisma.prisma` | Syntax highlighting and formatting for `schema.prisma` |
| `bradlc.vscode-tailwindcss` | Tailwind class autocomplete in JSX/TSX |
| `dbaeumer.vscode-eslint` | Inline ESLint errors |
| `esbenp.prettier-vscode` | Code formatting (format on save) |
| `eamodio.gitlens` | Git blame, history, and diff inline |
| `usernamehako.errorlens` | Shows TypeScript/lint errors inline, not just in Problems panel |
| `humao.rest-client` | Test API endpoints directly from `.http` files |
| `github.vscode-github-actions` | Validate CI workflow YAML |
| `ms-python.python` | Python language support (Phase 5 FastAPI) |
| `ms-python.vscode-pylance` | Python type checking |
| `christian-kohler.path-intellisense` | Autocomplete for file paths in imports |
| `formulahendry.auto-rename-tag` | Auto-rename closing JSX tag when opening tag changes |
| `naumovs.color-highlight` | Show hex color values as colored swatches |

---

### File 8: `.vscode/settings.json`

**Purpose:** Workspace-level settings that override user settings for this project. Committed so every session (and future collaborators) gets the same editor behavior.

**Content specification:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.rulers": [100],
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true,

  "[prisma]": {
    "editor.defaultFormatter": "Prisma.prisma"
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.tabSize": 4
  },
  "[markdown]": {
    "editor.formatOnSave": false,
    "editor.wordWrap": "on"
  },

  "terminal.integrated.defaultProfile.windows": "Git Bash",
  "terminal.integrated.profiles.windows": {
    "Git Bash": {
      "path": "C:\\Program Files\\Git\\bin\\bash.exe",
      "args": ["--login", "-i"]
    }
  },

  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],

  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.updateImportsOnFileMove.enabled": "always",

  "eslint.validate": [
    "javascript",
    "javascriptreact",
    "typescript",
    "typescriptreact"
  ],

  "explorer.fileNesting.enabled": true,
  "explorer.fileNesting.patterns": {
    "*.ts": "${capture}.js",
    "*.tsx": "${capture}.jsx",
    "package.json": "package-lock.json, .npmrc, .nvmrc",
    "tailwind.config.*": "tailwind.config*, postcss.config*",
    "next.config.*": "next-env.d.ts, next.config*"
  },

  "search.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

**Key settings explained:**

| Setting | Value | Reason |
|---------|-------|--------|
| `files.eol` | `"\n"` | Force LF line endings in VS Code even on Windows |
| `terminal.integrated.defaultProfile.windows` | `"Git Bash"` | Unix-like commands for npm scripts |
| `tailwindCSS.experimental.classRegex` | cva/cx patterns | Enables Tailwind IntelliSense inside shadcn/ui component variants |
| `explorer.fileNesting.patterns` | config files | Keeps root directory tidy by nesting related files |

---

### File 9: `.vscode/launch.json`

**Purpose:** Debug configurations for the Next.js frontend. Allows breakpoint debugging without console.log.

**Content specification:**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: Debug Server-Side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "cwd": "${workspaceFolder}/frontend"
    },
    {
      "name": "Next.js: Debug Client-Side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: Debug Full Stack",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev",
      "cwd": "${workspaceFolder}/frontend",
      "serverReadyAction": {
        "pattern": "started server on .+, url: (https?://.+)",
        "uriFormat": "%s",
        "action": "debugWithChrome"
      }
    }
  ]
}
```

---

## SECTION 5: GIT SETUP

### Commit Message Convention

Already defined in `coding-rules.md`. Summarized here for bootstrap reference:

```
<type>: <short description>

Types:
  feat     New feature or capability
  fix      Bug fix
  docs     Documentation only
  chore    Tooling, dependencies, config
  refactor Code change (no behavior change)
  test     Adding or updating tests
  style    Formatting only (no logic change)

Examples:
  feat: add medicine CRUD API routes
  fix: normalize expiry date to last-of-month
  docs: update architecture baseline with DB review findings
  chore: initialize Next.js project
  refactor: replace salts array with medicine_ingredients table
```

Keep messages short (< 72 characters for the subject). Add a body if the "why" isn't obvious.

### Git Hooks (Optional, Phase 1)

Skip hooks during bootstrap. Add in Phase 1 after the frontend project is initialized (hooks require a local `package.json`). When added, the only hook worth automating is pre-commit TypeScript type-checking:

```
pre-commit: cd frontend && npx tsc --noEmit
```

This can be set up with Lefthook (lightweight, works with monorepos). Add to `_state.md` as a Phase 1 task.

### Tags

Tag meaningful milestones:
- `v0.1.0-mvp` — when Phase 3 (interaction engine) is complete
- `v0.2.0-beta` — when Phase 4 (notifications) is complete
- `v1.0.0` — when Phase 6 (launch) is complete

---

## SECTION 6: .claude/ SETUP

The `.claude/` engineering memory system is the most valuable artifact in this repository. It must be committed intact, in the correct structure, with no files missing.

### What Goes In

All files already written in the planning sessions:

```
.claude/
├── agents/        (3 files — planner, implementer, reviewer)
├── memory/        (8 files — architecture through testing)
├── outputs/       (10 files + 7 phase subdirectories)
└── workflows/     (4 files — prompts, session start/end, implementation)
```

### What Does NOT Go In `.claude/`

- No application code
- No environment variables
- No secrets
- No binary files

### Why `.claude/` Is Committed

The `.claude/` folder is NOT in `.gitignore`. This is intentional. The engineering memory is version-controlled because:

1. **Continuity across machines:** If development moves to a different computer, the full context comes with the repo
2. **Session recovery:** After a gap of days or weeks, the memory files restore full project context in seconds
3. **History:** Git blame shows when architectural decisions were made and changed
4. **Safety:** If a planning document is accidentally deleted, `git checkout` restores it

The `.claude/` folder is documentation, not tooling. It belongs in version control.

### Session Start Protocol After Bootstrap

Every new Claude session targeting this repository must start with:

```
Read CLAUDE.md and _state.md.
Summarize current project state.
Identify current phase and next task from the task table.
Reference .claude/outputs/architecture-baseline.md for all technical decisions.
Do not write code until the plan is approved.
```

---

## SECTION 7: DOCUMENTATION SETUP

### README Evolution Plan

The README starts minimal and grows with the project. Never write documentation for features that don't exist yet.

| Phase | README additions |
|-------|-----------------|
| Bootstrap | Project name, description, stack, status badge, links |
| Phase 1 complete | Local development setup, environment variables, running the app |
| Phase 3 complete | Architecture diagram, feature list, live demo link |
| Phase 5 complete | OCR feature documentation, screenshots |
| Phase 6 complete | Full user guide, deployment guide, contributing guide |

### The Two Most Important Files

After the README, the two files any developer reads first are `CLAUDE.md` and `_state.md`. These are already written. They must be at the root of the repository (not inside a subdirectory).

### Prisma README

The `prisma/README.md` (Section 3, File 5) is critical because the three-step database setup (migrate, post-migration.sql, rls-policies.sql) is easy to get wrong. This README prevents the most common failure mode: running `prisma migrate dev` and believing the database is fully set up.

---

## SECTION 8: ORDER OF CREATION

Execute these steps exactly in order. Do not skip steps or reorder them.

### Phase A: Machine Setup (30 minutes)
Steps that only need to be done once per development machine.

```
A-1  Verify Git version: git --version (need 2.40+)
A-2  Set git core.autocrlf: git config --global core.autocrlf false
A-3  Set default branch: git config --global init.defaultBranch main
A-4  Confirm user.name and user.email are set
A-5  Verify Node.js 20: node --version
A-6  If needed: install nvm-windows, then: nvm install 20 && nvm use 20
A-7  Verify VS Code is installed: code --version
```

---

### Phase B: GitHub Repository (10 minutes)

```
B-1  Go to github.com/new
B-2  Repository name: medsafe
B-3  Visibility: Public
B-4  "Initialize repository": UNCHECKED (do not auto-create README)
B-5  "Add .gitignore": None
B-6  "Choose a license": None
B-7  Click "Create repository"
B-8  Copy the HTTPS clone URL: https://github.com/[username]/medsafe.git
```

---

### Phase C: Local Repository (20 minutes)

```
C-1  Open Git Bash (not PowerShell)
C-2  Navigate to your projects folder: cd ~/Documents/Projects (or wherever you prefer)
C-3  Clone the empty repo: git clone https://github.com/[username]/medsafe.git
C-4  Enter the directory: cd medsafe
C-5  Verify you're on main: git branch (should show * main)
```

---

### Phase D: Root Configuration Files (30 minutes)

Create files in this order. The `.gitattributes` must come first.

```
D-1  Create .gitattributes (content from Section 4, File 1)
D-2  Create .gitignore (content from Section 4, File 2)
D-3  Create .nvmrc with content: 20
D-4  Create README.md (content from Section 4, File 4)
```

Verify D-1 through D-4 exist before continuing.

---

### Phase E: Directory Structure (10 minutes)

```
E-1  Create directories (Git Bash):
     mkdir -p .github/workflows
     mkdir -p .vscode
     mkdir -p prisma
     mkdir -p frontend
     mkdir -p backend
     mkdir -p .claude/agents
     mkdir -p .claude/memory
     mkdir -p .claude/outputs/phase-00
     mkdir -p .claude/outputs/phase-01
     mkdir -p .claude/outputs/phase-02
     mkdir -p .claude/outputs/phase-03
     mkdir -p .claude/outputs/phase-04
     mkdir -p .claude/outputs/phase-05
     mkdir -p .claude/outputs/phase-06
     mkdir -p .claude/workflows

E-2  Create placeholder files for empty directories (Git doesn't track empty directories):
     touch backend/.gitkeep
     touch .github/workflows/.gitkeep
     (frontend/.gitkeep and prisma/ — handle next)
```

---

### Phase F: Core Project Files (20 minutes)

```
F-1  Copy or recreate CLAUDE.md at repo root
     (copy from the planning session export, or paste the content)

F-2  Copy or recreate _state.md at repo root
     (copy from the planning session export)
```

**Important:** If copying from the planning export (the zip file), copy the files exactly — do not re-type them. Every decision, task ID, and session log entry matters.

---

### Phase G: .claude/ Memory System (20 minutes)

Copy all planning documents into the `.claude/` directory. These are the files from the planning sessions.

```
G-1  Copy .claude/agents/ files:
       planner.md, implementer.md, reviewer.md

G-2  Copy .claude/memory/ files:
       architecture.md, coding-rules.md, defects.md, design-system.md,
       product-vision.md, security.md, tech-stack.md, testing.md

G-3  Copy .claude/outputs/ files:
       architecture-baseline.md
       architecture-review.md
       db-architecture-review.md
       master-roadmap.md
       project-backlog.md
       implementation-roadmap.md
       phase-0-decision-register.md
       phase-0-lock-checklist.md
       phase-0-research-plan.md

G-4  Copy .claude/outputs/phase-00/ files:
       P0-T0-execution-plan.md

G-5  Copy .claude/workflows/ files:
       implementation.md, prompts.md, session-end.md, session-start.md

G-6  Verify: count files in .claude/:
     find .claude -type f | wc -l
     Expected: 28 files
```

---

### Phase H: Supporting Files (20 minutes)

```
H-1  Create prisma/README.md (content from Section 4, File 5)

H-2  Create .github/pull_request_template.md (content from Section 4, File 6)

H-3  Create .vscode/extensions.json (content from Section 4, File 7)

H-4  Create .vscode/settings.json (content from Section 4, File 8)

H-5  Create .vscode/launch.json (content from Section 4, File 9)
```

---

### Phase I: Initial Commit (10 minutes)

```
I-1  Check what will be committed:
     git status
     Review the output. You should see ~35 files staged, all expected.
     You should NOT see: .env, node_modules, .next, __pycache__

I-2  Stage all files:
     git add .

I-3  Review the staged files:
     git diff --cached --stat
     Verify: only the files from this plan appear

I-4  Create the initial commit:
     git commit -m "chore: initialize project structure and engineering memory"

I-5  Push to GitHub:
     git push origin main

I-6  Verify on GitHub:
     Open github.com/[username]/medsafe
     Confirm all files are visible
     Confirm .gitignore is working (no node_modules, no .env)
```

---

### Phase J: Vercel Connection (15 minutes)

```
J-1  Go to vercel.com → New Project
J-2  Import Git Repository → select medsafe
J-3  Framework Preset: Next.js (Vercel auto-detects)
J-4  Root Directory: frontend
     IMPORTANT: Set this to 'frontend', not the root.
     Vercel needs to know the Next.js app is in a subdirectory.
J-5  Build and Output Settings: leave as default (Vercel handles Next.js automatically)
J-6  Environment Variables: add none yet
     (Environment variables are added in Phase 1 when Supabase is created)
J-7  Click Deploy
     The first deploy will FAIL because frontend/ is empty (only .gitkeep)
     This is expected. Vercel is now connected — future pushes will deploy.
J-8  Document the Vercel project URL in _state.md
```

---

### Phase K: Post-Bootstrap Verification (15 minutes)

Before declaring bootstrap complete, verify every item in this list.

```
Repository:
[ ] GitHub repo exists and is public
[ ] First commit visible on GitHub with all files
[ ] .gitignore is working (verify node_modules not committed)
[ ] .gitattributes committed

VS Code:
[ ] Open repo in VS Code: code medsafe
[ ] VS Code shows "Install Recommended Extensions?" popup → click Install
[ ] .vscode/settings.json active: verify Git Bash is the terminal (click terminal icon)
[ ] schema.prisma has syntax highlighting (Prisma extension working)

.claude/ system:
[ ] All 28 files present: find .claude -type f | wc -l
[ ] CLAUDE.md exists at root
[ ] _state.md exists at root
[ ] architecture-baseline.md exists in .claude/outputs/

Directories:
[ ] prisma/ exists (will contain schema files after P0-T0)
[ ] frontend/ exists (will contain Next.js after P1-T1)
[ ] backend/ exists (will contain FastAPI after Phase 5)

Vercel:
[ ] Vercel project created
[ ] Root directory set to 'frontend'
[ ] URL documented in _state.md

.gitattributes:
[ ] Verify line endings: git ls-files --eol | head -20
    All project files should show 'w/lf' (working copy LF) or 'i/lf' (index LF)
    Windows text files should NOT show 'w/crlf'
```

---

### Phase L: Update _state.md (5 minutes)

```
L-1  Add P0-T0c to the completed list in _state.md
     (P0-T0c was: "Create GitHub repo, commit folder structure + .claude/")

L-2  Add GitHub repo URL to the Recent Decisions section

L-3  Add Vercel project URL

L-4  Add session log entry:
     "Bootstrap complete: repository created, .claude/ committed,
      Vercel connected, VS Code configured. Ready for P0-T0."

L-5  Commit the updated _state.md:
     git add _state.md
     git commit -m "docs: update state after project bootstrap"
     git push origin main
```

---

## TOTAL FILE COUNT AT BOOTSTRAP COMPLETE

```
Root level:       5 files  (.gitattributes, .gitignore, .nvmrc, CLAUDE.md, README.md, _state.md)
.claude/agents:   3 files
.claude/memory:   8 files
.claude/outputs: 10 files  (+ P0-T0-execution-plan.md)
.claude/workflows: 4 files
.github/:         2 files  (pull_request_template.md, workflows/.gitkeep)
.vscode/:         3 files  (extensions.json, settings.json, launch.json)
backend/:         1 file   (.gitkeep)
frontend/:        1 file   (.gitkeep)
prisma/:          2 files  (README.md, .gitkeep)
─────────────────────────
Total:           ~40 files
```

Zero application code. Zero dependencies installed. Zero migrations run.
The foundation is in place. P0-T0 begins next.

---

## WHAT COMES IMMEDIATELY AFTER

The moment the bootstrap is complete and the post-bootstrap verification passes, the next action is:

**P0-T0: Write final database schema files**

Execution plan is at: `.claude/outputs/phase-00/P0-T0-execution-plan.md`

Three files to create in `prisma/`:
1. `schema.prisma`
2. `post-migration.sql`
3. `rls-policies.sql`

Time estimate: 2-3 hours.

---

*Bootstrap plan authored: 2026-06-09*
*Environment: Windows, PowerShell, VS Code, Git Bash*
*Next task after completion: P0-T0*
