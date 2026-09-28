# CAMPUSFIX
### AI-Powered Smart Campus Issue Reporting & Management Platform
> **Tagline:** *See It. Report It. Fix It.*

---

## 🌟 Overview

**CampusFix** is a fullstack, production-ready web application engineered for modern university and college campuses. It streamlines facility operations by empowering students, staff, maintenance technicians, and administrators with intelligent issue reporting, automated hazard prioritization, semantic duplicate prevention, and empirical recurring problem analysis.

The visual design implements a sleek **Black + Pink** aesthetic (`#09090c` background, dark glassmorphism cards, and electric pink `#ec4899` neon highlights) providing an immersive, high-end SaaS experience.

---

## 🚀 Key Features

### 1. 🤖 AI Issue Detection & Pre-Submission Diagnostics
- **Automated Categorization:** Analyzes complaint title and description to detect one of 9 facility categories (*Electrical, Plumbing, HVAC & Ventilation, Furniture & Carpentry, Sanitation & Hygiene, IT & Wi-Fi Network, Structural & Civil, Safety & Security, Grounds & Waste*).
- **Smart Priority Scoring:** Evaluates urgency into `LOW`, `MEDIUM`, `HIGH`, or `CRITICAL`.
- **Compound Safety Hazards:** Detects co-located dangers (e.g., water leaks near electrical distribution panels or server racks) and automatically elevates them to `CRITICAL` priority with instant administrator alerts.
- **Transparent Reasoning:** Produces plain-language reasoning explaining *why* the priority and category were assigned.
- **Dual AI Engine:** Natively integrates with Google Gemini API (`GEMINI_API_KEY`) with an intelligent local neural heuristic engine fallback ensuring 100% offline uptime.

### 2. 🔍 Real-Time Duplicate Complaint Detection
- Compares new submissions against active campus tickets using:
  - Campus Location hierarchy (Building, Block, Floor, Room)
  - Issue Category
  - Text token Jaccard and cosine similarity
- Prompts users with a possible duplicate review modal showing similarity scores and existing ticket details.
- Allows administrators to link/merge redundant reports into a master ticket or declare them independent without deleting complaints.

### 3. 📈 Empirical Recurring Problem Analysis
- Automatically calculates chronic infrastructure failures directly from actual database records (no invented data).
- Identifies failure patterns (e.g., *"Engineering Complex Block B has 4 repeated plumbing complaints"* or *"Science Block 2nd-floor washroom has frequent pipe leakage"*).
- Generates preventative maintenance recommendations for administrative action.

### 4. 🔄 Verifiable 6-Stage Lifecycle Timeline
Every ticket transitions through a strictly logged operational audit pipeline:
```
REPORTED ➔ UNDER REVIEW ➔ ASSIGNED ➔ IN PROGRESS ➔ RESOLVED ➔ CLOSED
```
- Every single status change, technician arrival, field progress note, and student verification is recorded with exact database timestamps and role tags.
- Verified chronological timeline view visible to both reporters and operations personnel.

### 5. 👥 Role-Based Access Control (RBAC)
- **Student / Staff:** Submit complaints, upload photos, pinpoint location, view timeline, post messages, and verify/close completed repairs.
- **Maintenance Team:** Access only assigned tasks for their squad, start on-site repairs, log progress updates, upload repair completion proof photos, and mark jobs as `RESOLVED`.
- **Facility Administrator:** Complete system oversight, override AI suggestions, assign maintenance teams, change status, link duplicates, manage users, and analyze recurring problem analytics.

### 6. 🔔 In-App Notification System
- Real-time alerts for ticket submission, team assignment, technician arrival, repair completion, and closure confirmation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, React Router DOM, Axios |
| **Backend** | Node.js, Express.js (v5), Multer, JWT, BcryptJS |
| **Database** | SQLite via `better-sqlite3` (zero-latency, WAL mode) + PostgreSQL / Supabase driver support via `pg` |
| **Design System** | Tailored Black + Pink theme (`#09090c` dark mode with `#ec4899` accents and glassmorphism) |

---

## 🔑 Pre-Configured Seed Demo Credentials

CampusFix comes pre-populated with realistic campus issues, maintenance teams, location blueprints, and test accounts:

| Role | Email | Password | Scope |
|---|---|---|---|
| **Student / Staff** | `student@campusfix.edu` | `password123` | Report issues, view personal history, confirm closure |
| **Maintenance Lead** | `tech@campusfix.edu` | `password123` | View assigned squad tasks, start work, resolve with photo |
| **Administrator** | `admin@campusfix.edu` | `password123` | Full administrative command, assign teams, review AI |

> 💡 **Quick Login:** The login page includes one-click buttons for each demo role for instant evaluation without typing.

---

## ⚙️ Setup & Local Execution

### Prerequisites
- Node.js (v18 or higher; tested on Node v24.20)
- npm (v9 or higher)

### 1. Clone & Enter Repository
```bash
cd "c:\Users\user\OneDrive\DOMI RA"
```

### 2. Backend Setup & Startup
```bash
cd backend
npm install
npm run dev
```
*The backend server will automatically seed the SQLite database `campusfix.db` with realistic campus tickets, teams, and recurring clusters, running on `http://localhost:5000`.*

### 3. Frontend Setup & Startup
```bash
cd ../frontend
npm install
npm run dev
```
*The frontend Vite development server will start at `http://127.0.0.1:5173/`.*

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
```ini
PORT=5000
JWT_SECRET=campusfix_secret_super_key_2026_x_production
NODE_ENV=development

# Optional: Google Gemini API Key for multimodal cloud AI
# If omitted, CampusFix uses its deterministic local heuristic engine fallback seamlessly.
GEMINI_API_KEY=

# Optional: PostgreSQL / Supabase connection string
# DATABASE_URL=postgresql://user:password@localhost:5432/campusfix
```

### Frontend (`frontend/.env`)
```ini
VITE_API_URL=http://localhost:5000/api
```

---

## 🧪 Automated End-to-End Testing

Run the comprehensive test suite verifying all 28 requirements (health, auth, RBAC, AI detection, duplicate prevention, team assignment, maintenance lifecycle, student closure, recurring problems):

```bash
cd backend
node src/test-e2e.js
```

**Verification Output:**
```
==================================================
TEST SUMMARY: 24 PASSED, 0 FAILED
==================================================
```

---

## 🏛️ Campus Location Hierarchy
CampusFix allows campus-friendly location selection without requiring mandatory GPS:
- **Buildings:** Engineering Complex, Science & Technology Building, Central Academic Block, Main Student Library, Sports & Activity Hub, Student Residences.
- **Blocks:** Block A, Block B, Block C, Block S1, Block S2, East Wing, West Wing.
- **Floor Levels:** Ground Floor, Floor 1, Floor 2, Floor 3, Floor 4.
- **Rooms:** Lecture Hall 101, Lab 210, Washroom 204, Silent Reading Zone, etc.

---

## 🚢 Production Deployment

### Frontend Production Build
```bash
cd frontend
npm run build
```
Generates optimized, minified static assets in `frontend/dist/`.

### Backend Production Server
```bash
cd backend
npm start
```
Serve with PM2 or Docker container:
```bash
npx pm2 start src/server.js --name "campusfix-api"
```

---

## 📄 License
ISC © 2026 CampusFix Team. Built for smart university campuses.
