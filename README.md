# OpenMusabaqah - Quran Competition PWA

OpenMusabaqah is a high-performance, real-time Progressive Web App (PWA) designed for organizing and judging Quran competitions. It features a stunning turquoise and gold aesthetic and provides separate portals for participants, judges, and administrators.

## Features

- **Real-time Synchronization**: Live updates between the Judge and Participant portals using a central session state.
- **Bilingual Support**: Dynamic Quranic data with both English and Arabic Surah names.
- **Quran API Integration**: 
  - Dynamic Surah and Ayah selection (1-114 Surahs).
  - Live pulling of Arabic Ayah text.
  - Built-in audio recitations for judges.
- **Admin Dashboard**: Full CRUD (Create, Read, Update, Delete) management for Groups, Participants, and Questions.
- **Judge Interface**: interactive scoring with notes and real-time turn management.
- **Premium Leaderboard**: Animated results page with champion badging and high-speed ranking.
- **PWA Ready**: Installable on mobile and desktop devices for a native app experience.

## Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/)
- **Database**: PostgreSQL with [Prisma ORM](https://www.prisma.io/)
- **Styling**: Tailwind CSS with custom premium components.
- **API**: [Quran API](https://quranapi.pages.dev/) for dynamic religious content.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd OpenMusabaqah
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://postgres:admin@localhost:5432/openmusabaqah?schema=public"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Database Setup**:
   Run the following command to sync your database schema:
   ```bash
   npx prisma db push
   npx prisma generate
   ```
   *(Optional: Use `src/lib/sqlscript.txt` for manual table creation if preferred)*

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## Database Schema

The database consists of the following key models:
- **Group**: Competition categories or sessions.
- **Participant**: Contestants assigned to specific groups.
- **Question**: Specific Quranic sections for recitation with points and bilingual details.
- **Selection**: Tracks which participant has chosen which question.
- **Score**: Detailed judging points and notes.
- **SystemState**: Manages the "Live" state of the competition.

## License

This project is licensed under the MIT License.
