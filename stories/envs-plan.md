# Multi-Environment Setup & Integration Plan (DEV & PROD from Scratch)
**Project:** Point of Sale (POS) for Mobile Accessories & Repair Service Tracking (`pos-mobile-accesories`)  
**Stack:** React 19, Vite 8, TypeScript, TailwindCSS v4, Supabase (Free Tier), Vercel (Hobby Tier), GitHub, Jira (`PSAI-#`)  
**Scope:** 2-Developer Team (Single DevOps/Infrastructure Implementer)  
**Status:** Pre-launch (Client not yet using the application; Frontend on Vercel and Supabase database exist but are currently disconnected).

---

## 1. Reusable Execution Prompt

```markdown
Act as a Cloud/DevOps Architect and Fullstack Tech Lead specializing in React 19, Vite, TypeScript, Supabase, Vercel, GitHub, and Jira.

Project Context:
We are building a Point of Sale (POS) and repair ticketing system for mobile accessories (`pos-mobile-accesories`).
- Team: 2 developers (this setup task is executed exclusively by one developer).
- Current State: Pre-launch. The client is NOT using the app yet. We have a React/Vite frontend deployed standalone on Vercel and initial tables in Supabase, but they are completely DISCONNECTED (frontend is running mock services).
- Budget Constraint: Must operate strictly within the FREE tiers of Supabase (max 2 active projects per organization) and Vercel (Hobby).
- Project Tracking: GitHub for version control and Jira (`PSAI-#` issue key prefix) integrated for automated state transitions.

Objective:
Deliver the Jira User Story (with Gherkin Acceptance Criteria and Definition of Done) and a comprehensive step-by-step guide to:
1. Connect the React/Vite/TS frontend to Supabase via `@supabase/supabase-js` and environment variables.
2. Establish two isolated environments (`DEV` and `PROD`) across Supabase (2 free projects: `pos-mobile-dev` and `pos-mobile-prod`), Vercel (scoped variables for Production vs Preview), and GitHub (`main` vs `develop`).
3. Set up a reproducible database schema migration workflow using the Supabase CLI (`supabase/migrations/`).
4. Perform an end-to-end connectivity smoke test validating that `develop` connects to DEV and `main` connects to PROD.
```

---

## 2. Technical Architecture & Free Tier Blueprint

```
                      +---------------------------------------+
                      |           GitHub Repository           |
                      +-------------------+-------------------+
                                          |
                   +----------------------+----------------------+
                   |                                             |
                   v                                             v
        +--------------------+                        +--------------------+
        |   develop branch   |                        |    main branch     |
        |  (Active Dev & PR) |                        | (Release Candidate)|
        +----------+---------+                        +----------+---------+
                   |                                             |
                   v (Automatic Trigger)                         v (Automatic Trigger)
        +--------------------+                        +--------------------+
        |   Vercel PREVIEW   |                        | Vercel PRODUCTION  |
        |    Deployments     |                        |    Deployments     |
        +----------+---------+                        +----------+---------+
                   |                                             |
                   | Scoped Env:                                 | Scoped Env:
                   | Preview / Development                       | Production
                   v                                             v
        +--------------------+                        +--------------------+
        |  Supabase DEV      |                        |  Supabase PROD     |
        | (pos-mobile-dev)   |                        | (pos-mobile-prod)  |
        | Free Project #1    |                        | Free Project #2    |
        +--------------------+                        +--------------------+
```

### Free Tier Constraints & Solutions
1. **Supabase Free Tier (2 Active Projects per Organization):**
   - **`pos-mobile-dev` (DEV):** Dedicated sandbox for the 2 developers to test schema migrations, auth flows, and write fake/seed test data.
   - **`pos-mobile-prod` (PROD):** Clean baseline database configured for eventual client launch.
   - *Why not native Supabase Branching?* Native database branching requires the Supabase Pro plan ($25/mo). Managing two free projects via the `supabase` CLI is 100% free.
2. **Vercel Hobby Tier (Scoped Environment Variables):**
   - A single Vercel project connected to the GitHub repository.
   - **Production Scope:** Applied exclusively to the `main` branch &rarr; injected with `pos-mobile-prod` credentials.
   - **Preview Scope:** Applied to the `develop` branch and all feature Pull Requests &rarr; injected with `pos-mobile-dev` credentials.
   - **Development Scope:** Used by Vercel CLI / local emulation &rarr; injected with `pos-mobile-dev` credentials.

---

## 3. Jira User Story Specification

### Ticket Title
`[POS] [Setup] Configure and wire multi-environment DEV and PROD architecture across React, Vercel, and Supabase`

### User Story Description
**As a** software engineer on the 2-developer POS team,  
**I want to** integrate `@supabase/supabase-js` into the React/Vite application and establish an automated multi-environment branching pipeline (`DEV` and `PROD`) across GitHub, Vercel, and Supabase,  
**So that** the previously disconnected frontend and database are reliably connected, and our team can develop and test features against an isolated DEV database before promoting stable code and migrations to PROD ahead of client launch.

---

### Acceptance Criteria (Gherkin Scenarios)

```gherkin
Scenario 1: Frontend Supabase Client Integration & Type Safety
  Given the React 19 / Vite application currently operates on disconnected mock services
  When the "@supabase/supabase-js" package is installed and "src/lib/supabaseClient.ts" is initialized
  Then the application instantiates a singleton Supabase client using "import.meta.env.VITE_SUPABASE_URL" and "import.meta.env.VITE_SUPABASE_ANON_KEY"
  And TypeScript validates environment variable typings via "src/vite-env.d.ts" with zero build errors.

