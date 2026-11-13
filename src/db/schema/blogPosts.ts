import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { blogCategories } from "./blogCategories";
import { sql } from "drizzle-orm";


export const blogPosts = sqliteTable('blog_posts', {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    title: text('title').notNull(),
    slug: text('slug').notNull().unique(),
    excerpt: text('excerpt'),
    content: text('content').notNull(),
    categoryId: text('category_id').notNull().references(() => blogCategories.id),
    isPublic: integer('is_public', { mode: "boolean" }).notNull().default(false),
    publishedAt: integer('published_at', { mode: "timestamp" }),
    createdAt: integer('created_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type BlogPost = typeof blogPosts.$inferSelect;
