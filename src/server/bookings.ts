import 'server-only';
import { and, asc, desc, eq, gte, lt, ne, or } from 'drizzle-orm';

import { db } from '@/db/client';
import {
	availabilityBlocks,
	bookings,
	clients,
	sessionTypes
} from '@/db/schema';
import { generateSlots } from '@/lib/bookings';
import { pragueMonthBounds, type Month } from '@/lib/calendar';

export const getClientForUser = async (userId: string) => {
	const rows = await db
		.select()
		.from(clients)
		.where(eq(clients.userId, userId))
		.limit(1);

	return rows[0] ?? null;
};

export const getActiveSessionTypes = async () =>
	db
		.select()
		.from(sessionTypes)
		.where(eq(sessionTypes.isActive, true))
		.orderBy(asc(sessionTypes.name));

export const getBookableSlots = async (sessionTypeId: string) => {
	const sessionTypeRows = await db
		.select()
		.from(sessionTypes)
		.where(
			and(eq(sessionTypes.id, sessionTypeId), eq(sessionTypes.isActive, true))
		)
		.limit(1);

	const sessionType = sessionTypeRows[0];
	if (!sessionType) return null;

	const now = new Date();

	const blocks = await db
		.select()
		.from(availabilityBlocks)
		.where(gte(availabilityBlocks.endsAt, now))
		.orderBy(asc(availabilityBlocks.startsAt));

	const taken = await db
		.select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt })
		.from(bookings)
		.where(and(ne(bookings.status, 'cancelled'), gte(bookings.endsAt, now)));

	const slots = blocks.flatMap(block =>
		generateSlots({
			availabilityBlockId: block.id,
			blockStart: block.startsAt,
			blockEnd: block.endsAt,
			durationMinutes: sessionType.durationMinutes,
			taken,
			now
		})
	);

	return { sessionType, slots };
};

export const getMyBookings = async (userId: string) => {
	const client = await getClientForUser(userId);
	if (!client) return null;

	const now = new Date();

	const [upcoming, past] = await Promise.all([
		db.query.bookings.findMany({
			where: and(
				eq(bookings.clientId, client.id),
				ne(bookings.status, 'cancelled'),
				gte(bookings.startsAt, now)
			),
			orderBy: [asc(bookings.startsAt)],
			with: { sessionType: true }
		}),
		db.query.bookings.findMany({
			where: and(
				eq(bookings.clientId, client.id),
				or(eq(bookings.status, 'cancelled'), lt(bookings.startsAt, now))
			),
			orderBy: [desc(bookings.startsAt)],
			with: { sessionType: true }
		})
	]);

	return { upcoming, past };
};

export const getMyBookingsForMonth = async (userId: string, month: Month) => {
	const client = await getClientForUser(userId);
	if (!client) return null;

	const [start, end] = pragueMonthBounds(month);

	return db.query.bookings.findMany({
		where: and(
			eq(bookings.clientId, client.id),
			gte(bookings.startsAt, start),
			lt(bookings.startsAt, end),
			ne(bookings.status, 'cancelled')
		),
		orderBy: [asc(bookings.startsAt)],
		with: { sessionType: true }
	});
};

export type ActiveSessionType = Awaited<
	ReturnType<typeof getActiveSessionTypes>
>[number];

export type BookableSlots = NonNullable<
	Awaited<ReturnType<typeof getBookableSlots>>
>;

export type MyBooking = NonNullable<
	Awaited<ReturnType<typeof getMyBookings>>
>['upcoming'][number];

export type MonthBooking = NonNullable<
	Awaited<ReturnType<typeof getMyBookingsForMonth>>
>[number];
