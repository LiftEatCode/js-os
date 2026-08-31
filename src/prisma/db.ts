/// <reference types="temporal-polyfill/types/global" />
import 'temporal-polyfill/full/global';
import { resolve } from 'node:path';
import dotenv from 'dotenv';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

dotenv.config({ path: resolve(import.meta.dirname, '../../.env.local') });

export const db = postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL']!,
});
