# 🎓 GradAbroad — Complete Project Guide

---

## 🏠 Project Overview
GradAbroad is a modern web platform for students planning to study abroad. It helps users discover programs, track applications, manage expenses, and more—all powered by a Next.js frontend and Supabase backend.

---

## 📁 Folder & File Structure
- **config/** — Custom configuration and templates
- **public/** — Static assets (images, favicon, etc.)
- **src/** — Main source code
  - **app/** — Routing, layouts, and pages
  - **components/** — Reusable UI components
  - **dashboard/** — Dashboard-specific logic
  - **lib/** — Utility libraries and context
- **supabase/** — Backend config and migrations
- **Root files** — Project configs (package.json, etc.)

---

## 🖥️ Main Features & Sections

### 1. 🗂️ Browse Programs
- Explore a curated list of study-abroad programs.
- Filter and search for universities and courses.
- Add interesting programs to your shortlist.

### 2. 📋 Application Tracker
- Track your university applications in one place.
- Update statuses (applied, interview, accepted, etc.).
- Add notes and deadlines for each application.

### 3. 📊 Dashboard
Your personal hub with three main tools:

#### • ⭐ My Shortlist
- View and manage your favorite programs.
- Move programs from shortlist to tracker.

#### • 💸 Expense Calculator
- Estimate living and tuition expenses for different countries.
- Specialized calculator for Germany included.
- Export your expense breakdown as a PDF.

#### • 📈 My Tracker
- Visualize your application progress.
- See all tracked applications at a glance.

### 4. 👤 My Profile
- Manage your personal details and preferences.
- Update email, password, and profile info.

### 5. ⚙️ Settings
- Customize app settings (theme, notifications, etc.).

### 6. 🛠️ Developer Tools
- Import programs in bulk using CSV templates.
- Developer-only pages for testing and data import.

---

## 🔒 Authentication & User Management
- Secure sign-up, login, and password reset via Supabase Auth.
- User context managed globally for seamless experience.

---

## 🗄️ Backend (Supabase)
- **Database:** Stores users, programs, applications, expenses, etc.
- **Auth:** Handles user authentication and sessions.
- **Storage:** For any uploaded files (if enabled).
- **Migrations:** All schema changes tracked in `supabase/migrations/`.

---

## 🚀 Deployment & Setup
1. **Clone the repo**
2. **Install dependencies:** `npm install`
3. **Configure environment:** Copy `.env.example` to `.env.local` and fill in Supabase keys
4. **Run locally:** `npm run dev`
5. **Deploy:** Use Vercel, Netlify, or similar for frontend; Supabase is cloud-hosted

---

## ⚡ How Everything Works Together
- Users interact with the Next.js frontend (pages in `src/app/`)
- Data and auth requests go to Supabase (via `lib/supabaseClient.ts` and `lib/supabaseServer.ts`)
- UI is built from modular components (`src/components/`)
- Dashboard aggregates tools for a personalized experience
- All configuration and templates are organized for easy maintenance

---

## 📝 Notes
- All sections and features are modular—easy to extend or customize
- This guide is Notion-friendly: copy-paste directly, and emojis/colors will be preserved
- For PDF: Paste into Notion and export as PDF, or use a markdown-to-PDF tool

---

✨ Happy exploring and building with GradAbroad!