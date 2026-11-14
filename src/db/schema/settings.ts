import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const settings = sqliteTable('settings', {
	id: integer('id').primaryKey().default(1),
	businessName: text('business_name').notNull(),
	iban: text('iban').notNull(),
	bankAccount: text('bank_account'),
	bankName: text('bank_name'),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
		.$onUpdate(() => new Date())
});

export type Settings = typeof settings.$inferSelect;
