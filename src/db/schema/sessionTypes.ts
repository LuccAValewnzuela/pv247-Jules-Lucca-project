import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";


export const sessionTypes = sqliteTable('session_types', {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    name: text('name').notNull(),
    description: text('description').notNull(),
    durationMinutes: integer('duration_minutes').notNull(),
    priceCents: integer('price_cents').notNull(),
    isActive: integer('is_active', { mode: "boolean" }).notNull().default(true),
    createdAt: integer('created_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type SessionType = typeof sessionTypes.$inferSelect;
