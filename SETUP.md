# Quick Setup Guide

Get your Outreach System running in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database (use SQLite for quick start)
DATABASE_URL="file:./dev.db"

# Or PostgreSQL for production
# DATABASE_URL="postgresql://user:password@localhost:5432/outreach_system"

# Resend API (get from https://resend.com/api-keys)
RESEND_API_KEY="re_your_api_key_here"
RESEND_WEBHOOK_SECRET="whsec_your_webhook_secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Email sender
FROM_EMAIL="outreach@yourdomain.com"
FROM_NAME="Your Company"
```

## Step 3: Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma db push

# Optional: Seed language rules
node -e "require('./lib/language-detector').seedLanguageRules()"
```

## Step 4: Start Development Server

```bash
npm run dev
```

Visit **http://localhost:3000**

## Step 5: Configure Resend

### Verify Your Domain

1. Go to [Resend Dashboard](https://resend.com/domains)
2. Add your domain
3. Add DNS records (SPF, DKIM, DMARC)
4. Wait for verification

### Set Up Webhook

1. Go to [Resend Webhooks](https://resend.com/webhooks)
2. Click "Add Webhook"
3. URL: `http://localhost:3000/api/webhooks/resend` (use ngrok for local testing)
4. Select all email events
5. Copy webhook secret to `.env`

### For Local Testing with Webhooks

Use ngrok to expose your local server:
```bash
# Install ngrok
npm install -g ngrok

# Expose port 3000
ngrok http 3000

# Use the ngrok URL in Resend webhook config
# Example: https://abc123.ngrok.io/api/webhooks/resend
```

## Step 6: Test the System

### Create Your First Campaign

1. Go to **Campaigns** → **New Campaign**
2. Enter campaign name
3. Create Dutch template:
   - Subject: `Hallo {{first_name}}, een bericht voor {{company}}`
   - Body: `Beste {{first_name}}, ...`
4. Create French template:
   - Subject: `Bonjour {{first_name}}, un message pour {{company}}`
   - Body: `Cher {{first_name}}, ...`

### Import Contacts

1. Go to **Contacts** → **Import**
2. Upload Excel/CSV file with columns:
   - `first_name`, `last_name`, `email`, `company`, `city`, `province`
3. Review import results
4. Contacts automatically assigned language based on location

### Send Campaign

1. Go to your campaign
2. Click **Send**
3. Select contacts or send to all
4. Emails are queued and sent one by one

### Monitor Results

1. Go to **Dashboard** to see:
   - Total sent
   - Open rate
   - Click rate
   - Bounce rate
2. View detailed analytics per campaign

### Send Follow-ups

1. Go to **Follow-ups**
2. Filter by:
   - Opened but not clicked
   - Not opened
   - Failed/bounced
3. Select contacts
4. Create follow-up message
5. Send

## Common Issues

### Database Connection Error

**SQLite (Development)**:
```env
DATABASE_URL="file:./dev.db"
```

**PostgreSQL (Production)**:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?schema=public"
```

### Resend API Key Invalid

1. Verify key starts with `re_`
2. Check key has full access permissions
3. Ensure domain is verified in Resend

### Emails Not Sending

1. Check `FROM_EMAIL` is verified in Resend
2. Verify API key is correct
3. Check queue: `curl http://localhost:3000/api/analytics`
4. Process queue manually: `curl -X POST http://localhost:3000/api/queue/process`

### Webhooks Not Working

1. For local development, use ngrok
2. Verify webhook URL is publicly accessible
3. Check webhook secret matches `.env`
4. Test webhook in Resend dashboard

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed production deployment instructions.

### Quick Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use PostgreSQL database
- [ ] Configure production domain
- [ ] Set up SSL certificate
- [ ] Configure Resend webhook with production URL
- [ ] Set up cron job for queue processing
- [ ] Enable database backups
- [ ] Set up monitoring

## Database Management

### View Database

```bash
npx prisma studio
```

Opens a browser interface at `http://localhost:5555`

### Backup Database

```bash
# SQLite
cp dev.db dev.db.backup

# PostgreSQL
pg_dump outreach_system > backup.sql
```

### Reset Database

```bash
npx prisma migrate reset
```

⚠️ **Warning**: This deletes all data!

## Email Queue Processing

The queue processes emails automatically. To manually trigger:

```bash
curl -X POST http://localhost:3000/api/queue/process \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10}'
```

Set up a cron job for automatic processing:
```bash
# Every 5 minutes
*/5 * * * * curl -X POST https://yourdomain.com/api/queue/process
```

## Excel File Format

Your Excel/CSV file should have these columns:

| Column | Required | Example |
|--------|----------|---------|
| first_name | No | Jan |
| last_name | No | Janssens |
| email | **Yes** | jan@example.be |
| company | No | Tandarts Janssens |
| city | No | Lokeren |
| postcode | No | 9160 |
| province | No | Oost-Vlaanderen |
| region | No | Flanders |
| website | No | www.example.be |
| phone | No | +32 9 123 4567 |

## Language Detection

The system automatically detects language based on:

**French Cities**: Waterloo, Brussels, Liège, Namur, Charleroi, Mons, etc.
**Dutch Cities**: Lokeren, Ghent, Antwerp, Bruges, Leuven, Hasselt, etc.

**French Provinces**: Wallonia, Hainaut, Liège, Namur, Luxembourg, Brabant Wallon
**Dutch Provinces**: Flanders, Antwerp, East/West Flanders, Limburg, Flemish Brabant

You can manually override language per contact in the UI.

## API Endpoints

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/[id]/send` - Send campaign

### Contacts
- `GET /api/contacts` - List contacts
- `POST /api/contacts` - Create contact
- `POST /api/contacts/import` - Import from Excel

### Analytics
- `GET /api/analytics` - Get analytics
- `GET /api/analytics?campaignId=[id]` - Campaign analytics

### Follow-ups
- `GET /api/followups?filter=[type]` - Get candidates
- `POST /api/followups` - Send follow-ups

### Queue
- `POST /api/queue/process` - Process queue

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `postgresql://...` |
| `RESEND_API_KEY` | Resend API key | `re_...` |
| `RESEND_WEBHOOK_SECRET` | Webhook secret | `whsec_...` |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://yourdomain.com` |
| `FROM_EMAIL` | Sender email | `outreach@yourdomain.com` |
| `FROM_NAME` | Sender name | `Your Company` |
| `NODE_ENV` | Environment | `development` or `production` |

## Support

- **Documentation**: [README.md](./README.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: [GitHub Issues](https://github.com/yourusername/outreach-system/issues)

## Next Steps

1. ✅ Set up your first campaign
2. ✅ Import contacts
3. ✅ Send test emails
4. ✅ Monitor analytics
5. ✅ Set up follow-ups
6. ✅ Deploy to production

---

**Need help?** Check the [README.md](./README.md) for detailed documentation.
