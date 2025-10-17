This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## eHook - Webhook Inspector

A real-time webhook inspection tool that allows you to view and debug webhook payloads with a beautiful UI.

## Prerequisites

Before you begin, you'll need to set up an Upstash Redis database:

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Copy your database credentials

## Environment Variables

Create a `.env.local` file in the root directory and add your Upstash Redis credentials:

```bash
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

## Getting Started

First, install dependencies:

```bash
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Features

- **Unique Webhook URLs**: Each user gets a unique webhook URL that persists across sessions
- **Real-time Updates**: See webhook events appear instantly using Upstash Realtime
- **All HTTP Methods**: Accepts GET, POST, PUT, DELETE, PATCH, OPTIONS, and HEAD requests
- **Beautiful UI**: Built with shadcn/ui components and Tailwind CSS
- **Syntax Highlighting**: JSON payloads are displayed with syntax highlighting
- **History**: Last 50 webhook events are stored and can be reviewed
- **Multi-tab Support**: All tabs with the same UUID receive real-time updates

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
