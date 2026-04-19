# CloudCrafter — Frontend

A **React** single-page application that provides a conversational interface for deploying and managing AWS cloud infrastructure. Users describe what they want in plain English; the app handles the rest via AWS Lex, Terraform, and Infracost.

---

## Features

| Feature | Description |
|---|---|
| 💬 **Conversational IaC** | Chat with AWS Lex to describe, build, and modify infrastructure blueprints |
| 📋 **Terraform Plan Viewer** | Rich diff-style view of resources to be created, changed, or destroyed |
| 💰 **Live Cost Estimation** | One-click Infracost estimates before committing to a deploy |
| 🚀 **One-click Deploy** | Approve a plan and watch real-time Terraform logs stream in |
| 🔴 **Infrastructure Destroy** | Safely destroy environments with RBAC approval for architects |
| 🤖 **AI Failure Analysis** | Gemini-powered root cause analysis with step-by-step fix suggestions |
| 🔔 **Audio Notifications** | Sound alerts on deployment success, failure, and plan completion |
| 👥 **Multi-user Projects** | Invite Cloud Architects to collaborate on projects |
| 📡 **Supabase Realtime** | Live chat and job status updates without manual refresh |
| 🌗 **Dark / Light Theme** | Toggle between dark and light modes |

---

## Architecture Overview

```
User
 │
 ▼
React SPA (Create React App)
 ├── AWS Lex V2 (via AWS SDK)   — natural language understanding
 ├── Supabase JS Client          — auth, database, realtime subscriptions
 └── FastAPI Backend             — job orchestration, Terraform, Infracost
```

### Key Component Map

```
src/
├── components/
│   ├── ConsoleLayout.js        # Main shell — routing, polling, Lex integration
│   ├── ChatFeed.js             # Message list renderer
│   ├── CommandInput.js         # Text input + send button
│   ├── Sidebar.js              # Project list + navigation
│   ├── TerraformPlanView.js    # Plan diff viewer with cost + approve/discard
│   ├── DeploymentFailureView.js # Failure card with AI analysis
│   ├── DeploymentSuccessView.js # Success card with outputs
│   ├── LandingPage.js          # Public marketing page
│   └── CostModal.js            # Cost breakdown modal
├── pages/
│   ├── LogPanel.jsx            # Real-time Terraform log streaming panel
│   ├── ProjectDashboard.jsx    # Per-project dashboard
│   ├── CreateProjectModal.jsx  # New project creation with invite flow
│   ├── ProjectMembersModal.jsx # Manage project members
│   ├── SignIn.jsx              # Login form
│   ├── SignUp.jsx              # Registration with IAM role input
│   ├── AcceptInvite.jsx        # Invitation acceptance flow
│   └── ApproveDestroy.jsx      # Admin destroy approval page
├── hooks/
│   └── useSupabaseRealtime.js  # Realtime insert/update hooks
└── utils/
    └── api.js                  # Authenticated fetch wrapper
```

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A running instance of the [CloudCrafter Backend](../Conversational-infra-provisioning-agent-backend)
- AWS Lex V2 bot with the following intents:
  - `CreateInfraIntent`
  - `ModifyInfraIntent`
  - `TerminateInfraIntent`
  - `StatusInfraIntent`
- AWS Cognito Identity Pool (for unauthenticated Lex access)
- Supabase project

### 1. Clone the repository

```bash
git clone <repo-url>
cd Conversational-infra-provisioning-agent
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
# FastAPI backend URL
REACT_APP_API_BASE_URL=http://localhost:8000

# AWS Lex V2
REACT_APP_AWS_REGION=us-east-1
REACT_APP_LEX_BOT_ID=<your-lex-bot-id>
REACT_APP_LEX_BOT_ALIAS_ID=<your-lex-alias-id>

# AWS Cognito Identity Pool (for Lex unauthenticated access)
REACT_APP_COGNITO_IDENTITY_POOL_ID=us-east-1:<your-pool-id>

# Supabase
REACT_APP_SUPABASE_URL=https://<your-project>.supabase.co
REACT_APP_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. Start the development server

```bash
npm start
```

The app will be available at `http://localhost:3000`.

