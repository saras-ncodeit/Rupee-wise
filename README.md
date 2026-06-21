# 💰 Rupee-wise

> **Collaborative Personal & Household Budget Tracker** — a full-stack web application for managing finances, tracking expenses, planning budgets, and monitoring savings goals — built with an Indian-first (₹ INR) focus.

---

## ⚡ Quick Start

### First-time setup
```bash
npm install          # from project root
cd backend && npx prisma migrate dev
```

### Run the app (3 separate terminals)

```bash
# Terminal 1 — Backend API  →  http://localhost:3000/api/v1
cd backend
npm run start:dev

# Terminal 2 — Frontend UI  →  http://localhost:5173
cd frontend
npm run dev

# Terminal 3 — Database GUI →  http://localhost:5555
cd backend
npx prisma studio
```

---

## ✨ Features

- 🔐 **Authentication** — JWT-based auth with HTTP-only cookies, bcrypt password hashing, and 2FA (TOTP) support
- 🏠 **Household Management** — Create shared households with multi-member roles (`owner`, `co_owner`, `member`, `viewer`)
- 💳 **Accounts** — Track multiple account types: checking, savings, credit card, loan, investment, and cash
- 📊 **Transactions** — Log income, expenses, and transfers with splits, tags, attachments, and recurring rules
- 🗂️ **Categories** — Hierarchical custom categories with icons, colors, and system defaults
- 📅 **Budgets** — Monthly budgeting per category with rollover support, percentage-based allocation, and alert thresholds
- 🎯 **Savings Goals** — Set financial targets with contribution tracking linked to transactions
- 🔁 **Recurring Rules** — Automate repeat transactions (rent, subscriptions, salary, etc.)
- 💸 **Loans** — Track loan principal, interest, EMIs, and repayments
- 📈 **Investments** — Monitor portfolio value, units, and returns
- 🧾 **Bills** — Schedule recurring bills with due-day reminders
- 📉 **Reports** — Visual spending breakdowns with Chart.js charts
- 🔔 **Notifications** — In-app alerts for budget limits, due bills, and household activity
- 📋 **Audit Logs** — Full action history per user and household
- 📸 **Monthly Snapshots** — Aggregated spending/income per category per month

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Framework | [NestJS](https://nestjs.com/) v10 |
| Language | TypeScript 5 |
| ORM | [Prisma](https://www.prisma.io/) v5 |
| Database | SQLite (dev) / PostgreSQL (production via Docker) |
| Auth | JWT + Passport.js + bcrypt |
| Validation | `class-validator` + `class-transformer` |
| API | REST — versioned at `/api/v1` |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | [React](https://react.dev/) 18 + TypeScript |
| Build Tool | [Vite](https://vitejs.dev/) 5 |
| Routing | React Router DOM v7 |
| State | [Zustand](https://zustand-demo.pmnd.rs/) v5 |
| Server State | [TanStack Query](https://tanstack.com/query) v5 |
| Charts | [Chart.js](https://www.chartjs.org/) + react-chartjs-2 |
| Icons | [Lucide React](https://lucide.dev/) |

### Infrastructure
| Service | Technology |
|---------|-----------|
| Container DB | PostgreSQL 16 (Alpine) |
| Cache | Redis 7 (Alpine) |
| Orchestration | Docker Compose |

---

## 📁 Project Structure

```
Rupee-wise/
├── backend/                  # NestJS API server
│   ├── src/
│   │   ├── auth/             # JWT auth, guards, strategies
│   │   ├── budgets/          # Budget & budget-line management
│   │   ├── categories/       # Category CRUD
│   │   ├── households/       # Household & member management
│   │   ├── transactions/     # Transaction CRUD with splits & tags
│   │   ├── users/            # User profile management
│   │   └── prisma/           # Prisma service wrapper
│   └── prisma/
│       ├── schema.prisma     # Full database schema (18 models)
│       └── seed.ts           # Database seed script
│
├── frontend/                 # React + Vite SPA
│   └── src/
│       ├── views/            # Page-level components
│       │   ├── DashboardView.tsx
│       │   ├── TransactionsView.tsx
│       │   ├── BudgetsView.tsx
│       │   ├── ReportsView.tsx
│       │   ├── CategoriesView.tsx
│       │   ├── SettingsView.tsx
│       │   ├── LoginView.tsx
│       │   └── RegisterView.tsx
│       ├── components/       # Shared UI components
│       │   ├── NavigationShell.tsx
│       │   ├── QuickAddBottomSheet.tsx
│       │   └── PullToRefresh.tsx
│       ├── hooks/            # Custom React hooks
│       ├── store/            # Zustand global state
│       └── utils/            # Utility helpers
│
└── docker-compose.yml        # PostgreSQL + Redis services
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [npm](https://www.npmjs.com/) v9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL & Redis)

### 1. Clone the repository

```bash
git clone https://github.com/saras-ncodeit/Rupee-wise.git
cd Rupee-wise
```

### 2. Install dependencies

```bash
# Install all workspace dependencies (root + backend + frontend)
npm install
```

### 3. Configure environment variables

The backend uses a `.env` file at `backend/.env`. A development configuration is already included:

```env
DATABASE_URL="file:./dev.db"   # SQLite for local dev
PORT=3000
JWT_SECRET="your-strong-secret-here"
ENCRYPTION_SECRET="your-32-byte-secret-here"
```

> ⚠️ **Never commit real secrets to version control.** Replace the example values before deploying.

### 4. Set up the database

```bash
# Navigate to backend
cd backend

# Run Prisma migrations
npx prisma migrate dev

# (Optional) Seed with sample data
npx prisma db seed
```

### 5. Start the development servers

**Option A — Start everything at once (from the root):**
```bash
npm run dev
```

**Option B — Start services individually:**

```bash
# Start Docker services (PostgreSQL + Redis)
npm run docker:up

# Start the backend (from root)
npm run backend:dev

# Start the frontend (from root)
npm run frontend:dev
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000/api/v1 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## 🐳 Docker Services

Spin up the backing infrastructure using Docker Compose:

```bash
# Start PostgreSQL + Redis in the background
npm run docker:up

# Stop and remove containers
npm run docker:down
```

**Credentials (development only):**
- PostgreSQL DB: `budget_tracker`, User: `postgres`, Password: `postgres_secret_99`

---

## 🧪 Testing

```bash
# Unit tests
cd backend && npm run test

# Test coverage report
cd backend && npm run test:cov

# End-to-end tests
cd backend && npm run test:e2e
```

---

## 📦 Available Scripts

### Root (Monorepo)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Docker + all dev servers |
| `npm run backend:dev` | Start only the backend in watch mode |
| `npm run frontend:dev` | Start only the frontend dev server |
| `npm run docker:up` | Start Docker services in background |
| `npm run docker:down` | Stop Docker services |

### Backend (`cd backend`)
| Script | Description |
|--------|-------------|
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start:prod` | Run production build |
| `npm run lint` | Lint and auto-fix |
| `npm run format` | Format with Prettier |

### Frontend (`cd frontend`)
| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 🗄️ Database Schema Overview

The Prisma schema defines **18 models**:

| Model | Description |
|-------|-------------|
| `User` | Account with 2FA, locale, timezone, and currency support |
| `Household` | Shared financial group with plan tiers |
| `HouseholdMember` | User-Household relationship with roles |
| `Account` | Financial account (bank, cash, card, etc.) |
| `Category` | Hierarchical income/expense categories |
| `Transaction` | Core financial entry with full metadata |
| `TransactionSplit` | Split a transaction across multiple categories |
| `Tag` / `TransactionTag` | Tagging system for transactions |
| `Attachment` | File attachments (receipts) per transaction |
| `Budget` / `BudgetLine` | Monthly budget with per-category lines |
| `SavingsGoal` | Financial goals with progress tracking |
| `GoalContribution` | Contributions linked to transactions |
| `Loan` / `LoanPayment` | Loan tracking with EMI and repayments |
| `Investment` | Portfolio tracking |
| `Bill` / `BillPayment` | Recurring bills with due-date reminders |
| `RecurringRule` | Rules for auto-generating transactions |
| `Notification` | In-app notification system |
| `AuditLog` | Complete activity audit trail |
| `MonthlySnapshot` | Pre-aggregated monthly category totals |

---

## 🌐 API Structure

All endpoints are versioned under `/api/v1`. Key route groups:

- `POST /api/v1/auth/register` — Register a new user
- `POST /api/v1/auth/login` — Login and receive JWT cookie
- `POST /api/v1/auth/logout` — Clear auth cookie
- `GET /api/v1/users/me` — Get current user profile
- `GET/POST /api/v1/households` — Household management
- `GET/POST /api/v1/transactions` — Transaction CRUD
- `GET/POST /api/v1/budgets` — Budget management
- `GET/POST /api/v1/categories` — Category management

---

## 🔒 Security

- Passwords hashed with **bcrypt**
- Auth tokens stored as **HTTP-only cookies** (prevents XSS)
- **CORS** restricted to the frontend origin
- **TOTP-based 2FA** schema support
- **AES encryption** secret configurable via env
- Input validation via `class-validator` with whitelist mode (strips unknown fields)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is **UNLICENSED** — private and proprietary.

---

<p align="center">Built with ❤️ for better financial awareness • <strong>Rupee-wise</strong></p>
