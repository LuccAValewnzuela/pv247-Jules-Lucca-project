import { sql } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const blogCategories = sqliteTable('blog_categories', {
	id: text('id')
		.primaryKey()
		.default(sql`(lower(hex(randomblob(16))))`),
	name: text('name').notNull().unique(),
	slug: text('slug').notNull().unique()
});

export type BlogCategory = typeof blogCategories.$inferSelect;
