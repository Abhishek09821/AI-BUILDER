# ApplyMate — AI-Assisted Job Application Workspace

> **Product Promise:** Create your career profile once. Tailor a reliable resume and cover letter for each target job without repeatedly rewriting documents or damaging their formatting.

---

## 1. Executive Summary & Philosophy

ApplyMate is a job-application workspace designed to eliminate the friction, hallucination risks, and formatting corruption common in one-click resume tools.

### Core Principles
1. **One Profile, Many Applications:** Users maintain one source of truth (**Master Career Profile**) and generate role-specific versions without overwriting it.
2. **Human Approval First:** AI suggestions are never silently treated as verified facts. Every suggestion can be **Accepted**, **Rejected**, or **Edited** independently.
3. **Deterministic Document Formatting:** Content updates never alter template typography, CSS tokens, margins, or page geometry. Documents are stored as a semantic data model separate from the visual template renderer.
4. **Evidence-Backed Writing:** AI suggestions strictly map to factual evidence IDs from the user's profile. Fact provenance is validated server-side to prevent hallucinations.
5. **Transparent Heuristic Matching:** Explains why a skill is relevant with honest classification (*Strong Evidence*, *Partial Evidence*, *Not Present in Profile*). Never promises guaranteed ATS passage or interview offers.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 18, Vite, JavaScript | Fast, modular, interactive single-page application |
| **Styling** | Tailwind CSS | SaaS design system with brand purple tokens and responsive layouts |
| **Backend API** | Python Flask, Flask-CORS, SQLAlchemy | RESTful endpoints, ownership verification, business logic |
| **Database** | PostgreSQL (or SQLite fallback) | Structured storage for profiles, jobs, versions, tracker, exports |
| **Document Processing** | `python-docx` | DOCX import parsing & styled DOCX exports with hyperlinks |
| **PDF Engine** | `pypdf`, `reportlab` | Best-effort PDF extraction & selectable-text PDF rendering |
| **AI Adapter** | Provider-Agnostic LLM Adapter | Gemini API, OpenAI API, or smart rule-based mock engine |
| **Security** | JWT (`pyjwt`), `bcrypt` | Secure password hashing, token validation, ownership checks on every route |

---

## 3. Brand Design System

ApplyMate features a modern, approachable SaaS aesthetic:
- **Primary Brand Purple:** `#6D4AFF` (main buttons, active navigation, links)
- **Primary Dark Purple:** `#5035C8` (hover and active states)
- **Lavender Surface:** `#F3F0FF` (selected cards, badges, soft panels)
- **Pink Accent:** `#F3A6C7` (accent badges, highlighted metrics)
- **Soft Pink Surface:** `#FFF0F6` (accent backgrounds)
- **Surface White:** `#FFFFFF` (cards, editor panels, preview canvas)
- **Text Primary:** `#27233A` (high-contrast body text & headers)
- **Border:** `#E8E4F0` (subtle dividers and card outlines)

---

## 4. End-to-End P0 User Journey

```mermaid
flowchart LR
    A[Sign Up / Login] --> B[Master Career Profile]
    B -->|Import DOCX/PDF or Manual| C[Staged Review & Verification]
    C --> D[Add Target Job]
    D -->|Pasted JD or Public URL| E[Requirement Extraction & Match]
    E --> F[Generate Tailored Draft]
    F --> G[3-Panel Resume Editor]
    G -->|Accept / Reject / Edit Suggestions| H[Live Preview & Autosave]
    H --> I[Export PDF & DOCX]
    H --> J[Draft Cover Letter]
    I --> K[Application Tracker]
    J --> K
```

1. **Authentication & Workspace Isolation:** Complete signup, login, session validation, and strict database ownership checks.
2. **Master Career Profile:** Structured records for contact details, summary, categorized skills (Languages, Frameworks, Databases, Tools), work experience, projects, education, and hyperlinks.
3. **Resume Import Flow:** Drop a `.docx` or `.pdf` file. Extracted facts are staged in a review screen before committing to your Master Profile.
4. **Job Input & Intelligence:** Paste any target job description (or use best-effort public URL fetch). Analyzes seniority clues, required/preferred skills, responsibilities, and recurring keywords.
5. **Evidence-Based Matching:** Classifies requirements into *Strong Evidence*, *Partial Evidence*, or *Not Present in Profile*, providing an honest alignment heuristic.
6. **Tailored Resume Generation:** AI returns structured suggestions tied strictly to verified `ProfileFact` IDs. Invalid fact IDs are rejected server-side.
7. **Desktop 3-Panel Editor:**
   - **Left Panel:** Section reordering (up/down), section visibility toggles, template switcher (*Modern ATS* vs. *Clean Professional*), version history snapshot & restore, export buttons.
   - **Centre Panel:** Semantic field editor (inline contact edit, summary textarea, skills chips, bullet points).
   - **Right Panel:** Live template page preview with zoom scaling & collapsible AI suggestion diff review cards.
8. **Cover Letter Generator & Editor:** Job-specific drafts with tone selection (*Professional*, *Confident*, *Concise*), length options (*Short*, *Standard*), paragraph-level editing, and PDF/DOCX exports.
9. **Document Exports:** Selectable-text PDF and fully editable DOCX with active hyperlinks.
10. **Application Tracker:** Kanban board and table list tracking roles through `Draft`, `Ready to apply`, `Applied`, `Assessment`, `Interview`, `Offer`, `Rejected`, and `Withdrawn`.

---

## 5. Quickstart Guide

### Prerequisites
- Node.js (v18+) and npm
- Python (v3.10+)
- PostgreSQL (or local SQLite)

### 1. Backend Setup
```bash
# Navigate to project root and activate virtualenv
source venv/bin/activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Configure environment variables
cp ../.env.example .env

# Run unit and export tests
PYTHONPATH=. pytest -v

# Start the Flask API server (runs on port 5001)
python run.py
```

### 2. Frontend Setup
```bash
# In a separate terminal, navigate to frontend/
cd frontend

# Install dependencies (already installed if cloned)
npm install

# Start Vite dev server (runs on http://localhost:5173 with API proxy)
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 6. Testing & Quality Verification

To run backend API and document export tests:
```bash
source venv/bin/activate
cd backend
PYTHONPATH=. pytest -v
```

The test suite covers:
- **`test_api.py`:**
  - Health check endpoint
  - User registration, login, token authentication, and route isolation
  - Career profile & fact CRUD with ownership checks
  - Job description parsing & evidence-based requirement matching
  - Tailored resume draft generation and AI suggestion review (Accept/Reject/Edit)
  - PDF & DOCX export generation for resumes and cover letters
- **`test_export_fixtures.py`:**
  - Multi-page and single-page resumes
  - Fresher candidate without full-time experience
  - Experienced candidate with accented European characters (`Hélène Müller-Dvořák`)
  - Long project names and ultra-long URLs
  - Selectable text PDF and editable DOCX verification

