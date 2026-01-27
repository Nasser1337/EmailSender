# Deployment Guide

Complete guide for deploying the Outreach System to production.

## Prerequisites

- Node.js 18+ installed on server
- PostgreSQL database
- Domain name with SSL certificate
- Resend account with verified domain

## SiteGround Deployment

### Step 1: Prepare Your Application

1. **Build the application locally**
```bash
npm run build
```

2. **Test the production build**
```bash
npm start
```

### Step 2: Set Up Node.js on SiteGround

1. Log into SiteGround control panel
2. Go to **Dev Tools** → **Node.js**
3. Create a new Node.js application:
   - **Node.js Version**: 18.x or higher
   - **Application Mode**: Production
   - **Application Root**: `/home/username/outreach-system`
   - **Application URL**: `https://yourdomain.com`
   - **Application Startup File**: `server.js`

### Step 3: Upload Files

**Option A: Git (Recommended)**
```bash
# On your local machine
git init
git add .
git commit -m "Initial commit"
git remote add origin your-git-repo-url
git push -u origin main

# On SiteGround server (via SSH)
cd /home/username
git clone your-git-repo-url outreach-system
cd outreach-system
```

**Option B: FTP**
```env
# Database
DATABASE_URL="file:./prod.db"
# Or for PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/outreach_system"

# Resend API
RESEND_API_KEY="re_your_actual_api_key_from_resend"

# App Configuration - IMPORTANT: Use your actual domain
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NODE_ENV="production"

# Email Configuration - Must be verified domain in Resend
FROM_EMAIL="info@medi-dental.be"
FROM_NAME="MediDental"
NEXT_PUBLIC_FROM_EMAIL="info@medi-dental.be"
NEXT_PUBLIC_FROM_NAME="MediDental"

# Security
NEXTAUTH_SECRET="generate-a-random-32-character-string"
NEXTAUTH_URL="https://yourdomain.com"
```

## Deployment Steps

### 1. Prepare Your Code

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

### 2. Upload to Your Host

Upload these files/folders to your server:
- `.next/` (build output)
- `node_modules/`
- `prisma/`
- `public/`
- `.env` (with production values)
- `package.json`
- `next.config.js`

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate


Create `server.js`:
```javascript
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
```

### Step 8: Start the Application

In SiteGround Node.js manager:
- Click **Restart** to start the application
- Monitor logs for any errors

### Step 9: Configure Nginx (if needed)

If using custom domain, add to Nginx config:
```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Docker Deployment

### Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Create docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - RESEND_WEBHOOK_SECRET=${RESEND_WEBHOOK_SECRET}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - FROM_EMAIL=${FROM_EMAIL}
      - FROM_NAME=${FROM_NAME}
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=outreach
      - POSTGRES_PASSWORD=secure_password
      - POSTGRES_DB=outreach_system
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

### Deploy with Docker

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Run migrations
docker-compose exec app npx prisma db push

# Stop
docker-compose down
```

## Resend Configuration

### 1. Verify Domain

1. Go to Resend dashboard → Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records provided by Resend:
   - SPF record
   - DKIM records
   - DMARC record (optional but recommended)

### 2. Create API Key

1. Go to API Keys
2. Create new key with **Full Access**
3. Copy key to `.env` as `RESEND_API_KEY`

### 3. Configure Webhook

1. Go to Webhooks
2. Click **Add Webhook**
3. Enter URL: `https://yourdomain.com/api/webhooks/resend`
4. Select events:
   - ✅ email.sent
   - ✅ email.delivered
   - ✅ email.opened
   - ✅ email.clicked
   - ✅ email.bounced
   - ✅ email.complained
   - ✅ email.delivery_delayed
5. Copy webhook secret to `.env` as `RESEND_WEBHOOK_SECRET`

## Cron Job Setup

### Option 1: Server Cron

```bash
# Edit crontab
crontab -e

# Add this line (runs every 5 minutes)
*/5 * * * * curl -X POST https://yourdomain.com/api/queue/process -H "Content-Type: application/json" -d '{"batchSize":10}'
```

### Option 2: External Cron Service

