# BugFlow — Issue Tracking and Project Management System

BugFlow is a full-stack, modern issue tracking and project management web application inspired by Jira. It provides development teams with an intuitive interface to manage projects, track bugs, organize workflows with an interactive Kanban board, and collaborate via issue comments.

---

## Tech Stack

### Frontend
- **React.js 19** with **Vite**
- **React Router DOM v7** (Declarative client-side routing)
- **Axios** (Configured API client with automatic JWT bearer token interceptors)
- **Lucide React** (Clean, accessible icons)
- **Plain CSS** (Component-scoped, modern SaaS design system with CSS custom properties)
- **Oxlint** (High-performance code quality and linting)

### Backend
- **Node.js** & **Express.js 5**
- **PostgreSQL** (Relational database with parameterized queries and transaction support)
- **pg** (PostgreSQL connection pool)
- **JWT (`jsonwebtoken`)** (Stateless authentication with Bearer tokens)
- **`bcryptjs`** (Secure password hashing with salted rounds)
- **Helmet** & **CORS** (Security headers and cross-origin resource sharing)

---

## System Architecture

```text
BugFlow/
├── backend/
│   ├── config/
│   │   └── db.js                 # PostgreSQL connection pool
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT authentication & role-based authorization
│   ├── routes/
│   │   ├── authRoutes.js         # Register, Login, Current User verification
│   │   ├── projectRoutes.js      # Project CRUD, team membership, permissions
│   │   └── issueRoutes.js        # Issue CRUD, status transitions, comments
│   ├── schema.sql                # Complete PostgreSQL DDL definitions & indexes
│   ├── server.js                 # Express application entry point
│   ├── .env.example              # Environment variables template
│   └── package.json
│
├── frontend/
│   ├── public/                   # Static web assets
│   ├── src/
│   │   ├── api/                  # Axios API modules (auth, projects, issues)
│   │   ├── components/           # Reusable UI (Navbar, Sidebar, Modals, Shared CSS)
│   │   ├── context/              # Authentication context & provider
│   │   ├── pages/                # Application views:
│   │   │   ├── Dashboard.jsx     # Live statistics, recent issues, project cards
│   │   │   ├── Kanban.jsx        # Drag-and-drop workflow columns (To Do, In Progress, Done)
│   │   │   ├── Projects.jsx      # Project list & Create Project modal
│   │   │   ├── ProjectDetail.jsx # Project overview, members, and backlog
│   │   │   ├── MyIssues.jsx      # Multi-criteria issue search, filter, and sort
│   │   │   ├── IssueDetail.jsx   # Issue details, status/priority controls, live comments
│   │   │   ├── Login.jsx         # User authentication with client validation
│   │   │   └── Register.jsx      # New account registration
│   │   ├── router/               # Public and Protected route guards
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example              # Frontend environment template
│   ├── vite.config.js
│   └── package.json
│
├── .gitignore                    # Root repository ignore rules
└── README.md                     # Project documentation
```

---

## Key Features

1. **User Authentication & Authorization**
   - Secure registration and login with encrypted password storage (`bcryptjs`).
   - Token-based session management (`JWT`) with auto-hydration in `AuthContext`.
   - Protected client-side routes redirect unauthenticated users to `/login`.
   - Backend middleware enforces project-level authorization (preventing cross-user data tampering).

2. **Project Management**
   - Create projects with automatic owner assignment and membership records.
   - Project dashboard displaying live progress percentage, total issues, completed issues, and team members.
   - Role-aware project detail views.

3. **Issue Tracking & Kanban Board**
   - Full issue lifecycle management (`To Do` → `In Progress` → `Done`).
   - Drag-and-drop and inline status selector with optimistic UI updates and server rollback on failure.
   - Priority levels: `Low`, `Medium`, `High`, `Critical`.
   - Assign issues exclusively to verified project members.

4. **Interactive Comments**
   - Live activity thread on each issue detail page.
   - Real-time comment submission with duplicate prevention and user initials badges.

5. **Personalized Dashboard & Filtering**
   - Live statistics cards (Total, Open, In Progress, Resolved).
   - "My Issues" view with scope toggle ("Assigned to Me" vs "All Team Issues").
   - Search by keyword/ID, filter by status and priority, and multi-field sorting.

---

## Getting Started

### Prerequisites
- **Node.js** (v18.x or newer recommended)
- **npm** (v9.x or newer)
- **PostgreSQL** (v14.x or newer running locally or remotely)

---

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd BugFlow
```

---

### Step 2: Database Setup
1. Create a PostgreSQL database named `BugFlow`:
   ```sql
   CREATE DATABASE "BugFlow";
   ```
2. Execute the schema script located at `backend/schema.sql`:
   ```bash
   psql -U postgres -d BugFlow -f backend/schema.sql
   ```
   *(Or run the SQL statements inside `backend/schema.sql` in pgAdmin / your preferred SQL GUI).*

---

### Step 3: Backend Configuration & Startup
1. Navigate into the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from the example template:
   ```bash
   cp .env.example .env
   ```
4. Open `.env` and fill in your PostgreSQL credentials and JWT secret:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=BugFlow
   DB_USER=postgres
   DB_PASSWORD=your_actual_postgres_password
   JWT_SECRET=your_secure_random_jwt_secret
   ```
5. Start the backend server:
   ```bash
   npm start
   ```
   *The backend server will run at `http://localhost:5000`.*
   *Verify database connection: `http://localhost:5000/api/health/db`.*

---

### Step 4: Frontend Configuration & Startup
1. Open a new terminal and navigate into the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` from template:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   *The application will be live at `http://localhost:5173/`.*

---

## Available Scripts

### Backend (`cd backend`)
- `npm start`: Runs the Express server (`node server.js`).
- `npm run dev`: Runs the server with auto-reload (`nodemon server.js`).

### Frontend (`cd frontend`)
- `npm run dev`: Starts Vite local development server with hot module replacement (HMR).
- `npm run build`: Compiles production bundle into `dist/`.
- `npm run lint`: Runs Oxlint static code analyzer.
- `npm run preview`: Previews the production build locally.

---

## API Reference

| Method | Endpoint | Description | Protected |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register a new user | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | Yes |
| `GET` | `/api/projects` | List projects user has access to | Yes |
| `POST` | `/api/projects` | Create a new project | Yes |
| `GET` | `/api/projects/:id` | Fetch project details, members, and issues | Yes |
| `GET` | `/api/issues` | List issues (supports search, status, priority, projectId filters) | Yes |
| `POST` | `/api/issues` | Create an issue in an authorized project | Yes |
| `GET` | `/api/issues/:id` | Fetch single issue details | Yes |
| `PATCH` | `/api/issues/:id` | Update issue status, priority, title, or assignee | Yes |
| `GET` | `/api/issues/:id/comments` | List comments for an issue | Yes |
| `POST` | `/api/issues/:id/comments` | Post a comment on an issue | Yes |
| `GET` | `/api/health/db` | Database connection health check | No |

---

## License
This project is licensed under the ISC License.
