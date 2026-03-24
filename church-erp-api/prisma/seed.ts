import * as bcrypt from 'bcrypt';
import {
  PlatformRole,
  PrismaClient,
  TenantStatus,
  UserRole,
  UserStatus,
} from '@prisma/client';
import { DEFAULT_FINANCE_CATEGORIES } from '../src/modules/finance/finance.service';

const prisma = new PrismaClient();

const MASTER_USER = {
  name: 'Platform Master',
  username: 'platform.master',
  email: 'master@platform.test',
  password: 'Master@123',
};

const TEST_TENANT = {
  name: 'Tenant Teste',
  slug: 'tenant-teste',
};

const TEST_CHURCH = {
  name: 'Igreja Teste',
  email: 'igreja@tenant-teste.test',
  phone: '85999990000',
};

const TENANT_ADMIN_USER = {
  name: 'Admin Tenant Teste',
  username: 'tenant.admin',
  email: 'admin@tenant-teste.test',
  password: 'Admin@123',
};

async function upsertChurch(tenantId: string) {
  const existingChurch = await prisma.church.findFirst({
    where: {
      tenantId,
      name: TEST_CHURCH.name,
    },
    select: {
      id: true,
    },
  });

  if (existingChurch) {
    return prisma.church.update({
      where: { id: existingChurch.id },
      data: {
        tenantId,
        name: TEST_CHURCH.name,
        email: TEST_CHURCH.email,
        phone: TEST_CHURCH.phone,
        status: 'ACTIVE',
      },
    });
  }

  return prisma.church.create({
    data: {
      tenantId,
      name: TEST_CHURCH.name,
      email: TEST_CHURCH.email,
      phone: TEST_CHURCH.phone,
      status: 'ACTIVE',
    },
  });
}

async function upsertFinanceCategory(
  tenantId: string,
  category: (typeof DEFAULT_FINANCE_CATEGORIES)[number],
) {
  const existingCategory = await prisma.financeCategory.findFirst({
    where: {
      tenantId,
      name: category.name,
      type: category.type,
    },
    select: {
      id: true,
    },
  });

  if (existingCategory) {
    return prisma.financeCategory.update({
      where: { id: existingCategory.id },
      data: {
        tenantId,
        name: category.name,
        type: category.type,
        active: true,
      },
    });
  }

  return prisma.financeCategory.create({
    data: {
      tenantId,
      name: category.name,
      type: category.type,
      active: true,
    },
  });
}

async function main() {
  const [masterPasswordHash, tenantAdminPasswordHash] = await Promise.all([
    bcrypt.hash(MASTER_USER.password, 10),
    bcrypt.hash(TENANT_ADMIN_USER.password, 10),
  ]);

  const tenant = await prisma.tenant.upsert({
    where: {
      slug: TEST_TENANT.slug,
    },
    update: {
      name: TEST_TENANT.name,
      status: TenantStatus.ACTIVE,
    },
    create: {
      name: TEST_TENANT.name,
      slug: TEST_TENANT.slug,
      status: TenantStatus.ACTIVE,
    },
  });

  const church = await upsertChurch(tenant.id);

  const masterUser = await prisma.user.upsert({
    where: {
      username: MASTER_USER.username,
    },
    update: {
      name: MASTER_USER.name,
      email: MASTER_USER.email,
      passwordHash: masterPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      tenantId: null,
      platformRole: PlatformRole.PLATFORM_ADMIN,
      churchId: null,
    },
    create: {
      name: MASTER_USER.name,
      username: MASTER_USER.username,
      email: MASTER_USER.email,
      passwordHash: masterPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      tenantId: null,
      platformRole: PlatformRole.PLATFORM_ADMIN,
      churchId: null,
    },
  });

  const tenantAdminUser = await prisma.user.upsert({
    where: {
      username: TENANT_ADMIN_USER.username,
    },
    update: {
      name: TENANT_ADMIN_USER.name,
      email: TENANT_ADMIN_USER.email,
      passwordHash: tenantAdminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      tenantId: tenant.id,
      platformRole: null,
      churchId: church.id,
    },
    create: {
      name: TENANT_ADMIN_USER.name,
      username: TENANT_ADMIN_USER.username,
      email: TENANT_ADMIN_USER.email,
      passwordHash: tenantAdminPasswordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      tenantId: tenant.id,
      platformRole: null,
      churchId: church.id,
    },
  });

  for (const category of DEFAULT_FINANCE_CATEGORIES) {
    await upsertFinanceCategory(tenant.id, category);
  }

  console.log('');
  console.log('Seed executed successfully.');
  console.log('');
  console.log(`Tenant: ${tenant.name} (${tenant.slug})`);
  console.log(`Church: ${church.name}`);
  console.log('');
  console.log('Access credentials:');
  console.log(
    `Platform master -> email: ${masterUser.email} | username: ${masterUser.username} | password: ${MASTER_USER.password}`,
  );
  console.log(
    `Tenant admin -> email: ${tenantAdminUser.email} | username: ${tenantAdminUser.username} | password: ${TENANT_ADMIN_USER.password}`,
  );
  console.log('');
}

main()
  .catch((error) => {
    console.error('Seed execution failed.');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
