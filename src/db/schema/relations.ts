import { relations } from "drizzle-orm";
import { availabilityBlocks } from "./availabilityBlocks";
import { blogCategories } from "./blogCategories";
import { blogPosts } from "./blogPosts";
import { bookings } from "./bookings";
import { clientNotes } from "./clientNotes";
import { clients } from "./clients";
import { sessionTypes } from "./sessionTypes";
import { users } from "./users";

export const usersRelations = relations(users, ({ one }) => ({
  client: one(clients),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  user: one(users, { fields: [clients.userId], references: [users.id] }),
  bookings: many(bookings),
  notes: many(clientNotes),
}));

export const sessionTypesRelations = relations(sessionTypes, ({ many }) => ({
  bookings: many(bookings),
}));

export const availabilityBlocksRelations = relations(availabilityBlocks, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  client: one(clients, { fields: [bookings.clientId], references: [clients.id] }),
  sessionType: one(sessionTypes, { fields: [bookings.sessionTypeId], references: [sessionTypes.id] }),
  availabilityBlock: one(availabilityBlocks, {
    fields: [bookings.availabilityBlockId],
    references: [availabilityBlocks.id],
  }),
  rescheduledFrom: one(bookings, {
    fields: [bookings.rescheduledFromId],
    references: [bookings.id],
    relationName: "reschedule",
  }),
  rescheduledTo: many(bookings, { relationName: "reschedule" }),
}));

export const clientNotesRelations = relations(clientNotes, ({ one }) => ({
  client: one(clients, { fields: [clientNotes.clientId], references: [clients.id] }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({
  posts: many(blogPosts),
}));

export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  category: one(blogCategories, { fields: [blogPosts.categoryId], references: [blogCategories.id] }),
}));
