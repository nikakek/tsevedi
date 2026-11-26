import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Read leniently: `prisma generate` (run on every `npm install`, e.g. on Netlify/Vercel before env
    // vars matter) needs no database. Commands that connect, like `migrate deploy`, fail clearly if it's missing.
    url: process.env.DATABASE_URL,
  },
});
