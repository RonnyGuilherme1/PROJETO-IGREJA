import * as bcrypt from 'bcrypt';
import {
  PlatformRole,
  PrismaClient,
  UserRole,
  UserStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

const MASTER_USER = {
  name: 'Ronny guilherme',
  username: 'ronny.master.silva',
  email: 'ronnyguilherme.silva@outlook.com',
  password: 'Master.Ronny2236',
};

async function main() {
  const masterPasswordHash = await bcrypt.hash(MASTER_USER.password, 10);
  const masterUserData = {
    name: MASTER_USER.name,
    email: MASTER_USER.email,
    passwordHash: masterPasswordHash,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    tenantId: null,
    platformRole: PlatformRole.PLATFORM_ADMIN,
    isSystemProtected: true,
    createdByPlatformUserId: null,
    churchId: null,
  } as const;

  await prisma.user.upsert({
    where: {
      username: MASTER_USER.username,
    },
    update: masterUserData,
    create: {
      ...masterUserData,
      name: MASTER_USER.name,
      username: MASTER_USER.username,
    },
  });

  console.log(`Seed executada com sucesso para o master ${MASTER_USER.username}.`);
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