Use services like:
- **EasyCron**: https://www.easycron.com/
- **cron-job.org**: https://cron-job.org/
- **Uptime Robot**: Can trigger URLs

Configuration:
- URL: `https://yourdomain.com/api/queue/process`
- Method: POST
- Interval: Every 5 minutes
- Body: `{"batchSize":10}`

### Option 3: Vercel Cron (if deploying to Vercel)

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/queue/process",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

## SSL Certificate

### SiteGround
- SSL is automatically provided via Let's Encrypt
- Enable in Site Tools → Security → SSL Manager

### Custom Server
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is configured automatically
```

## Database Backup

### Automated Backup Script

Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/username/backups"
DB_NAME="outreach_system"

mkdir -p $BACKUP_DIR

# Backup database
pg_dump $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql"
```

Add to crontab:
```bash
# Daily backup at 2 AM
0 2 * * * /home/username/backup.sh
```

## Monitoring

### Application Logs

```bash
# View Next.js logs
tail -f /home/username/outreach-system/.next/server/logs

# View Node.js logs (SiteGround)
# Check in Node.js App manager
```

### Database Monitoring

```bash
# Check database size
psql -U username -d outreach_system -c "SELECT pg_size_pretty(pg_database_size('outreach_system'));"

# Check table sizes
psql -U username -d outreach_system -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

### Health Check Endpoint

Create `app/api/health/route.ts`:
```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return NextResponse.json({ status: 'healthy', database: 'connected' })
  } catch (error) {
    return NextResponse.json({ status: 'unhealthy', database: 'disconnected' }, { status: 500 })
  }
}
```

Monitor with:
```bash
curl https://yourdomain.com/api/health
```

## Performance Optimization

### 1. Enable Caching

Add to `next.config.js`:
```javascript
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}
```

### 2. Database Indexing

Already included in Prisma schema, but verify:
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE schemaname = 'public';
```

### 3. Connection Pooling

Use PgBouncer for connection pooling:
```bash
# Install PgBouncer
sudo apt install pgbouncer

# Configure in /etc/pgbouncer/pgbouncer.ini
[databases]
outreach_system = host=localhost port=5432 dbname=outreach_system

[pgbouncer]
listen_addr = 127.0.0.1
listen_port = 6432
auth_type = md5
pool_mode = transaction
max_client_conn = 100
default_pool_size = 20
```

Update DATABASE_URL:
```
DATABASE_URL="postgresql://user:pass@localhost:6432/outreach_system?pgbouncer=true"
```

## Troubleshooting

### Issue: Application won't start

```bash
# Check Node.js version
node --version

# Check for port conflicts
lsof -i :3000

# Check environment variables
printenv | grep DATABASE_URL
```

### Issue: Database connection fails

```bash
# Test database connection
psql -U username -d outreach_system -c "SELECT NOW();"

# Check Prisma connection
npx prisma db pull
```

### Issue: Emails not sending

1. Verify Resend API key
2. Check FROM_EMAIL is verified
3. Review Resend logs
4. Check queue: `curl https://yourdomain.com/api/analytics`

### Issue: Webhooks not received

1. Test webhook URL is publicly accessible
2. Verify webhook secret matches
3. Check Resend webhook logs
4. Test manually: `curl -X POST https://yourdomain.com/api/webhooks/resend`

## Security Checklist

- [ ] SSL certificate installed and active
- [ ] Environment variables secured (not in code)
- [ ] Database password is strong
- [ ] Resend API key is production key
- [ ] Webhook secret is configured
- [ ] CORS configured properly
- [ ] Rate limiting enabled
- [ ] Firewall rules configured
- [ ] Regular backups scheduled
- [ ] Monitoring alerts set up

## Post-Deployment

1. **Test all features**:
   - Create campaign
   - Import contacts
   - Send test email
   - Verify tracking works
   - Check analytics

2. **Monitor for 24 hours**:
   - Check logs for errors
   - Verify webhooks arriving
   - Monitor database performance
   - Check email delivery rates

3. **Set up alerts**:
   - Uptime monitoring
   - Error tracking (Sentry)
   - Performance monitoring

---

Need help? Check the main README or create an issue on GitHub.
