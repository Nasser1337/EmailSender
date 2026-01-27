-- Complete database migration for Neon
-- Copy and paste this entire script into Neon SQL Editor and run it

-- CreateTable
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Contact" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT NOT NULL,
    "company" TEXT,
    "city" TEXT,
    "postcode" TEXT,
    "province" TEXT,
    "region" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "language" TEXT NOT NULL DEFAULT 'nl',
    "languageOverride" BOOLEAN NOT NULL DEFAULT false,
    "customData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable with follow-up fields included
CREATE TABLE IF NOT EXISTS "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subjectNl" TEXT,
    "subjectFr" TEXT,
    "bodyNl" TEXT,
    "bodyFr" TEXT,
    "followUpSubjectNl" TEXT,
    "followUpSubjectFr" TEXT,
    "followUpBodyNl" TEXT,
    "followUpBodyFr" TEXT,
    "fromEmail" TEXT,
    "fromName" TEXT,
    "replyTo" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "EmailEvent" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "resendEmailId" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "isFollowUp" BOOLEAN NOT NULL DEFAULT false,
    "parentEventId" TEXT,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3),
    "firstOpenedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "firstClickedAt" TIMESTAMP(3),
    "bouncedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "complainedAt" TIMESTAMP(3),
    "suppressedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmailEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "FollowUp" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "subjectNl" TEXT,
    "subjectFr" TEXT,
    "bodyNl" TEXT,
    "bodyFr" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "LanguageRule" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "LanguageRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "Setting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX IF NOT EXISTS "Contact_email_key" ON "Contact"("email");
CREATE INDEX IF NOT EXISTS "Contact_email_idx" ON "Contact"("email");
CREATE INDEX IF NOT EXISTS "Contact_city_idx" ON "Contact"("city");
CREATE INDEX IF NOT EXISTS "Contact_province_idx" ON "Contact"("province");
CREATE INDEX IF NOT EXISTS "Contact_language_idx" ON "Contact"("language");
CREATE INDEX IF NOT EXISTS "Campaign_status_idx" ON "Campaign"("status");
CREATE INDEX IF NOT EXISTS "Campaign_userId_idx" ON "Campaign"("userId");
CREATE INDEX IF NOT EXISTS "Campaign_createdAt_idx" ON "Campaign"("createdAt");
CREATE INDEX IF NOT EXISTS "EmailEvent_campaignId_idx" ON "EmailEvent"("campaignId");
CREATE INDEX IF NOT EXISTS "EmailEvent_contactId_idx" ON "EmailEvent"("contactId");
CREATE INDEX IF NOT EXISTS "EmailEvent_resendEmailId_idx" ON "EmailEvent"("resendEmailId");
CREATE INDEX IF NOT EXISTS "EmailEvent_status_idx" ON "EmailEvent"("status");
CREATE INDEX IF NOT EXISTS "EmailEvent_isFollowUp_idx" ON "EmailEvent"("isFollowUp");
CREATE INDEX IF NOT EXISTS "EmailEvent_sentAt_idx" ON "EmailEvent"("sentAt");
CREATE INDEX IF NOT EXISTS "EmailEvent_openedAt_idx" ON "EmailEvent"("openedAt");
CREATE INDEX IF NOT EXISTS "FollowUp_campaignId_idx" ON "FollowUp"("campaignId");
CREATE INDEX IF NOT EXISTS "FollowUp_contactId_idx" ON "FollowUp"("contactId");
CREATE INDEX IF NOT EXISTS "FollowUp_status_idx" ON "FollowUp"("status");
CREATE INDEX IF NOT EXISTS "LanguageRule_type_idx" ON "LanguageRule"("type");
CREATE INDEX IF NOT EXISTS "LanguageRule_language_idx" ON "LanguageRule"("language");
CREATE UNIQUE INDEX IF NOT EXISTS "LanguageRule_type_value_key" ON "LanguageRule"("type", "value");
CREATE UNIQUE INDEX IF NOT EXISTS "Setting_key_key" ON "Setting"("key");

-- AddForeignKey (only if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'Campaign_userId_fkey'
    ) THEN
        ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EmailEvent_campaignId_fkey'
    ) THEN
        ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_campaignId_fkey" 
        FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EmailEvent_contactId_fkey'
    ) THEN
        ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_contactId_fkey" 
        FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'EmailEvent_parentEventId_fkey'
    ) THEN
        ALTER TABLE "EmailEvent" ADD CONSTRAINT "EmailEvent_parentEventId_fkey" 
        FOREIGN KEY ("parentEventId") REFERENCES "EmailEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FollowUp_campaignId_fkey'
    ) THEN
        ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_campaignId_fkey" 
        FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'FollowUp_contactId_fkey'
    ) THEN
        ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_contactId_fkey" 
        FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
