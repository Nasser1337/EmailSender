# Deploy to Vercel (FREE & Easy)

## Why Vercel?
- ✅ **FREE** for personal/small business use
- ✅ Built specifically for Next.js
- ✅ Automatic HTTPS
- ✅ Webhooks work perfectly
- ✅ Deploy in 5 minutes
- ✅ Custom domain support (medi-dental.be)

## Step-by-Step Deployment

### 1. Create Vercel Account
1. Go to https://vercel.com/signup
2. Sign up with GitHub, GitLab, or email
3. Free plan is automatically selected

### 2. Prepare Your Project

**Option A: Using Git (Recommended)**

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
# Create a new repo on github.com first
git remote add origin https://github.com/yourusername/outreach-system.git
git push -u origin main
```

**Option B: Vercel CLI (Direct Upload)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### 3. Configure Environment Variables in Vercel

After connecting your project, add these environment variables in Vercel dashboard:

**Go to:** Project Settings → Environment Variables

```env
DATABASE_URL=file:./prod.db
RESEND_API_KEY=re_your_actual_api_key
RESEND_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app
FROM_EMAIL=info@medi-dental.be
FROM_NAME=MediDental
NEXT_PUBLIC_FROM_EMAIL=info@medi-dental.be
NEXT_PUBLIC_FROM_NAME=MediDental
NEXTAUTH_SECRET=generate-random-32-char-string
NEXTAUTH_URL=https://your-vercel-url.vercel.app
NODE_ENV=production
```

**Important:** For `NEXTAUTH_SECRET`, generate a random string:
```bash
openssl rand -base64 32
```

### 4. Database Setup (Important!)

Vercel's serverless environment has limitations with SQLite. You have two options:

**Option A: Use Vercel Postgres (Recommended)**
1. In Vercel dashboard, go to Storage → Create Database
2. Select Postgres
3. Copy the connection string
4. Update `DATABASE_URL` environment variable
5. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
6. Run locally: `npx prisma migrate deploy`

**Option B: Use External Database**
- **Supabase** (Free tier): https://supabase.com
- **PlanetScale** (Free tier): https://planetscale.com
- **Neon** (Free tier): https://neon.tech

### 5. Deploy!

**If using Git:**
1. Push your code to GitHub
2. Vercel will auto-deploy on every push
3. First deployment takes ~2 minutes

**If using CLI:**
```bash
vercel --prod
```

### 6. Configure Custom Domain

1. In Vercel dashboard → Domains
2. Add domain: `outreach.medi-dental.be`
3. Vercel will show DNS records to add
4. In SiteGround DNS settings, add:
   - Type: `CNAME`
   - Name: `outreach`
   - Value: `cname.vercel-dns.com`
5. Wait 5-10 minutes for DNS propagation

### 7. Update Resend Webhook

1. Go to https://resend.com/webhooks
2. Update webhook URL to: `https://outreach.medi-dental.be/api/webhooks/resend`
3. Or if using Vercel URL: `https://your-project.vercel.app/api/webhooks/resend`

### 8. Update Environment Variables

After deployment, update in Vercel dashboard:
```env
NEXT_PUBLIC_APP_URL=https://outreach.medi-dental.be
NEXTAUTH_URL=https://outreach.medi-dental.be
```

Redeploy after changing environment variables.

## Testing

1. Visit your deployed URL
2. Create a test campaign
3. Send to your email
4. Check if tracking works!

## Advantages of Vercel

✅ **Automatic deployments** - Push to GitHub = auto-deploy
✅ **Preview deployments** - Test before going live
✅ **Built-in CDN** - Fast worldwide
✅ **Automatic HTTPS** - SSL certificate included
✅ **Zero configuration** - Works out of the box
✅ **Free tier generous** - 100GB bandwidth/month

## Cost Comparison

| Hosting | Cost | Node.js | Easy Deploy | Webhooks |
|---------|------|---------|-------------|----------|
| SiteGround Shared | $4-15/mo | ❌ | ❌ | ❌ |
| SiteGround Cloud | $100+/mo | ✅ | ⚠️ | ✅ |
| **Vercel** | **FREE** | ✅ | ✅ | ✅ |
| Netlify | FREE | ✅ | ✅ | ✅ |
| Railway | $5/mo | ✅ | ✅ | ✅ |

## Troubleshooting

### Build fails
- Check environment variables are set
- Ensure all dependencies in `package.json`
- Check build logs in Vercel dashboard

### Database errors
- Use PostgreSQL instead of SQLite for production
- Vercel Postgres is easiest option
- Run migrations: `npx prisma migrate deploy`

### Webhooks not working
- Verify webhook URL matches deployment URL
- Check webhook secret in environment variables
- Test webhook from Resend dashboard

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Discord: https://vercel.com/discord
- Resend Support: https://resend.com/support

## Alternative: Railway (Also Easy)

If you prefer Railway:
1. Go to https://railway.app
2. Connect GitHub repo
3. Add environment variables
4. Deploy (includes PostgreSQL database)
5. Cost: $5/month

Both Vercel and Railway are 100x easier than SiteGround for Next.js apps!
