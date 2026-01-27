# Production Deployment Checklist

## Before Deployment

### 1. Resend Setup
- [ ] Domain `medi-dental.be` is verified in Resend
- [ ] API key is generated and saved
- [ ] DNS records (SPF, DKIM) are added to domain
- [ ] Test email sent successfully from Resend dashboard

### 2. Code Preparation
- [ ] All dependencies installed: `npm install`
- [ ] Build successful: `npm run build`
- [ ] No TypeScript errors
- [ ] Database migrations ready: `npx prisma migrate deploy`

### 3. Environment Variables
- [ ] `.env` file created on server
- [ ] `RESEND_API_KEY` set with actual key
- [ ] `NEXT_PUBLIC_APP_URL` set to your public domain (e.g., `https://outreach.medi-dental.be`)
- [ ] `FROM_EMAIL` set to `info@medi-dental.be`
- [ ] `NEXTAUTH_SECRET` generated (use: `openssl rand -base64 32`)
- [ ] `DATABASE_URL` configured

## During Deployment

### 4. Upload Files
- [ ] Upload `.next/` folder
- [ ] Upload `node_modules/` folder
- [ ] Upload `prisma/` folder
- [ ] Upload `public/` folder
- [ ] Upload `.env` file (with production values)
- [ ] Upload `package.json`
- [ ] Upload `next.config.js`

### 5. Server Setup
- [ ] Node.js 18+ installed on server
- [ ] Run: `npx prisma generate`
- [ ] Run: `npx prisma migrate deploy`
- [ ] Run: `npx prisma db seed` (for language rules)
- [ ] Start server: `npm start` or `pm2 start npm -- start`

### 6. Webhook Configuration
- [ ] Go to https://resend.com/webhooks
- [ ] Click "Add Webhook"
- [ ] Set endpoint: `https://yourdomain.com/api/webhooks/resend`
- [ ] Select all email events (sent, delivered, opened, clicked, bounced, complained)
- [ ] Copy webhook secret
- [ ] Add `RESEND_WEBHOOK_SECRET` to `.env`
- [ ] Restart server

## After Deployment

### 7. Testing
- [ ] Website loads at your domain
- [ ] Can log in / access dashboard
- [ ] Can view contacts page
- [ ] Can create a campaign
- [ ] Can add a test contact (your email)
- [ ] Can send campaign to test contact
- [ ] Email received successfully
- [ ] Email shows correct sender: `info@medi-dental.be`
- [ ] Open email and click "Display images"
- [ ] Wait 30 seconds, check Campaign Status page
- [ ] Open tracking shows in status page
- [ ] Check Follow-Ups page shows the email

### 8. Webhook Verification
- [ ] Go to Resend webhooks dashboard
- [ ] Check "Recent deliveries" tab
- [ ] Verify webhook calls are successful (200 status)
- [ ] If failed, check server logs for errors

### 9. Production Monitoring
- [ ] Set up server monitoring (PM2, systemd, etc.)
- [ ] Configure automatic restarts
- [ ] Set up database backups
- [ ] Monitor Resend usage/limits
- [ ] Check server logs regularly: `pm2 logs` or `tail -f /var/log/your-app.log`

## Troubleshooting

### Emails not sending
1. Check Resend dashboard for errors
2. Verify API key is correct
3. Confirm domain is verified
4. Check server logs for errors

### Tracking not working
1. Verify webhook URL is accessible publicly
2. Check webhook secret matches `.env`
3. Test webhook from Resend dashboard
4. Ensure `NEXT_PUBLIC_APP_URL` is correct
5. Check server logs for webhook errors

### Database issues
1. Check file permissions (SQLite)
2. Verify DATABASE_URL connection string
3. Run migrations: `npx prisma migrate deploy`
4. Check disk space

## Security Notes

- ⚠️ Never commit `.env` to git
- ⚠️ Use HTTPS (SSL certificate) in production
- ⚠️ Keep Resend API key secret
- ⚠️ Regularly update dependencies
- ⚠️ Monitor for suspicious activity
- ⚠️ Set up rate limiting if needed

## Support Contacts

- Resend Support: https://resend.com/support
- Your hosting provider support
- DNS/Domain registrar support

## Quick Commands

```bash
# Check if server is running
pm2 status

# View logs
pm2 logs outreach-system

# Restart server
pm2 restart outreach-system

# Stop server
pm2 stop outreach-system

# Check database
npx prisma studio

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Success Criteria

✅ Emails send successfully from `info@medi-dental.be`
✅ Email opens are tracked in real-time
✅ Campaign status updates automatically
✅ Follow-Ups page shows accurate data
✅ No errors in server logs
✅ Webhook deliveries show 200 status in Resend
