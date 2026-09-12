# Socflow

Socflow is an open-source, database-driven society management and email operations platform designed for student chapters, clubs, and community organizations.

## ✨ Key Features
- **BYO SMTP Engine**: Send transactional and bulk emails directly using your Gmail App Passwords or custom SMTP configurations.
- **Dynamic Email Suite**: 8 fully customizable email templates (Announcements, Inductions, Interviews, Certificates, Selections, Rejections, Events, and Contact Responses) synchronized with Postgres DB.
- **Member & Induction Management**: Organize leads, applicants, recruitment stages, interviews, and event attendees.
- **Role-Based Access Control**: Secure permission levels for admins, leads, and event managers.
- **Modern Tech Stack**: Next.js (App Router), React 18, Drizzle ORM, PostgreSQL, Tailwind CSS, Framer Motion, Radix UI, Zustand, and React Email.

## 🚀 Getting Started

### 1. Install Dependencies
```bash
bun install
# or
npm install
```

### 2. Environment Variables
Configure `.env` with your database and Supabase credentials:
```env
# PostgreSQL database connection (Drizzle ORM)
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:6543/postgres"

# Supabase Auth configuration
NEXT_PUBLIC_SUPABASE_URL="https://[YOUR-PROJECT].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[YOUR-ANON-KEY]"
```

### 3. Database Management (Drizzle ORM)
```bash
# Push schema changes to database
bun run db:push

# Generate migrations
bun run db:generate

# Open Drizzle Studio database UI
bun run db:studio
```

### 4. Start Development Server
```bash
bun run dev
```

### 5. Build for Production
```bash
bun run build
```

### 6. Code Quality & Type Checking
```bash
# Type check TypeScript
bun run typecheck

# Lint source files
bun run lint

# Clean build artifacts
bun run clean
```

## 📄 License
MIT
