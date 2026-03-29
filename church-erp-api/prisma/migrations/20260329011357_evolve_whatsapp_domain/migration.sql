-- CreateEnum
CREATE TYPE "WhatsappDestinationType" AS ENUM ('GROUP', 'PERSON');

-- CreateEnum
CREATE TYPE "WhatsappConnectionStatus" AS ENUM ('NOT_CONFIGURED', 'PENDING_AUTHORIZATION', 'CONNECTED', 'ERROR');

-- CreateEnum
CREATE TYPE "NoticeDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "WhatsappIntegrationConfig" ADD COLUMN     "connectedPhoneDisplay" TEXT,
ADD COLUMN     "connectionStatus" "WhatsappConnectionStatus" NOT NULL DEFAULT 'NOT_CONFIGURED',
ADD COLUMN     "lastConnectedAt" TIMESTAMP(3),
ADD COLUMN     "lastErrorMessage" TEXT,
ADD COLUMN     "onboardingState" TEXT,
ADD COLUMN     "requestedPhoneNumber" TEXT;

-- AlterTable
ALTER TABLE "WhatsappIntegrationDestination" ADD COLUMN     "churchId" UUID,
ADD COLUMN     "groupId" TEXT,
ADD COLUMN     "type" "WhatsappDestinationType" NOT NULL DEFAULT 'PERSON',
ALTER COLUMN "phoneNumber" DROP NOT NULL;

-- AddConstraint
ALTER TABLE "WhatsappIntegrationDestination"
ADD CONSTRAINT "WhatsappIntegrationDestination_type_identifier_check"
CHECK (
    ("type" = 'GROUP' AND "groupId" IS NOT NULL AND "phoneNumber" IS NULL)
    OR
    ("type" = 'PERSON' AND "phoneNumber" IS NOT NULL AND "groupId" IS NULL)
);

-- CreateTable
CREATE TABLE "NoticeDelivery" (
    "id" UUID NOT NULL,
    "tenantId" UUID,
    "noticeId" UUID NOT NULL,
    "destinationId" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "status" "NoticeDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "providerMessageId" TEXT,
    "sentAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NoticeDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NoticeDelivery_tenantId_idx" ON "NoticeDelivery"("tenantId");

-- CreateIndex
CREATE INDEX "NoticeDelivery_noticeId_idx" ON "NoticeDelivery"("noticeId");

-- CreateIndex
CREATE INDEX "NoticeDelivery_destinationId_idx" ON "NoticeDelivery"("destinationId");

-- CreateIndex
CREATE INDEX "NoticeDelivery_status_idx" ON "NoticeDelivery"("status");

-- CreateIndex
CREATE INDEX "NoticeDelivery_sentAt_idx" ON "NoticeDelivery"("sentAt");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationConfig_connectionStatus_idx" ON "WhatsappIntegrationConfig"("connectionStatus");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationDestination_churchId_idx" ON "WhatsappIntegrationDestination"("churchId");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationDestination_type_idx" ON "WhatsappIntegrationDestination"("type");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationDestination_configId_type_idx" ON "WhatsappIntegrationDestination"("configId", "type");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationDestination_configId_churchId_idx" ON "WhatsappIntegrationDestination"("configId", "churchId");

-- AddForeignKey
ALTER TABLE "NoticeDelivery" ADD CONSTRAINT "NoticeDelivery_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeDelivery" ADD CONSTRAINT "NoticeDelivery_noticeId_fkey" FOREIGN KEY ("noticeId") REFERENCES "Notice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NoticeDelivery" ADD CONSTRAINT "NoticeDelivery_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "WhatsappIntegrationDestination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappIntegrationDestination" ADD CONSTRAINT "WhatsappIntegrationDestination_churchId_fkey" FOREIGN KEY ("churchId") REFERENCES "Church"("id") ON DELETE SET NULL ON UPDATE CASCADE;
