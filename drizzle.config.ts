import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
    ...(process.env.DATABASE_AUTH_TOKEN && {
      authToken: process.env.DATABASE_AUTH_TOKEN,
    }),
  },
});
