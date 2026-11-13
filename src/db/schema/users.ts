import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const ROLES = ["client", "therapist"] as const;

export const users = sqliteTable('users', {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    email: text('email').unique().notNull(),
    name: text('name').notNull(),
    role: text('role', { enum: ROLES }).notNull().default('client'),
    createdAt: integer('created_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type User = typeof users.$inferSelect;
