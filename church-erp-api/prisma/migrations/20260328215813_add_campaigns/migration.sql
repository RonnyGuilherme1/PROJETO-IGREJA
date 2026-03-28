-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "CampaignInstallmentStatus" AS ENUM ('PAID', 'UNPAID');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "churchId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "installmentCount" INTEGER NOT NULL,
    "installmentAmount" DECIMAL(14,2) NOT NULL,
    "startDate" TIMESTAMP(3),
    "status" "CampaignStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMember" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "memberId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "CampaignMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignInstallment" (
    "id" UUID NOT NULL,
    "campaignMemberId" UUID NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" "CampaignInstallmentStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,

    CONSTRAINT "CampaignInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_tenantId_idx" ON "Campaign"("tenantId");

-- CreateIndex
CREATE INDEX "Campaign_churchId_idx" ON "Campaign"("churchId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "CampaignMember_campaignId_idx" ON "CampaignMember"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignMember_memberId_idx" ON "CampaignMember"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMember_campaignId_memberId_key" ON "CampaignMember"("campaignId", "memberId");

-- CreateIndex
CREATE INDEX "CampaignInstallment_campaignMemberId_idx" ON "CampaignInstallment"("campaignMemberId");

-- CreateIndex
CREATE INDEX "CampaignInstallment_status_idx" ON "CampaignInstallment"("status");

-- CreateIndex
CREATE INDEX "CampaignInstallment_dueDate_idx" ON "CampaignInstallment"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignInstallment_campaignMemberId_installmentNumber_key" ON "CampaignInstallment"("campaignMemberId", "installmentNumber");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMember" ADD CONSTRAINT "CampaignMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignInstallment" ADD CONSTRAINT "CampaignInstallment_campaignMemberId_fkey" FOREIGN KEY ("campaignMemberId") REFERENCES "CampaignMember"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
