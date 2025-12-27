
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';

// Replicar la configuración de src/lib/prisma.ts para el seed
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://matbett_user:matbett_password_dev@localhost:5432/matbett_db?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ID que coincide con el hardcodeado en src/services/promotion.service.ts (o context)
  // En promotion.service.ts dice 'temp-user', pero en context.ts dice 'clsm06wts000008ju328l6z1w'
  // El error decía que fallaba la foreign key con el usuario que se estaba pasando.
  // Vamos a crear AMBOS para estar seguros, ya que vi 'temp-user' en promotion.service.ts
  
  const idsToCreate = ['clsm06wts000008ju328l6z1w', 'temp-user'];

  for (const id of idsToCreate) {
    const user = await prisma.user.upsert({
      where: { id },
      update: {},
      create: {
        id,
        email: `dev_${id}@matbett.com`,
        name: 'Developer User',
        hashedPassword: 'password_placeholder',
      },
    });
    console.log(`User ensured: ${user.id}`);
  }
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
