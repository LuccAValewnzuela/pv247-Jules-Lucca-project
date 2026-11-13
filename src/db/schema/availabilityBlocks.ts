import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";


export const availabilityBlocks = sqliteTable('availability_blocks', {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    startsAt: integer('starts_at', { mode: "timestamp" }).notNull(),
    endsAt: integer('ends_at', { mode: "timestamp" }).notNull(),
    createdAt: integer('created_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type AvailabilityBlock = typeof availabilityBlocks.$inferSelect;
