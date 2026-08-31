/// <reference types="temporal-polyfill/types/global" />
import 'temporal-polyfill/full/global';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

// Next.js already injects `.env.local`. CLI scripts do not, and they have
// `import.meta.dirname`. Skip dotenv when the runtime URL is already present.
if (!process.env['DATABASE_URL']) {
  const envFile = import.meta.dirname
    ? resolve(import.meta.dirname, '../../.env.local')
    : resolve(process.cwd(), '.env.local');
  dotenv.config({ path: envFile });
}

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
