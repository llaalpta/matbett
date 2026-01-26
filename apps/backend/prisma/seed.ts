
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// Replicar la configuración de src/lib/prisma.ts para el seed
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://matbett_user:matbett_password_dev@localhost:5432/matbett_db',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Development user ID (hardcoded in src/trpc/context.ts)
  const devUserId = 'clsm06wts000008ju328l6z1w';

  const user = await prisma.user.upsert({
    where: { id: devUserId },
    update: {},
    create: {
      id: devUserId,
      email: 'dev@matbett.com',
      name: 'Developer User',
      hashedPassword: 'password_placeholder',
    },
  });
  console.log(`User ensured: ${user.id}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
