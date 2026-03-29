-- CreateEnum
CREATE TYPE "WhatsappIntegrationProvider" AS ENUM ('WHATSAPP_CLOUD_API');

-- CreateTable
CREATE TABLE "WhatsappIntegrationConfig" (
    "id" UUID NOT NULL,
    "tenantId" UUID NOT NULL,
    "provider" "WhatsappIntegrationProvider" NOT NULL DEFAULT 'WHATSAPP_CLOUD_API',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "businessAccountId" TEXT,
    "phoneNumberId" TEXT,
    "accessToken" TEXT,
    "fallbackToManual" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappIntegrationConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhatsappIntegrationDestination" (
    "id" UUID NOT NULL,
    "configId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsappIntegrationDestination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhatsappIntegrationConfig_tenantId_key" ON "WhatsappIntegrationConfig"("tenantId");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationConfig_tenantId_idx" ON "WhatsappIntegrationConfig"("tenantId");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationConfig_enabled_idx" ON "WhatsappIntegrationConfig"("enabled");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationDestination_configId_idx" ON "WhatsappIntegrationDestination"("configId");

-- CreateIndex
CREATE INDEX "WhatsappIntegrationDestination_enabled_idx" ON "WhatsappIntegrationDestination"("enabled");

-- AddForeignKey
ALTER TABLE "WhatsappIntegrationConfig" ADD CONSTRAINT "WhatsappIntegrationConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsappIntegrationDestination" ADD CONSTRAINT "WhatsappIntegrationDestination_configId_fkey" FOREIGN KEY ("configId") REFERENCES "WhatsappIntegrationConfig"("id") ON DELETE CASCADE ON UPDATE CASCADE;
