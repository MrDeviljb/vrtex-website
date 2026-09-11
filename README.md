# VRTEX ESPORTS - Production BGMI Tournament Platform

Vrtex Esports is an original, production-ready BGMI (Battlegrounds Mobile India) competitive tournament and scrim platform featuring an authentic esports aesthetic, server-side ALUU BGMI UID verification, automated time-locked custom room credential distribution, configurable tournament scoring rules, roster management, and a dedicated secure administration dashboard with RBAC.

---

## 🚀 Key Features

### 1. Public Player Website
- **Hero & Command Center (`/`)**: "DOMINATE THE BATTLEGROUND", live countdown timers, featured tournaments, live scrims, dynamic platform metrics, "How It Works", hall of fame winners, and Krafton compliance disclaimer.
- **Tournament Directory (`/tournaments`)**: Rich cards with prize pool, slot counters, start times, mode, map, fee type, search bar, and filters (All, Live, Registration Open, Upcoming, Completed, Free, Paid).
- **Tournament Detail Page (`/tournament/[slug]`)**: Tabbed navigation (**Overview**, **Matches**, **Teams**, **Leaderboard**, **Rules**), 7-step tournament timeline, prize pool breakdown, and dynamic squad registration.
- **Automated Custom Room Distribution**: Server-side enforced time-locks. Rooms remain strictly locked before release time. Once released, verified captains receive **Room ID** and **Password** with 1-click large copy buttons.
- **Dedicated Scrims Hub (`/scrims`)**: Daily practice lobbies for competitive squads.
- **Official Leaderboard (`/leaderboard`)**: Real-time standings by Overall, Weekly, or Monthly, featuring a 3-tier podium (1st, 2nd, 3rd) and detailed stats (Matches, WWCD, Kills, Placement Points, Kill Points, Total Points).
- **Teams & Squad Rosters (`/teams`, `/my-team`)**: Create squads, generate invite codes (`ALPHA-2026`), accept invites, assign Captain / Player / Substitute roles, and transfer captaincy.
- **Verified Players Hub (`/players`)**: Directory of players with authenticated BGMI identities and career statistics.
- **Official Esports Rulebook (`/rules`)**: Device integrity rules, zero-emulator policy, anti-teaming, disconnect guidelines, and prize policies.
- **FAQ Accordion (`/faq`)**: Instant answers to common registration, scoring, and payout questions.
- **Support & Disputes (`/support`)**: Ticket management system categorized by Payment, Registration, Room Access, and Match Results with live conversation threads.

### 2. Live BGMI UID Verification
- **ALUU Backend Proxy (`GET /api/player?uid=BGMI_UID`)**: Queries `https://aluu.in/api/check/bgmi` securely from the backend. The `ALUU_API_KEY` is **never** exposed to client browsers.
- **Debounce**: 600ms input debounce ensures queries are made only after the user stops typing.
- **States**: `IDLE` ("Add BGMI User ID"), `LOADING` ("Verifying BGMI account..."), `SUCCESS` ("✓ VERIFIED PLAYER"), `ERROR` ("BGMI player not found.").
- **Player Profile Card**: Displays authentic player avatar placeholder, verified IGN, account status, and strictly "Not available" for unprovided data (no fabricated ranks or logins).

### 3. Secure Admin Panel (`/admin`)
- **Protected RBAC**: Role-based access control supporting `SUPER_ADMIN`, `TOURNAMENT_ADMIN`, `MODERATOR`, and `FINANCE_ADMIN`.
- **Operations Dashboard (`/admin`)**: Real-time KPIs for Total Users, Squads, Live Tournaments, Scrims, Pending Registrations, and Total Prize Pool.
- **Tournament & Scrim Manager (`/admin/tournaments`)**: Full CRUD with configurable max teams, prize distribution, mode (Solo/Duo/Squad), perspective (TPP/FPP), and dates.
- **Custom Room Panel (`/admin/rooms`)**: Set Room ID, Room Password, and release time. Includes `[RELEASE NOW]` with confirmation modal dialog and `[HIDE]` toggle.
- **Registration Approvals (`/admin/registrations`)**: Table of registered teams with Approve, Reject, and Disqualify actions.
- **Match & Results Referee Scoring (`/admin/matches`)**: Input placements and kills per team with automated point calculation according to the tournament's configurable scoring rules.
- **Prize Disbursements (`/admin/prizes`)**: Track payouts (PENDING, PROCESSING, PAID, FAILED), record transaction IDs (UPI/IMPS), and add audit notes.
- **User Moderation (`/admin/users`)**: Search accounts, view verified UIDs, suspend/ban users, and assign roles. Super Admin accounts are protected from non-super admins.
- **Operational Audit Log (`/admin/audit-logs`)**: Immutable log tracking admin actions with timestamps.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React icons, custom gaming dark theme (`#080a0f`, neon green `#00ff88`, emerald `#10b981`)
- **Database & ORM**: Prisma ORM with SQLite for zero-friction local execution (fully swappable to PostgreSQL)
- **Authentication**: Secure password hashing with `bcryptjs` and HTTP-only JWT session cookies
- **API Integration**: Official ALUU BGMI Name Checker

---

## ⚡ Quick Start Instructions

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment Variables
Verify `.env` has the following variables:
\`\`\`env
DATABASE_URL="file:./dev.db"
JWT_SECRET="vortex_super_secret_jwt_key_2026_bgmi_esports_production"
ALUU_API_KEY="ak_live_f92daf60f9c5d05e6d6019a70c17a64263dc4caca3785428b7394e9ae8c815d0"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
\`\`\`

### 3. Generate Database & Seed Data
\`\`\`bash
npx prisma generate
npx prisma db push
npm run prisma:seed
\`\`\`

### 4. Start Development Server
\`\`\`bash
npm run dev
\`\`\`
Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Pre-Seeded Default Accounts

| Account Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@vortexesports.com` | `Admin@12345` | Full system access to `/admin` |
| **Tournament Admin** | `staff@vortexesports.com` | `Staff@12345` | Match referee & room release controls |
| **Player (Captain)** | `player@vortexesports.com` | `Player@12345` | Verified BGMI UID: `55622232685` (`『KAGEYAMMA』`) |

---

## 🛡️ Fair Play & Compliance Note
*This platform is an independent esports tournament service and is not affiliated with or endorsed by KRAFTON or BGMI.*
