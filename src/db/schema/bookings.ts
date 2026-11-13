import { sql } from "drizzle-orm";
import { integer, sqliteTable, text, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { availabilityBlocks } from "./availabilityBlocks";
import { clients } from "./clients";
import { sessionTypes } from "./sessionTypes";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
const FORMATS = ["in_person", "online"] as const;
const CANCELLED_BY = ["client", "therapist"] as const;


export const bookings = sqliteTable('bookings', {
    id: text('id').primaryKey().default(sql`(lower(hex(randomblob(16))))`),
    clientId: text('client_id').notNull().references(() => clients.id),
    sessionTypeId: text('session_type_id').notNull().references(() => sessionTypes.id),
    availabilityBlockId: text('availability_block_id').notNull().references(() => availabilityBlocks.id),
    priceCents: integer('price_cents').notNull(),
    format: text('format', { enum: FORMATS }).notNull(),
    startsAt: integer('starts_at', { mode: "timestamp" }).notNull(),
    endsAt: integer('ends_at', { mode: "timestamp" }).notNull(),
    status: text('status', { enum: STATUSES }).notNull().default('pending'),
    videoCallUrl: text('video_call_url'),
    cancelledBy: text('cancelled_by', { enum: CANCELLED_BY }),
    cancelledAt: integer('cancelled_at', { mode: "timestamp" }),
    rescheduledFromId: text('rescheduled_from_id').references((): AnySQLiteColumn => bookings.id),
    notes: text('notes'),
    createdAt: integer('created_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: "timestamp" }).notNull().default(sql`(unixepoch())`)
});

export type Booking = typeof bookings.$inferSelect;
