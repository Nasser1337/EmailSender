# Outreach System

A production-ready, open-source email outreach platform built with Next.js, TypeScript, Prisma, and Resend. Designed for personalized bulk email campaigns with advanced tracking, language-based routing, and comprehensive analytics.

## 🚀 Features

- **Campaign Management**: Create and manage email campaigns with dual-language support (Dutch/French)
- **Smart Language Detection**: Automatically route emails based on recipient location
- **Excel/CSV Import**: Bulk import contacts with validation and duplicate detection
- **Email Tracking**: Real-time open and click tracking via Resend webhooks
- **Follow-up System**: Target contacts based on engagement (opened, clicked, bounced)
- **Analytics Dashboard**: Comprehensive metrics with charts (Recharts)
- **Queue System**: One-by-one email sending with retry logic
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS
- **Dark Mode**: Full dark/light theme support

## 📋 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (via Prisma ORM)
- **Email Provider**: Resend API
- **UI Components**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **File Parsing**: xlsx
- **Validation**: Zod

## 🛠️ Installation

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (or SQLite for development)
- Resend API key

### Setup Steps

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/outreach-system.git
cd outreach-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/outreach_system"
RESEND_API_KEY="re_your_api_key_here"
RESEND_WEBHOOK_SECRET="whsec_your_webhook_secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
FROM_EMAIL="outreach@yourdomain.com"
FROM_NAME="Your Company"
```

4. **Set up the database**
```bash
npx prisma generate
npx prisma db push
```

5. **Seed language rules (optional)**
```bash
npx tsx prisma/seed.ts
```

6. **Run the development server**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📊 Database Schema

### Core Models

- **Campaign**: Email campaign with dual-language templates
- **Contact**: Recipient information with language detection
- **EmailEvent**: Individual email send with tracking data
- **LanguageRule**: City/province to language mapping
- **FollowUp**: Follow-up campaign configuration
- **User**: System users
- **Setting**: Application settings

## 🌍 Language Detection Logic

The system automatically detects the appropriate language (Dutch or French) based on:

1. **City-based rules**: Specific cities mapped to languages
2. **Province-based rules**: Provinces/regions mapped to languages
3. **Manual override**: Users can manually set language per contact

### Example Rules

**French Cities**: Waterloo, Brussels, Liège, Namur, Charleroi, Mons, etc.
**Dutch Cities**: Lokeren, Ghent, Antwerp, Bruges, Leuven, Hasselt, etc.

**French Provinces**: Wallonia, Hainaut, Liège, Namur, Luxembourg, Brabant Wallon
**Dutch Provinces**: Flanders, Antwerp, East Flanders, West Flanders, Limburg, Flemish Brabant

## 📧 Resend Integration

### Webhook Configuration

1. Go to your Resend dashboard
2. Navigate to Webhooks
3. Add a new webhook endpoint: `https://yourdomain.com/api/webhooks/resend`
4. Select all email events:
   - `email.sent`
   - `email.delivered`
   - `email.opened`
   - `email.clicked`
   - `email.bounced`
   - `email.complained`
   - `email.delivery_delayed`

5. Copy the webhook secret to your `.env` file

### Email Status Flow

```
queued → sent → delivered → opened → clicked
                    ↓
                 bounced/failed/complained
```

## 📁 Excel Import Format

Your Excel/CSV file should contain these columns:

| Column | Required | Description |
|--------|----------|-------------|
| first_name | No | Contact's first name |
| last_name | No | Contact's last name |
| email | **Yes** | Email address (validated) |
| company | No | Company name |
| city | No | City (used for language detection) |
| postcode | No | Postal code |
| province | No | Province/region (used for language detection) |
| region | No | Region |
| website | No | Website URL |
| phone | No | Phone number |

### Example Excel File

```
first_name,last_name,email,company,city,postcode,province
Jan,Janssens,jan@example.be,Tandarts Janssens,Lokeren,9160,Oost-Vlaanderen
Marie,Dubois,marie@example.be,Cabinet Dubois,Waterloo,1410,Brabant Wallon
```

Download example: `/api/contacts/example` (TODO: implement this endpoint)

## 🎯 Campaign Creation Flow

1. **Create Campaign**
   - Set campaign name
   - Configure sender details

2. **Design Templates**
   - Dutch template (subject + body)
   - French template (subject + body)
   - Use variables: `{{first_name}}`, `{{company}}`, `{{city}}`, `{{province}}`

3. **Import Contacts**
   - Upload Excel/CSV file
   - Review validation results
   - Contacts automatically assigned language

4. **Send Campaign**
   - Select all contacts or specific ones
   - Emails queued for sending
   - Track progress in real-time

5. **Monitor Analytics**
   - View open/click rates
   - Track delivery status
   - Analyze engagement

