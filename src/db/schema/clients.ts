import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { users } from "./users";
import { sql } from "drizzle-orm";


export const clients = sqliteTable('clients', {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    userId: text('user_id').references(() => users.id).unique(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    phone: text('phone'),
    feedToken: text('feed_token').notNull().unique().default(sql`(lower(hex(randomblob(32))))`),
    createdAt: integer('created_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type Client = typeof clients.$inferSelect;
