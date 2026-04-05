// typescript

import * as bcrypt from 'bcrypt';
import { prisma } from 'src/utils/prisma';

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

  const existing = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log('Admin already exists');
    return;
  }

  let adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    adminRole = await prisma.role.create({
      data: { name: 'ADMIN' },
    });
  }

  const hash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hash,
      name: 'System Administrator',
      roleId: adminRole.id,
    },
  });

  console.log('Admin user created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
