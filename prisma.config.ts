import { resolve } from 'node:path';
import dotenv from 'dotenv';
import { definePrismaConfig } from '@prisma/cli-engine';
import { defineConfig as ormConfig } from '@prisma/orm-postgres/config';

dotenv.config({ path: resolve(import.meta.dirname, '.env.local') });

export default definePrismaConfig({
  orm: ormConfig({
    contract: "./src/prisma/contract.prisma",
    db: {
      connection: process.env['DIRECT_URL']!,
    },
  }),
});
