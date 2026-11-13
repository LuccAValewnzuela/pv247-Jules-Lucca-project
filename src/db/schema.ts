// TODO: model the domain tables here, e.g.:
// - users (client accounts via SSO, plus the therapist/admin account)
// - clients (also clients without an account, created by the therapist)
// - sessionTypes (name, duration, price, in-person/online)
// - availabilityBlocks (therapist-published time blocks)
// - bookings (state: pending | confirmed | completed | cancelled, start, end,
//   format: in-person | online, video call link, payment reference)
// - clientNotes (dated private notes, visible to therapist only)
// - blogCategories / blogPosts (title, content, isPublic flag)
// - settings (bank account details for payment instructions)
// Then run `npm run db:generate` and `npm run db:migrate`.

export {};
