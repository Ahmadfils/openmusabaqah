# OpenMusabaqa – Quran Competition Platform

<p align="center">
  <img src="public/icons/openMusabaqa-logo.svg" alt="OpenMusabaqa Logo" width="140" height="140" />
</p>

<p align="center">
  <strong>An open-source, high-performance, real-time platform for organizing, managing, and judging Quran competitions worldwide.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#auth-flow--governance">Auth Flow</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> 
</p>

---

## Overview

**OpenMusabaqa** is an all-in-one ecosystem designed for Quran competition organizers, scholars, judges, contestants, and audiences. Built with a signature turquoise and gold aesthetic inspired by Islamic calligraphy and geometric art, the platform combines a public-facing discovery portal, a dynamic Content Management System (CMS), real-time synchronization between judges and participants, and high-deliverability email communication.

---

## Features

### 1. Public-Facing Web Portal (`/apps/web`)
A modern, responsive landing page offering complete public engagement:
- **Hero & Portal Accessibility**: Immediate access to the Judge, Participant, and Results portals.
- **Vision & Milestones**: Interactive timeline detailing the platform's mission and future roadmap.
- **Dynamic Statistics**: Live metrics displaying hosted competitions, reciters scored, questions generated, and partner organizations.
- **Testimonies**: Verified statements from international Quran judges, scholars, and organizers.
- **Founders & Leadership Team**: Profiles and bios for the 3 founding members.
- **Media Gallery**: High-resolution photography of ceremonies, stages, and reciters.
- **Partners & Sponsors**: Tiered showcase of supporting Islamic institutions and sponsors.
- **Call-to-Action (CTA)**: Dedicated engagement blocks for donors, sponsors, and academic partners.
- **Newsletter**: One-click subscription synced directly with Brevo contact lists.
- **Public Competitions List**: Searchable and filterable directory of active, upcoming, and past competitions.
- **Public Leaderboards**: Live or finalized verified scores with medal rankings and detailed breakdowns.
- **Organization Registration**: Self-service onboarding form for institutions requesting competition hosting.

### 2. Super-Admin Console & CMS (`/apps/admin`)
A mission control center for administrators:
- **Content Management System (CMS)**: Full CRUD management to customize and reorder all landing page sections without code changes.
- **Organization & Competition Governance**: Approve organization registrations, configure competitions, and manage access privileges.
- **Public/Private Toggle**: **Strictly restricted to Administrators** to ensure sensitive or internal rounds remain confidential until official publication.
- **User Directory**: Central management of Super-Admins, Organization Admins, and Judges.
- **Email Communication Center**: Broadcast bulk announcements with Brevo or send targeted transactional emails to specific judges or contestants.

### 3. Real-Time Competition Engine (`/judge`, `/participant`, `/results`)
- **Instant Synchronization**: Server-Sent Events (SSE) and live state synchronization between participant picks, judge screens, and presentation displays.
- **Bilingual Surah & Ayah Engine**: Integrated with Quran APIs for 114 Surahs, dynamic Arabic calligraphy, verse bounds, and recitation audio for judges.
- **Interactive Scoring**: Numeric scoring alongside freeform qualitative observations and tajweed criteria.
- **PWA Ready**: Offline-capable and installable across mobile, tablet, and desktop devices.

---

## Auth Flow & Governance

The platform follows a secure role-based hierarchy to ensure organizational sovereignty:

```
[ Organization Registers ] ──> [ Email Verification (Resend/Nodemailer) ]
                                          │
                                          ▼
                                [ Admin Setup Profile ]
                                          │
                                          ▼
                             [ Admin Login with Username ]
                                          │
                       ┌──────────────────┴──────────────────┐
                       ▼                                     ▼
             [ Creates Judges ]                     [ Competition Controls ]
             - Generates Username                   - Toggle Public/Private
             - Credentials emailed                    (Admin exclusive)
                       │
                       ▼
          [ Judge Login with Username ]
                       │
                       ▼
      [ Judges Create & Manage Resources ]
      - Question Batches (Surahs & Ayahs)
      - Enrolled Participants
      - Scoring & Evaluation
```

1. **Organization Registration**: Institutions register on the public portal.
2. **Email Verification**: A one-time verification link is dispatched via Resend / Nodemailer.
3. **Admin Setup**: Upon email confirmation, the Organization Admin configures their profile and username.
4. **Admin Login**: Admins authenticate using their chosen username and secure password.
5. **Judge Provisioning**: Admins generate judge profiles with assigned usernames and secure credentials.
6. **Judge Login & Operation**: Judges authenticate with their username to build question batches, configure questions, manage participants, and record scores.
7. **Privacy Enforcement**: **Only Admins** hold the authority to toggle a competition between Public and Private status.

---

## Email Infrastructure

OpenMusabaqa employs a dual-provider email strategy:
- **Transactional (Resend / Nodemailer)**: High-speed delivery for organization email verifications, password resets, and judge credential invitations.
- **Bulk Communications (Brevo)**: Scalable delivery for newsletter subscribers, mass participant announcements, and competition results bulletins.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15+ / 16 (App Router)](https://nextjs.org/) & React 19 |
| **Database & ORM** | PostgreSQL with [Prisma ORM](https://www.prisma.io/) |
| **Styling** | Tailwind CSS with custom Islamic gold & turquoise design system |
| **Icons** | Lucide React & Custom SVG Calligraphy |
| **Transactional Email**| Resend / Nodemailer |
| **Bulk Email & Marketing**| Brevo (Sendinblue API) |
| **Quran Content API** | Dynamic integration with [Quran API](https://quranapi.pages.dev/) |
| **App Delivery** | Progressive Web App (PWA) with installable service workers |

---

## Getting Started

### Prerequisites
- **Node.js** 18.x or 20.x+
- **PostgreSQL** database instance (local or hosted e.g., Supabase / Neon)
- Resend / Brevo API credentials (for email features)

### 1. Clone & Install
```bash
git clone https://github.com/your-org/openmusabaqa.git
cd openmusabaqa
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database Connections
DATABASE_URL="postgresql://postgres:password@localhost:5432/openmusabaqa?schema=public"
DIRECT_URL="postgresql://postgres:password@localhost:5432/openmusabaqa?schema=public"

# Application URL & Security
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="your-super-secret-jwt-key"

# Transactional Email (Resend or SMTP)
RESEND_API_KEY="re_123456789"
EMAIL_FROM="noreply@openmusabaqa.com"

# Bulk Email & Newsletter (Brevo)
BREVO_API_KEY="xkeysib-123456789"
BREVO_NEWSLETTER_LIST_ID="2"
```

### 3. Database Synchronization
Run Prisma migrations to generate the database schema and client:
```bash
npx prisma db push
npx prisma generate
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the portal.

---

## Project Structure

```
.
├── CHANGES_PLAN.md       # Comprehensive transformation and implementation plan
├── prisma/               # Prisma schema and migrations
├── public/               # Static assets, branding, and PWA icons
├── src/
│   ├── app/
│   │   ├── admin/        # Admin portal & CMS views
│   │   ├── api/          # REST endpoints (judging, state, questions, emails)
│   │   ├── judge/        # Judge scoring & batch management interface
│   │   ├── participant/  # Participant question selection portal
│   │   └── results/      # Public live standings & leaderboard
│   └── lib/              # Prisma client, state management, utilities
└── README.md
```

---

## License

This project is licensed under the **MIT License**.
