# GradAbroad Project Documentation

---

## 1. Project Overview
GradAbroad is a web application built with Next.js for students planning to study abroad. It features program browsing, application tracking, expense calculators, and user management, with Supabase as the backend for authentication and data storage.

---

## 2. Folder & File Structure

```
/ (root)
│
├── config/                  # Custom configuration and templates
│   └── templates/
│       └── programs_import_template.csv
│
├── public/                  # Static assets (images, favicon, etc.)
│   └── favicon-meta.html
│   └── ...
│
├── src/                     # Main source code
│   ├── app/                 # Next.js app directory (routing, layouts)
│   │   ├── application-tracker/
│   │   ├── auth/
│   │   ├── browse-programs/
│   │   ├── dashboard/
│   │   ├── dev/
│   │   ├── my-profile/
│   │   ├── settings/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/          # Reusable UI components
│   │   ├── forms/
│   │   ├── AuthPanel.tsx
│   │   ├── DevCsvImport.tsx
│   │   ├── FeedbackBox.tsx
│   │   ├── Header.tsx
│   │   ├── ProgramList.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── ThemeToggle.tsx
│   │
│   ├── dashboard/           # Dashboard-specific components/utilities
│   │   ├── ExpenseCalculator.tsx
│   │   ├── GermanyLivingExpenseCalculator.tsx
│   │   ├── exportExpensesToPDF.ts
│   │   └── page.tsx
│   │
│   ├── lib/                 # Utility libraries and context
│   │   ├── supabaseClient.ts
│   │   ├── supabaseServer.ts
│   │   └── UserContext.tsx
│   │
│   └── proxy.ts             # Proxy utility (if used)
│
├── supabase/                # Supabase backend config and migrations
│   ├── config.toml
│   ├── schema.sql
│   └── migrations/
│       └── ...
│
├── .env.example             # Example environment variables
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json
└── ...
```

---

## 3. Frontend (Next.js)
- **Framework:** Next.js (App Router)
- **Styling:** CSS (globals.css), can use Tailwind/PostCSS if configured
- **Components:** Modular, reusable React components in `src/components/`
- **Pages & Routing:** Handled via `src/app/` (nested folders = routes)
- **State Management:** React Context (see `lib/UserContext.tsx`)

---

## 4. Backend (Supabase)
- **Supabase** is used for authentication, database, and storage.
- **Config:** All Supabase config and migrations are in `/supabase/`
- **Client Usage:**
  - `lib/supabaseClient.ts` for client-side
  - `lib/supabaseServer.ts` for server-side
- **Environment Variables:**
  - Set Supabase keys in `.env.local` (see `.env.example`)
- **Schema:** Defined in `supabase/schema.sql` and migrations

---

## 5. Deployment
- **Frontend:** Deploy on Vercel, Netlify, or any Node.js-compatible host
- **Backend:** Supabase is cloud-hosted (no deployment needed unless self-hosting)
- **Environment Setup:**
  - Copy `.env.example` to `.env.local` and fill in secrets
  - Install dependencies: `npm install`
  - Run locally: `npm run dev`
- **Build:** `npm run build`
- **Export:** (if using static export) `npm run export`

---

## 6. Environment & Configuration
- **.env.local:** Local secrets (never commit)
- **.env.example:** Template for required env vars
- **Config files:** All major configs at root for tool compatibility
- **Custom templates:** In `config/templates/`

---

## 7. How Everything Works Together
- **User visits site:** Next.js serves pages from `src/app/`
- **Authentication:** Handled via Supabase (see `lib/supabaseClient.ts`)
- **Data:** Fetched from Supabase tables (schema in `supabase/schema.sql`)
- **UI:** Built from modular components in `src/components/`
- **Dashboard & Tools:** Specialized logic/components in `src/dashboard/`
- **Custom Imports:** Use templates in `config/templates/` for bulk data

---

## 8. Useful Commands
- `npm install` — Install dependencies
- `npm run dev` — Start local dev server
- `npm run build` — Build for production
- `npm run lint` — Lint code

---

## 9. Additional Notes
- **Supabase CLI:** Use for local dev/migrations if needed
- **Updating Structure:** Keep config files at root unless tools are reconfigured
- **Documentation:** Update this note as the project evolves

---

*This document is Notion-friendly. You can copy-paste it into Notion, or export as PDF from Notion or using markdown-to-pdf tools.*
