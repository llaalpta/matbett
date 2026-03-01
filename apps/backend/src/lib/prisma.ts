/**
 * Prisma Client Singleton
 * Instancia limpia y estándar del cliente de base de datos.
 * Configurado para Prisma 7 con PostgreSQL adapter
 */

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Crear pool de conexiones PostgreSQL
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://matbett_user:matbett_password_dev@localhost:5432/matbett_db',
});

// Crear adapter
const adapter = new PrismaPg(pool);

// Inicializar Prisma Client con adapter
export const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Graceful shutdown para evitar conexiones colgadas
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await pool.end();
});