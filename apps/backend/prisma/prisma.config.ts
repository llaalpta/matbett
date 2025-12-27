/**
 * Prisma 7 Configuration
 * https://pris.ly/d/prisma7-client-config
 */

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/matbett?schema=public',
    },
  },
};
