# Mock Pariksha: Exam Engine (Frontend)

The Frontend for the **Mock Pariksha** Exam Engine is a comprehensive React-based application designed to simulate and administer high-stakes competitive examinations (like JEE Main). It provides a robust, interactive, and visually stunning testing environment with real-time syncing, AI-assisted performance analysis, and administrative dashboards.

## Features

- **Interactive Exam Simulation**: Replicates the exact environment of computer-based tests, including a palette for tracking question states (Answered, Not Answered, Marked for Review, Not Visited).
- **Grace Period & Autosaving**: Automatically saves exam progress periodically and features a grace period mechanism to securely submit sessions when the timer runs out.
- **Dynamic Subject & Section Navigation**: Supports seamless switching between subjects (Physics, Chemistry, Mathematics) and question types (Single Choice and Numerical).
- **AI-Powered Diagnostics (Integration ready)**: Comprehensive reporting screen with radar charts mapping out student proficiency across subjects.
- **Admin Dashboard**: Manage user access, monitor exam status, analyze global statistics, and perform CRUD operations on exams.
- **Role-based Access**: Distinguishes between student and admin experiences securely.
- **Mathematical Rendering**: First-class support for rendering LaTeX-based mathematical formulas and complex equations natively using KaTeX integrations (`MathText`).

## Tech Stack

- **React 18**: Core UI library.
- **Vite**: Ultra-fast frontend build tooling and development server.
- **TypeScript**: Static typing for highly reliable, self-documenting code.
- **Tailwind CSS**: Utility-first CSS framework for rapid, responsive UI development.
- **Lucide React**: Modern iconography.
- **Framer Motion**: (motion/react) Used for subtle micro-interactions and transitions to provide a premium feel.
- **KaTeX / react-latex-next**: Specialized math and LaTeX rendering.

## Repository Structure

```
exam-engine-fe/
├── README.md                 # This file
├── index.html                # Vite entry point
├── package.json              # Project dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler configuration
├── server.ts                 # Express/Vite SSR Node Server (if applicable)
└── src/                      # Main source code directory
    ├── App.tsx               # Primary application routing, auth, and state manager
    ├── main.tsx              # React DOM mounting point
    ├── index.css             # Tailwind base and global CSS
    ├── types.ts              # TypeScript interfaces (Exam, Question, Session, etc.)
    ├── components/           # UI Components and Screens
    │   ├── AdminDashboardScreen.tsx   # Admin overview and statistics
    │   ├── DashboardScreen.tsx        # Student dashboard with diagnostic/recent tests
    │   ├── ExamScreen.tsx             # The actual testing simulation environment
    │   ├── ExamsListScreen.tsx        # Screen showing list of available exams
    │   ├── InstructionsScreen.tsx     # Exam guidelines shown before starting
    │   ├── LandingScreen.tsx          # Marketing/Onboarding landing page
    │   ├── LoginScreen.tsx            # Authentication page
    │   ├── MathText.tsx               # Specialized component to parse LaTeX equations
    │   └── ReportScreen.tsx           # Detailed post-exam performance report & answer key
    └── data/                 # Static data definitions & configurations
        ├── examMetadata.ts            # Config for exam headers, auth tokens, etc.
        └── focusAreas.ts              # Predefined topical breakdown data
```

## Setup & Running Locally

1. **Install Dependencies:**
   Make sure you have Node.js installed. Then, from the `exam-engine-fe` directory:
   ```bash
   npm install
   ```

2. **Run Development Server:**
   This will spin up the Vite HMR server:
   ```bash
   npm run dev
   ```
   *The application typically runs at `http://localhost:5173`.*

3. **Build for Production:**
   To create an optimized production bundle:
   ```bash
   npm run build
   ```
   The bundled files will be generated in the `dist` folder.

## Integration Details

The frontend expects several backend services to be running to function properly (e.g. `auth-service` and `exam-engine`). 
- Auth tokens should be stored in `localStorage` under the key `auth_token`.
- Network calls (fetching exams, saving progress, pulling report data) heavily rely on endpoints at `http://localhost:8080/api/v1/` and `http://localhost:5001`.

## Key Components

- **`ExamScreen.tsx`**: The core simulation. It tracks answers, timers, question palette statuses, and calculates local time-spent per question.
- **`ReportScreen.tsx`**: Uses data from the `answer_sheet` and `/full` endpoints to dynamically piece together a student's performance compared against the official answer key, rendering step-by-step solutions for incorrect questions.
- **`App.tsx`**: Acts as the central orchestrator, managing global session states and gracefully handling exam submission flows (including out-of-time autosaves).

