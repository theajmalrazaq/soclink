# Socflow

Socflow is an open-source, database-driven society management and email operations platform designed for student chapters, clubs, and community organizations.

For website integrations and the complete HTTP endpoint reference, see [CRM API documentation](docs/API.md).

## ✨ Key Features
- **SMTP Engine**: Send transactional and bulk emails using sender credentials in Settings and server-managed SMTP transport settings.
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

# Optional server-managed SMTP transport (defaults to Gmail on port 465)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="465"
SMTP_SECURE="true"

# Server-only key used to encrypt the GroqCloud credential in app_settings
SETTINGS_ENCRYPTION_KEY="[64-HEX-CHARACTERS]"
# Optional fallback if a key is not saved through Settings
GROQ_API_KEY="[YOUR-GROQ-API-KEY]"
GROQ_MODEL="openai/gpt-oss-20b"
```

The dashboard assistant prepares editable event, competition, lead category, and lead member drafts.
It writes event and competition descriptions from the details you provide, asks for missing essentials,
and creates a record only after you confirm the draft. Generate `SETTINGS_ENCRYPTION_KEY`
with `openssl rand -hex 32` and set it on every server instance. In **Settings → GroqCloud API**,
paste the GroqCloud key and save it. The key is encrypted with AES-256-GCM in `app_settings`;
the settings API returns only its status. Use **Test API** to check an entered key before
saving it, or to check the saved key. Keep the encryption key stable across deployments,
or saved credentials cannot be decrypted. `GROQ_API_KEY` remains an optional server-only fallback.
Never use a `NEXT_PUBLIC_` prefix for either key.

### 3. Database Management (Drizzle ORM)

The first verified signup initializes the administrator account when the
`users` table is empty. Later users must be created by an administrator.
API requests require a Supabase access token and use the database permissions
assigned to that account.

Run `bun run db:migrate` before deleting users. The auth deletion migration
removes the matching app account when a user is deleted in Supabase or in the
app. Because events, members, and settings are shared across the installation,
they are cleared only when the last Auth-backed app account is deleted. A new
signup can then initialize a fresh installation. Deleting one of several users
keeps shared data for the remaining accounts.
The migrations also remove the old `on_auth_user_created` trigger, which created
a restricted app account before the first signup could initialize the admin.

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