Scenario 2: Dual Supabase Projects Provisioned on Free Tier
  Given the Supabase account allows up to 2 free projects
  When "pos-mobile-dev" and "pos-mobile-prod" are provisioned with identical schema migrations
  Then both instances expose distinct API URLs and Anon Keys
  And developers can execute migrations against either environment via Supabase CLI without cross-contamination.

Scenario 3: Vercel Environment Variable Scoping and Automatic Deployments
  Given the Vercel project is linked to the GitHub repository
  When environment variables are configured with distinct scopes
  Then commits pushed to "develop" or PR branches deploy to a Preview URL using "pos-mobile-dev" credentials
  And commits merged into "main" deploy to the Production URL using "pos-mobile-prod" credentials.

Scenario 4: End-to-End Connectivity & Smoke Verification
  Given the application is deployed on both Vercel Preview (DEV) and Vercel Production (PROD)
  When an authenticated or public query (e.g., healthcheck or auth ping) is executed from each frontend
  Then the Preview deployment communicates successfully with "pos-mobile-dev"
  And the Production deployment communicates successfully with "pos-mobile-prod".
```

---

### Definition of Done (DoD)
- [ ] `@supabase/supabase-js` installed and `supabaseClient.ts` singleton created.
- [ ] `.env.example` committed to git; local `.env.local` configured with DEV credentials.
- [ ] Two Supabase projects (`pos-mobile-dev` and `pos-mobile-prod`) created with baseline schema synchronization.
- [ ] Base migrations folder `supabase/migrations/` initialized and tracked in Git.
- [ ] Vercel environment variables configured with explicit scope separation (`Production` vs `Preview/Development`).
- [ ] `develop` branch created in GitHub and verified on Vercel Preview.
- [ ] Smoke test confirming database read/write from both Vercel environments completed.

---

## 4. Step-by-Step Implementation Guide (From Scratch)

### Step 1: Start Task Branch to Trigger Jira Automation
Replace `PSAI-XX` with your actual Jira ticket number:

```powershell
git checkout main
git pull origin main
git checkout -b chore/PSAI-XX-setup-multi-env-dev-prod
git push -u origin chore/PSAI-XX-setup-multi-env-dev-prod
```
*(Triggers Jira Automation Rule 1: transitions card from **Por hacer** to **En curso**).*

---

### Step 2: Install Supabase Client in the React/Vite Project

1. Install `@supabase/supabase-js`:
   ```powershell
   npm install @supabase/supabase-js
   ```

2. Register environment variables in TypeScript. Edit or create `src/vite-env.d.ts`:
   ```typescript
   /// <reference types="vite/client" />

   interface ImportMetaEnv {
     readonly VITE_SUPABASE_URL: string;
     readonly VITE_SUPABASE_ANON_KEY: string;
   }

   interface ImportMeta {
     readonly env: ImportMetaEnv;
   }
   ```

3. Create the Supabase client singleton under `src/lib/supabaseClient.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   if (!supabaseUrl || !supabaseAnonKey) {
     console.warn(
       '[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. ' +
       'Check your .env.local file or Vercel project settings.'
     );
   }

   export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
   ```

4. Create a lightweight connectivity smoke test component or utility (e.g., `src/utils/supabaseHealthCheck.ts`):
   ```typescript
   import { supabase } from '../lib/supabaseClient';

   export async function checkSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
     try {
       const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
       if (error && error.code !== 'PGRST116') {
         return { ok: false, message: error.message };
       }
       return { ok: true, message: 'Connected to Supabase successfully' };
     } catch (err: any) {
       return { ok: false, message: err.message || 'Network error' };
     }
   }
   ```

---

### Step 3: Configure Local Environment Files

1. Commit a public template `.env.example` in the project root:
   ```env
   # Supabase Configuration Template (Do not put real secret keys here)
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```

2. Create your personal `.env.local` (ignored by Git) for daily local development:
   ```env
   VITE_SUPABASE_URL=https://<DEV_PROJECT_ID>.supabase.co
   VITE_SUPABASE_ANON_KEY=<DEV_ANON_KEY>
   ```

3. Confirm that `.env.local` is present in `.gitignore`:
   ```gitignore
   .env.local
   .env.*.local
   ```

---

### Step 4: Provision & Synchronize Supabase Projects (DEV and PROD)

Since the client is not yet using the app, you can structure both databases cleanly from the start:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard).
2. **Audit your current Supabase project:**
   - In *Project Settings &rarr; General*, rename it to **`pos-mobile-prod`**.
   - Note down its **Project Reference ID**, **URL**, and **anon public key** (*Project Settings &rarr; API*).
3. **Create the second free project (`DEV`):**
   - Click **New Project** in your organization.
   - Name: **`pos-mobile-dev`**.
   - Select the same geographic region as PROD (e.g., `sa-east-1` São Paulo).
   - Note down its **Project Reference ID**, **URL**, and **anon public key**.
4. **Initialize Versioned Migrations with Supabase CLI:**
   ```powershell
   # 1. Initialize local Supabase configuration
   npx supabase init

   # 2. Log in with your Supabase account token
   npx supabase login

   # 3. Link to the project that contains your initial schema (PROD)
   npx supabase link --project-ref <PROD_PROJECT_REF>

   # 4. Pull existing database schema into a versioned migration file
   npx supabase db pull
   ```
   > [!TIP]
   > If Docker is not installed locally and `npx supabase db pull` prompts for Docker, you can export your DDL schema directly from the Supabase Dashboard (*SQL Editor / Schema Visualizer*) and save it as `supabase/migrations/20261027000000_initial_schema.sql`.

5. **Apply the initial schema to the new `pos-mobile-dev` project:**
   ```powershell
   # Link CLI to DEV project
   npx supabase link --project-ref <DEV_PROJECT_REF>

   # Push schema to DEV
   npx supabase db push
   ```
   *(Both Supabase instances now share identical schemas).*

---

### Step 5: Connect Vercel & Configure Scoped Environment Variables

1. Open your project on [Vercel Dashboard](https://vercel.com).
2. Go to **Settings &rarr; Git**:
   - Ensure the repository is connected to `NoMeCompila/pos-mobile-accesories`.
   - Set **Production Branch** to `main`.
3. Go to **Settings &rarr; Environment Variables**:
   - Add/Update `VITE_SUPABASE_URL`:
     - **Value 1 (PROD URL):** Check **ONLY `Production`**.
     - **Value 2 (DEV URL):** Check **`Preview`** and **`Development`**.
   - Add/Update `VITE_SUPABASE_ANON_KEY`:
     - **Value 1 (PROD Anon Key):** Check **ONLY `Production`**.
     - **Value 2 (DEV Anon Key):** Check **`Preview`** and **`Development`**.
4. Save changes.

---

### Step 6: Create `develop` Branch & Commit Integration Assets

1. Stage and commit code changes on your task branch:
   ```powershell
   git add .
   git commit -m "PSAI-XX #time 2h #comment Wire Supabase client, add types, migrations baseline and env template"
   git push
   ```
2. Create and push the `develop` branch from `main`:
   ```powershell
   git checkout main
   git checkout -b develop
   git push -u origin develop
   ```
3. Merge your task branch into `develop` via a GitHub Pull Request to test the pipeline.

---

### Step 7: End-to-End Smoke Test & Verification

1. **Verify DEV Pipeline (Preview):**
   - Check Vercel for the deployment triggered by `develop`.
   - Open the resulting Preview URL (`https://pos-mobile-accesories-git-develop-...vercel.app`).
   - Open Browser DevTools &rarr; Network / Console:
     - Verify requests go to `https://<DEV_PROJECT_ID>.supabase.co`.
     - Perform a test action (e.g., register a user, insert a mock category).
     - Check the table in `pos-mobile-dev` Dashboard &rarr; **Data appears here**.
     - Check `pos-mobile-prod` Dashboard &rarr; **Data is NOT here** (Zero contamination).
2. **Verify PROD Pipeline (Production):**
   - Open a PR from `develop` to `main` and merge it.
   - Access the primary production URL (`https://pos-mobile-accesories.vercel.app`).
   - Verify requests go to `https://<PROD_PROJECT_ID>.supabase.co`.
   - Confirm database is clean and ready for pre-launch staging.

---

## 5. Daily 2-Developer Collaboration Workflow

```
[Developer 1 or 2]
       │
       ▼
git checkout develop && git pull
git checkout -b feat/PSAI-10-category-crud
       │
       ▼
Develop locally (.env.local pointing to Supabase DEV)
       │
       ▼
git push -u origin feat/PSAI-10-category-crud
       │
       ▼
Open PR -> target: `develop`
       │
       ▼
Vercel generates Preview URL (connected to Supabase DEV)
Both devs test & review without touching PROD
       │
       ▼
Merge PR into `develop`
       │
       │  (Sprint complete / Ready for release)
       ▼
1. If migrations exist: run `npx supabase db push` against PROD
2. Open PR: `develop` -> `main`
3. Merge PR -> Vercel deploys to Production automatically
```
