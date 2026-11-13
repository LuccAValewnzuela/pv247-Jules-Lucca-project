import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";


export const settings = sqliteTable('settings', {
    id: integer('id').primaryKey().default(1),
    businessName: text('business_name').notNull(),
    iban: text('iban').notNull(),
    bankAccount: text('bank_account'),
    bankName: text('bank_name'),
    updatedAt: integer('updated_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type Settings = typeof settings.$inferSelect;
