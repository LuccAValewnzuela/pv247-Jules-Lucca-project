import { asc, gte, ne } from 'drizzle-orm';

import { db } from '@/db/client';

export const getUpcomingAvailabilityBlocks = async () =>
	db.query.availabilityBlocks.findMany({
		where: block => gte(block.endsAt, new Date()),
		orderBy: block => [asc(block.startsAt)],
		with: {
			bookings: {
				where: booking => ne(booking.status, 'cancelled'),
				orderBy: booking => [asc(booking.startsAt)],
				with: {
					sessionType: true,
					client: true
				}
			}
		}
	});

export type AvailabilityBlockWithBookings = Awaited<
	ReturnType<typeof getUpcomingAvailabilityBlocks>
>[number];

export type BookedSession = AvailabilityBlockWithBookings['bookings'][number];
