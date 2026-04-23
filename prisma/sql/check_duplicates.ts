import 'dotenv/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../generated/prisma/client';

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 5,
  allowPublicKeyRetrieval: true,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const rows = (await prisma.$queryRawUnsafe(
    'SELECT userId, voucherId, COUNT(*) AS cnt FROM `Order` WHERE voucherId IS NOT NULL GROUP BY userId, voucherId HAVING COUNT(*) > 1',
  )) as Array<{ userId: string; voucherId: string; cnt: bigint | number }>;

  console.log(rows);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
