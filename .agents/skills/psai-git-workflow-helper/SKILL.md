---
name: psai-git-workflow-helper
description: Expert Git, GitHub, and Jira Smart Commit workflow assistant for the Humans In The Loop (PSAI) POS project. Use when creating branches (feat/PSAI-#-..., fix/PSAI-#-...), formatting Smart Commits (PSAI-# #time Xh #comment ...), drafting Pull Request templates, or executing status transitions across the Por hacer, En curso, Testing, Fixing, and Finalizado board columns.
---
# psai-git-workflow-helper

## Summary

Standardizes and automates Git branch creation, Smart Commit messages, Pull Request templates, and QA fixing cycles for the `NoMeCompila/pos-mobile-accesories` repository so every developer action seamlessly triggers the three active Jira Automation rules on the **Humans In The Loop (`PSAI`)** board.

## When to Use

- Starting work on a new Jira User Story, Bug, Research spike, or DevOps task identified by a `PSAI-<number>` key
- Generating standardized Git branch names and initial remote push commands to trigger Jira Automation Rule 1 (`Por hacer` to `En curso`)
- Formatting Git commit messages with Jira Smart Commit syntax (`#time`, `#comment`, and `#fixing`) to log development hours and technical notes directly from the terminal
- Drafting GitHub Pull Request titles and structured Markdown descriptions to trigger Jira Automation Rule 2 (`En curso` or `Fixing` to `Testing`)
- Resolving QA feedback during the `Testing` and `Fixing` cycle or preparing a Pull Request merge to trigger Jira Automation Rule 3 (`Testing` to `Finalizado`)

## Steps

### 1. Enforce Standardized Branch Creation and Rule 1 Activation (`En curso`)

Whenever a developer starts working on a backlog item, generate the exact branch name and remote tracking command required by the **GitHub for Atlassian** integration:

- **Mandatory Branch Naming Pattern**: Format every branch strictly as `<type>/PSAI-<number>-<short-kebab-case-slug>` using uppercase `PSAI-<number>` and lowercase hyphenated descriptions:
  - `feat/PSAI-<number>-<slug>`: For user stories and new POS features (such as `feat/PSAI-12-user-management-crud`).
  - `fix/PSAI-<number>-<slug>`: For bug fixes and QA defects (such as `fix/PSAI-7-login-error-reload`).
  - `chore/PSAI-<number>-<slug>`: For DevOps pipelines, Supabase migrations, and configuration tasks (such as `chore/PSAI-28-supabase-qa-prod`).
  - `docs/PSAI-<number>-<slug>`: For technical research spikes and Confluence documentation tasks (such as `docs/PSAI-29-jira-confluence-workflow`).
  - `test/PSAI-<number>-<slug>`: For automated API, ARCA homologation, and payment integration test suites.
- **Immediate Upstream Push for Board Transition**: Instruct the developer to pull the latest base branch (`main` or `staging`), create the local branch, and immediately push it upstream (`git push -u origin <branch_name>`) so Jira Automation **Rule 1 (`1 - Rama creada a En curso`)** detects the branch creation event in GitHub and transitions the `PSAI-<number>` card from **Por hacer** to **En curso** automatically.

### 2. Format Atomic Commits and Jira Smart Commits

Structure every commit message so code history remains auditable in GitHub and automatically logs activity inside the Jira work item:

- **Standard Commit Prefix**: Always begin every commit message with the uppercase issue key `PSAI-<number>` followed by a concise imperative summary in English describing the change (such as `PSAI-15 Implement dynamic USD to ARS exchange rate service`).
- **Smart Commit Time and Comment Directives**: When requested or when completing a meaningful milestone, append Atlassian Smart Commit commands to the commit message:
  - **Time Logging (`#time`)**: Use `#time <Xh Ym>` (such as `PSAI-15 #time 2h 30m`) to record elapsed development effort directly against the story's estimated hours.
  - **Issue Commenting (`#comment`)**: Use `#comment <text>` (such as `PSAI-29 #comment Linked Confluence architecture page and verified webhook sync`) to post technical progress notes on the Jira card without leaving the terminal.
- **Author Email Alignment Check**: Remind the developer that Smart Commit directives (`#time`, `#comment`, and status transitions) require the local `git config user.email` value to match the exact email address registered on their Atlassian (`psionicsoftware.atlassian.net`) user profile.

### 3. Generate Pull Request Titles and Descriptions for Rule 2 Activation (`Testing`)

When feature implementation is ready for peer review and QA verification, generate the Pull Request metadata required to trigger **Rule 2 (`2 - Pull Request a In Testing`)**:

- **Strict Pull Request Title Convention**: Format the Pull Request title starting with the bracketed Jira key followed by the story's module prefix and title: `[PSAI-<number>] [POS] [<Layer>] <Short Feature Title>`.
- **Structured Pull Request Body Template**: Generate a clean Markdown PR description containing five mandatory sections:
  - **Jira Ticket and Confluence Link**: Direct clickable URL to `https://psionicsoftware.atlassian.net/browse/PSAI-<number>` and any associated Confluence specification page in the **Desarrollo de software** space.
  - **Summary of Changes**: Concise bullet points detailing database migrations, backend RPCs/Edge Functions, or React 19 UI components added or modified.
  - **Environment and Database Impact**: Explicit checklist confirming whether new Supabase SQL migrations, RLS policies, or Vercel environment variables must be applied in the QA staging environment.
  - **Gherkin Acceptance Criteria Verification**: Checklist mapping each Given/When/Then scenario from the Jira story to its verified behavior.
  - **Definition of Done (DoD) Checklist**: Confirmation of strict TypeScript compilation, zero console/linting errors, role permission checks, and responsive/thermal print verification.

### 4. Manage the QA `Fixing` Loop and Rule 3 Activation (`Finalizado`)

Coordinate smooth transitions between the two developers during code review, QA testing, and final merge:

- **Transitioning from `Testing` to `Fixing` on QA Defects**: If peer review or QA testing in the Vercel preview environment uncovers a bug while the card is in **Testing**, instruct the developer to either push a fix commit containing the `#fixing` Smart Commit command (`PSAI-<number> #fixing #comment Address validation feedback on CUIT input`) or decline/update the Pull Request so the card reflects active rework in the **Fixing** column.
- **Returning to `Testing` After Rework**: Once the fix commits are pushed and ready for re-verification, reopen or update the Pull Request and transition the card back to **Testing**.
- **Executing the Merge for Rule 3 (`3 - Merge a Finalizado`)**: Once all acceptance criteria pass in QA and the peer developer approves the Pull Request, merge the Pull Request in GitHub (`Squash and merge` or `Merge pull request` keeping the `PSAI-<number>` key in the merge commit title). This automatically fires Jira Automation **Rule 3**, moving the card from **Testing** to **Finalizado**.

### 5. Enforce Two-Developer Parallel Coordination Hygiene

Prevent merge conflicts and broken deployments when both developers work concurrently within the same 1-week sprint:

- **Pre-PR Rebase or Merge Sync**: Before opening a Pull Request, always synchronize the feature branch with the latest remote base branch (`git fetch origin` and `git rebase origin/main` or merge) and verify that `npm run build` and TypeScript checks pass locally.
- **Migration Timestamp Ordering**: When both developers create Supabase SQL migrations in the same sprint, verify chronological file prefixes under `supabase/migrations/` before merging so QA and PROD schema deployments run without ordering collisions.

## Gotchas

- **Lowercase Issue Keys Ignored by Parser**: Writing `psai-12` in lowercase inside branch names, commit messages, or Pull Request titles can cause the GitHub-to-Jira parser to skip the event; always write `PSAI-<number>` in uppercase.
- **Creating Local Branches Without Pushing**: Creating a branch locally with `git checkout -b feat/PSAI-12-...` does not notify GitHub or Jira; the developer must execute `git push -u origin <branch>` for Rule 1 to move the card to **En curso**.
- **Omitting the Issue Key From the PR Title**: If a branch was named without the `PSAI-#` key and the Pull Request title also omits `[PSAI-#]`, Rule 2 (`2 - Pull Request a In Testing`) and Rule 3 (`3 - Merge a Finalizado`) will not know which Jira activity to transition.
- **Smart Commit Syntax Quotation Errors**: Multi-word `#comment` messages must remain inside the quoted `git commit -m "..."` string and precede any subsequent `#` command tag, as Jira interprets everything after `#comment` up to the next `#tag` as the comment body.
