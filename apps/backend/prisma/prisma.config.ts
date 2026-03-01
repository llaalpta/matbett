/**
 * Prisma 7 Configuration
 * https://pris.ly/d/prisma7-client-config
 */

export default {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://matbett_user:matbett_password_dev@localhost:5432/matbett_db',
    },
  },
};
