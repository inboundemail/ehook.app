## eHook - Webhook Inspector

A real-time webhook inspection tool that allows you to view and debug webhook payloads with a beautiful UI.

This project uses a Bun workspace monorepo structure:

- `packages/web/` - Next.js dashboard application
- `packages/cli/` - CLI tool

## Prerequisites

Before you begin, you'll need to set up:

### Upstash Redis & QStash

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Copy your Redis and QStash credentials

### Neon Postgres

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new Postgres database
3. Copy your connection string

## Environment Variables

Create a `.env.local` file in the `packages/web/` directory:

```bash
# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Upstash QStash
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# Neon Postgres Database
DATABASE_URL=postgres://user:password@host.neon.tech/ehook?sslmode=require
```

## Database Setup

Run database migrations:

```bash
cd packages/web
bun run db:push  # Push schema to database
```

Other database commands:

- `bun run db:generate` - Generate migrations from schema changes
- `bun run db:migrate` - Run migrations
- `bun run db:studio` - Open Drizzle Studio to browse data

## Getting Started

Install dependencies from the root:

```bash
bun install
```

Run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Unique Webhook URLs**: Each user gets a unique webhook URL that persists across sessions
- **Real-time Updates**: See webhook events appear instantly using Upstash Realtime
- **All HTTP Methods**: Accepts GET, POST, PUT, DELETE, PATCH, OPTIONS, and HEAD requests
- **Temporary Email Testing**: Inspect webhook payloads generated from temporary/disposable email addresses
- **Beautiful UI**: Built with shadcn/ui components and Tailwind CSS
- **Syntax Highlighting**: JSON payloads are displayed with syntax highlighting
- **History**: Last 50 webhook events are stored and can be reviewed
- **Multi-tab Support**: All tabs with the same UUID receive real-time updates
- **Workflows**: Visual workflow builder with triggers (Manual, Schedule, Webhook) and actions (HTTP Request, Send Email). Powered by Vercel Workflows for durability and execution tracking

## Tech Stack

- Next.js 15 with App Router
- Bun workspace monorepo
- Upstash Redis, QStash, & Realtime
- Neon Postgres + Drizzle ORM
- shadcn/ui + Tailwind CSS
- TypeScript