6. **Send Follow-ups**
   - Filter by engagement
   - Create targeted follow-up messages
   - Track follow-up performance

## 📈 API Endpoints

### Campaigns
- `GET /api/campaigns` - List all campaigns
- `POST /api/campaigns` - Create new campaign
- `POST /api/campaigns/[id]/send` - Send campaign

### Contacts
- `GET /api/contacts` - List contacts (paginated)
- `POST /api/contacts` - Create contact
- `POST /api/contacts/import` - Import from Excel/CSV

### Analytics
- `GET /api/analytics` - Get campaign analytics
- `GET /api/analytics?campaignId=[id]` - Campaign-specific analytics

### Follow-ups
- `GET /api/followups?filter=[type]` - Get follow-up candidates
- `POST /api/followups` - Send follow-up emails

### Queue
- `POST /api/queue/process` - Process email queue (cron job)

### Webhooks
- `POST /api/webhooks/resend` - Resend webhook handler

### Tracking
- `GET /api/track/open/[eventId]` - Open tracking pixel
- `GET /api/track/click/[eventId]?url=[url]` - Click tracking redirect

## 🚀 Deployment

### SiteGround Node.js Hosting

1. **Prepare for production**
```bash
npm run build
```

2. **Set environment variables** in SiteGround control panel

3. **Upload files** via FTP or Git

4. **Install dependencies** on server
```bash
npm install --production
```

5. **Run migrations**
```bash
npx prisma generate
npx prisma db push
```

6. **Start the application**
```bash
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t outreach-system .
docker run -p 3000:3000 --env-file .env outreach-system
```

### Environment Variables for Production

```env
NODE_ENV=production
DATABASE_URL="postgresql://..."
RESEND_API_KEY="re_..."
RESEND_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
FROM_EMAIL="outreach@yourdomain.com"
FROM_NAME="Your Company"
NEXTAUTH_SECRET="generate-a-secure-random-string"
NEXTAUTH_URL="https://yourdomain.com"
```

## 🔒 Security Best Practices

1. **Never commit `.env` file** - Use `.env.example` as template
2. **Use app passwords** for email providers
3. **Implement rate limiting** for API endpoints
4. **Validate all inputs** with Zod schemas
5. **Sanitize user content** before rendering
6. **Use HTTPS** in production
7. **Rotate API keys** regularly
8. **Monitor webhook signatures**

## 🧪 Testing

```bash
# Run type checking
npm run lint

# Check database schema
npx prisma validate

# View database in browser
npx prisma studio
```

## 📝 Cron Jobs

Set up a cron job to process the email queue:

```bash
# Every 5 minutes
*/5 * * * * curl -X POST https://yourdomain.com/api/queue/process
```

Or use a service like:
- Vercel Cron
- GitHub Actions
- EasyCron
- cron-job.org

## 🎨 UI Components

Built with shadcn/ui components:
- Button, Input, Select, Textarea
- Dialog, Alert Dialog, Popover
- Table, Card, Badge
- Toast notifications
- Dark mode toggle

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Reset database (⚠️ deletes all data)
npx prisma migrate reset
```

### Email Not Sending
1. Check Resend API key is valid
2. Verify `FROM_EMAIL` is verified in Resend
3. Check queue status: `GET /api/analytics`
4. Review logs for errors

### Webhook Not Working
1. Verify webhook URL is publicly accessible
2. Check webhook secret matches `.env`
3. Test webhook with Resend dashboard
4. Review webhook logs in Resend

## 📚 Project Structure

```
outreach-system/
├── app/
│   ├── api/              # API routes
│   │   ├── campaigns/
│   │   ├── contacts/
│   │   ├── analytics/
│   │   ├── followups/
│   │   ├── webhooks/
│   │   └── track/
│   ├── dashboard/        # Dashboard pages
│   ├── campaigns/        # Campaign pages
│   ├── contacts/         # Contact pages
│   ├── followups/        # Follow-up pages
│   ├── settings/         # Settings pages
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/           # React components
│   ├── ui/              # shadcn/ui components
│   ├── dashboard/       # Dashboard components
│   ├── campaigns/       # Campaign components
│   └── shared/          # Shared components
├── lib/                 # Utility functions
│   ├── prisma.ts        # Prisma client
│   ├── resend.ts        # Resend integration
│   ├── email-queue.ts   # Queue system
│   ├── language-detector.ts
│   ├── excel-parser.ts
│   └── utils.ts
├── prisma/
│   └── schema.prisma    # Database schema
├── public/              # Static assets
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - feel free to use this project for commercial purposes.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [Resend](https://resend.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)

## 📞 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/outreach-system/issues)
- Documentation: [Read the docs](https://github.com/yourusername/outreach-system/wiki)

---

Built with ❤️ for the dentist outreach community
