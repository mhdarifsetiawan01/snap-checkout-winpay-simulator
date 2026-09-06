---
name: project-implementation-protocol
description: Standard Operating Procedure (SOP) for task planning, active implementation lifecycle (implementation/active/), user approval gates, automated archiving (implementation/archive/DD-MM-YYYY_topic/), and strict Git commit & safety protection rules for snap-checkout-simulator.
---

# Project Implementation Protocol & Safety Rules SOP

This skill defines the mandatory development lifecycle, planning protocols, archiving standards, and Git safety gates that all AI agents MUST strictly follow when working on this repository.

---

## 🔄 1. Mandatory 6-Step Implementation Lifecycle

Every feature, refactoring, or bug fix task MUST proceed through these 6 sequential steps:

```text
[1. PLAN & SPEC] ➔ [2. USER APPROVAL] ➔ [3. INCREMENTAL BUILD] ➔ [4. VERIFY & TEST] ➔ [5. USER CONFIRMATION] ➔ [6. ARCHIVE & GIT COMMIT]
```

### Step 1: Initialize Active Plan
- Before modifying or creating any codebase files, create or update the active plan document in:
  `implementation/active/task_plan.md`
- The plan must contain:
  1. **Goal & Overview**: Clear problem statement.
  2. **Proposed Changes**: Exact list of files to be modified, created, or deleted.
  3. **Verification Plan**: Commands and smoke tests to run.
  4. **Open Questions**: Any ambiguous requirements.

### Step 2: Stop & Await User Approval (MANDATORY GATE 1)
- Present the plan summary to the user.
- **STOP immediately** and DO NOT touch any code until the user gives explicit approval (e.g., "Proceed", "Setuju", "Lanjut").

### Step 3: Incremental Implementation
- Execute code changes incrementally in small chunks.
- Apply `token-optimization-guard`: Use `replace_file_content` with line ranges; avoid dumping entire files.
- Preserve existing comments, types, and logic structures.

### Step 4: Verification & Smoke Test
- Run runtime verification:
  - Fastify API test (`curl http://localhost:3001/api/health`)
  - Next.js Web UI build/dev test (`curl http://localhost:3000/`)
  - CLI script test (`./scripts/create-*.sh`)
- Confirm zero runtime errors, broken imports, or missing dependencies.

### Step 5: Ask User Confirmation (MANDATORY GATE 2)
- Present the test results to the user.
- Ask explicitly:
  > *"Apakah implementasi ini sudah sesuai dengan ekspektasi Anda dan dapat dinyatakan selesai?"*
- **STOP and wait for user's explicit confirmation** (e.g., "selesai", "sudah oke").

### Step 6: Archive Plan & Git Commit
ONLY after the user confirms completion:
1. **Archive the Plan**:
   Move `implementation/active/` to `implementation/archive/DD-MM-YYYY_<topic_name>/`:
   ```bash
   # Example:
   mkdir -p implementation/archive/06-09-2026_monorepo-restructuring
   mv implementation/active/* implementation/archive/06-09-2026_monorepo-restructuring/
   ```
2. **Git Commit with Approval**:
   Follow the strict Git rules in Section 2.

---

## 🛡️ 2. Strict Git Safety & Commit Protection Rules

### 2.1 NO Direct Work on Protected Branches
- **Protected Branches**: `main`, `master`, `staging`, `production`.
- If the current branch is a protected branch, WARN the user and switch to a feature/dev branch (e.g., `dev`, `feature/*`, `task/*`) before writing any code.

### 2.2 STRICT PROHIBITION ON UNCONFIRMED COMMITS
- **NEVER** run `git commit`, `git push`, or `git merge` automatically without asking and receiving explicit written confirmation from the user first.
- Always propose the commit message and changed file list to the user:
  ```text
  Branch: dev
  Files: [list of files]
  Proposed Commit Message: feat(monorepo): separate backend and frontend architecture
  
  Apakah Anda menyetujui commit ini?
  ```
- Run `git commit` ONLY after user approves.

### 2.3 STRICT PROHIBITION ON SENSITIVE FILE COMMITS
- NEVER stage or commit:
  - `.env`, `.env.local`, `.env.*`
  - `*.pem`, `*.key`, `*.crt` (RSA private/public keys)
  - `db.json` (Local state with real transaction IDs)
  - `node_modules/`

---

## 📁 3. Workspace Folder Standard

```text
snap-checkout-simulator/
├── implementation/
│   ├── active/               # Plan aktif yang sedang dikerjakan saat ini
│   │   └── task_plan.md
│   └── archive/              # Riwayat plan yang sudah selesai
│       └── DD-MM-YYYY_topic/ # Format arsip per tanggal dan topik
├── backend/                  # Fastify API, CLI Runner, Helpers, Config
├── frontend/                 # Next.js Web UI & Components
├── scripts/                  # Bash CLI shortcuts
├── docs/                     # Arsitektur, API Reference, Roadmap
├── .agents/skills/           # Project-specific AI Skills
└── package.json              # Monorepo runner
```

---

## 📋 4. Anti-Rationalization & Enforcement

The AI agent MUST reject the following rationalization excuses:
- ❌ *"This task is small, I don't need to create implementation/active/."* ➔ **FALSE**. Always create the plan first.
- ❌ *"I will commit now since all tests pass."* ➔ **FALSE**. Must ask user permission first.
- ❌ *"I can archive immediately after writing code."* ➔ **FALSE**. Wait for explicit user confirmation ("selesai") first.
