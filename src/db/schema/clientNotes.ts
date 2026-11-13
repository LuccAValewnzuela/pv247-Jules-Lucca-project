import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { clients } from "./clients";
import { sql } from "drizzle-orm";


export const clientNotes = sqliteTable('client_notes', {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    clientId: text('client_id').notNull().references(() => clients.id),
    noteDate: integer('note_date', { mode: "timestamp" }).notNull(),
    content: text('content').notNull(),
    createdAt: integer('created_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type ClientNote = typeof clientNotes.$inferSelect;
