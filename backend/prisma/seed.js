const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APP_PERMISSIONS = [
  'booking:create',
  'booking:view',
  'booking:delete:own',
  'booking:delete:any',
  'booking:view:grouped',
  'booking:view:summary',
  'user:create',
  'user:view',
  'user:delete',
  'user:update-role',
  'role:create',
  'role:view',
  'role:update-permissions',
  'role:delete',
];

const DEFAULT_ROLE_PERMISSIONS = {
  admin: [...APP_PERMISSIONS],
  owner: [
    'booking:create',
    'booking:view',
    'booking:delete:own',
    'booking:delete:any',
    'booking:view:grouped',
    'booking:view:summary',
    'role:view',
  ],
  user: ['booking:create', 'booking:view', 'booking:delete:own', 'role:view'],
};

const DEFAULT_ROLE_IDS = {
  admin: 'role-admin',
  owner: 'role-owner',
  user: 'role-user',
};

const DEFAULT_USER_SEEDS = [
  { id: 'user-system-admin', name: 'System Admin', role: 'admin' },
  { id: 'user-room-owner', name: 'Room Owner', role: 'owner' },
  { id: 'user-standard-user', name: 'Standard User', role: 'user' },
];

async function ensureRole(roleName, permissions, preferredId) {
  const existingRole = await prisma.role.findUnique({
    where: { name: roleName },
    select: { id: true },
  });

  const role = existingRole
    ? existingRole
    : await prisma.role.create({
        data: preferredId ? { id: preferredId, name: roleName } : { name: roleName },
        select: { id: true },
      });

  await prisma.permission.deleteMany({ where: { roleId: role.id } });
  await prisma.permission.createMany({
    data: permissions.map((action) => ({ roleId: role.id, action })),
  });
}

async function main() {
  const roleEntries = Object.entries(DEFAULT_ROLE_PERMISSIONS);
  for (const [roleName, permissions] of roleEntries) {
    await ensureRole(roleName, permissions, DEFAULT_ROLE_IDS[roleName]);
  }

  const roles = await prisma.role.findMany({
    where: { name: { in: ['admin', 'owner', 'user'] } },
    select: { id: true, name: true },
  });
  const roleMap = new Map(roles.map((role) => [role.name, role.id]));

  for (const userSeed of DEFAULT_USER_SEEDS) {
    const roleId = roleMap.get(userSeed.role);
    if (!roleId) {
      throw new Error(`Missing role while seeding user: ${userSeed.role}`);
    }

    await prisma.user.upsert({
      where: { id: userSeed.id },
      update: { name: userSeed.name, roleId },
      create: { id: userSeed.id, name: userSeed.name, roleId },
    });
  }
}

main()
  .catch((error) => {
    console.error('Prisma seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
