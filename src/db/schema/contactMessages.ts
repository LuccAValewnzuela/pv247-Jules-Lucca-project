import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";


export const contactMessages = sqliteTable('contact_messages', {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    name: text('name').notNull(),
    email: text('email').notNull(),
    message: text('message').notNull(),
    handledAt: integer('handled_at', { mode: "timestamp" }),
    createdAt: integer('created_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type ContactMessage = typeof contactMessages.$inferSelect;
