# eHook Setup Guide

## Quick Start

Your webhook inspector is now fully implemented! Follow these steps to get it running:

### 1. Set up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database (choose any region)
3. Copy the **REST URL** and **REST TOKEN** from the database details

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

### 3. Run the Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

1. **Unique Webhook URL**: When you visit the site, a unique UUID is generated and stored in localStorage. Your webhook URL will be displayed at the top.

2. **Send Webhooks**: Copy your webhook URL and use it to send webhooks from any service or tool:
   ```bash
   curl -X POST http://localhost:3000/api/webhook/YOUR-UUID \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

3. **Real-time Updates**: All webhook events appear instantly in the Inbox sidebar on the left.

4. **Inspect Payloads**: Click any event in the Inbox to view the full details:
   - HTTP method
   - Headers
   - Query parameters
   - Body (with JSON syntax highlighting)

5. **Multi-tab Support**: Open multiple browser tabs with the same UUID - they all receive real-time updates.

## Features Implemented

- ✅ Unique webhook URLs per user (persisted in localStorage)
- ✅ Real-time event streaming with Upstash Realtime
- ✅ Accepts all HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)
- ✅ Collapseable Inbox sidebar with event list
- ✅ Message viewer with syntax-highlighted JSON
- ✅ Stores last 50 webhook events in Redis
- ✅ Connection status indicator
- ✅ Beautiful, responsive UI with shadcn components

## Project Structure

```
app/
  ├── actions/
  │   └── webhook.ts          # Server actions for fetching events
  ├── api/
  │   ├── realtime/
  │   │   └── route.ts        # SSE endpoint for real-time updates
  │   └── webhook/[uuid]/
  │       └── route.ts        # Webhook receiver (all HTTP methods)
  ├── components/
  │   ├── inbox.tsx           # Sidebar with event list
  │   ├── message-viewer.tsx  # Payload inspector
  │   └── webhook-url-display.tsx  # URL display with copy button
  └── page.tsx                # Main layout

lib/
  ├── redis.ts                # Redis client configuration
  └── realtime.ts             # Realtime schema and types

components/ui/                # shadcn components
```

## Testing

Test your webhook endpoint with curl:

```bash
# POST with JSON
curl -X POST http://localhost:3000/api/webhook/YOUR-UUID \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello eHook!"}'

# GET with query params
curl "http://localhost:3000/api/webhook/YOUR-UUID?foo=bar&test=123"

# PUT with form data
curl -X PUT http://localhost:3000/api/webhook/YOUR-UUID \
  -d "key1=value1&key2=value2"
```

## Deployment

For production deployment on Vercel:

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel project settings
4. Enable Fluid Compute in project settings (for cost-effective real-time connections)
5. Deploy!

Your webhook URLs will automatically use your production domain.

## Troubleshooting

**Build warnings about Redis credentials**: This is normal during build - the credentials are only needed at runtime.

**Events not appearing**: Check that your `.env.local` file has the correct Upstash Redis credentials.

**Multiple UUID in different browsers**: Each browser/device stores its own UUID in localStorage. To share a webhook URL, simply copy and paste it.

