/**
 * Express Server with tRPC
 * Servidor HTTP principal con API REST y tRPC
 */

import 'dotenv/config'; // Load env vars
import express from 'express';
import cors from 'cors';
import * as trpcExpress from '@trpc/server/adapters/express';

import { appRouter } from '@matbett/api';
import { createContext } from './trpc/context';

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// MIDDLEWARE
// =============================================

// CORS - permitir requests del frontend
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger simple
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// =============================================
// ROUTES
// =============================================

// tRPC endpoint (principal)
app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// =============================================
// START SERVER
// =============================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`⚡ tRPC available at http://localhost:${PORT}/trpc`);
});