### 5. Production build

```bash
npm run build
```

---

## Page / Route Reference

| Route | Component | Description |
|---|---|---|
| `/` | `LandingPage` | Public marketing page |
| `/signin` | `SignIn` | Email + password login |
| `/signup` | `SignUp` | Registration with AWS IAM role ARN |
| `/console` | `ConsoleLayout` | Main application shell |
| `/invite/:token` | `AcceptInvite` | Accept a project collaboration invite |
| `/approve-destroy/:token` | `ApproveDestroy` | Admin destroy approval page |
| `/logout` | — | Clears session and redirects to `/` |

---

## Conversation Flow

```
User types message
      │
      ▼
AWS Lex V2 (NLU)
      │
      ▼
Lex Webhook (FastAPI /lex-webhook)
      │
      ├── CreateInfraIntent  → Build blueprint → Ask to plan
      ├── ModifyInfraIntent  → Update blueprint (add/remove/change services)
      └── TerminateInfraIntent → Destroy confirmation flow
      │
      ▼
Session attributes returned to frontend
      │
      ├── PLAN_STARTED   → Poll /status → Show TerraformPlanView
      ├── DESTROY_STARTED → Poll /status → Show result
      └── DESTROY_APPROVAL_PENDING → Notify user to wait
```

---

## State Management

There is no external state library. State is managed via:

- **`useState` / `useRef`** — local component state for messages, projects, UI toggles
- **`chatCache` ref** — in-memory cache of chat history per project (avoids re-fetching on project switch)
- **`sessionAttributesRef`** — holds Lex session state (blueprint, conversation_state) between turns
- **`projectLogsRef`** — tracks which job is active in the log panel per project
- **Supabase Realtime** — live subscriptions on `jobs` and `projects` tables

---
## Auth & Session

- Auth is handled by **Supabase Auth** (email + password).
- On login, the server returns a JWT and user metadata which is stored in `localStorage` as `cloudcrafter_session`.
- The `apiFetch` utility in `utils/api.js` automatically attaches the `Authorization: Bearer <token>` header to every API call.
- On token expiry (401 response), the app clears the session and redirects to `/signin`.

---

## Notifications

Audio notifications are played (via the Web Audio API) when:
- A **Terraform plan** completes
- A **deployment** succeeds or fails
- A **cost estimate** finishes

The audio file is served from `/public/notification.wav`.

---

## Tech Stack

| Technology | Version |
|---|---|
| React | 19.x |
| React Router | 7.x |
| AWS SDK (Lex V2) | 3.x |
| AWS SDK (Cognito Identity) | 3.x |
| Supabase JS | 2.x |
| Tailwind CSS | (configured via `tailwind.config.js`) |
| Create React App | 5.0.1 |

---

## Supabase Tables Used

| Table | Purpose |
|---|---|
| `projects` | Project metadata and ownership |
| `jobs` | Terraform job tracking (status, logs, AI analysis) |
| `chat_messages` | Persistent per-project chat history |
| `user_profiles` | Roles (`admin` / `cloud_architect`) and display names |
| `aws_credentials` | IAM Role ARNs per user |
| `project_members` | Many-to-many: users → projects |
| `project_invitations` | Pending email invitations |
| `destroy_approvals` | Pending destroy requests awaiting admin approval |

---

## Running Tests

```bash
npm test
```

Uses React Testing Library + Jest.

---

## Project Structure

```
Conversational-infra-provisioning-agent/
├── public/
│   ├── index.html
│   └── notification.wav      # Audio notification sound
├── src/
│   ├── components/           # UI components
│   ├── pages/                # Route-level page components
│   ├── hooks/                # Custom React hooks (Supabase Realtime)
│   ├── utils/                # API fetch wrapper, auth helpers
│   ├── App.js                # Route definitions
│   ├── index.js              # React entry point
│   └── index.css             # Global styles
├── .env                      # Environment variables (not committed)
├── tailwind.config.js
└── package.json
```

---

## License

MIT
