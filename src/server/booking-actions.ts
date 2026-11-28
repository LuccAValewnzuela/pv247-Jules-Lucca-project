'use server';

import { and, eq, gt, gte, lt, lte, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { assertUser, isTherapist } from '@/auth/session';
import { db } from '@/db/client';
import {
	availabilityBlocks,
	bookings,
	clients,
	sessionTypes
} from '@/db/schema';
import { parsePragueDateTimeLocal } from '@/lib/availability';
import {
	canClientCancel,
	cancelBookingSchema,
	createBookingSchema,
	toSlotOptions,
	type BookingActionState,
	type BookingFieldErrors,
	type SlotOption
} from '@/lib/bookings';
import { getBookableSlots } from '@/server/bookings';

const bookPath = '/book';
const myBookingsPath = '/my-bookings';

export const getSlotsForSessionType = async (
	sessionTypeId: string
): Promise<{ slots: SlotOption[] }> => {
	await assertUser();

	const parsedId =
		createBookingSchema.shape.sessionTypeId.safeParse(sessionTypeId);
	if (!parsedId.success) return { slots: [] };

	const result = await getBookableSlots(parsedId.data);
	return { slots: toSlotOptions(result?.slots ?? []) };
};

export const createBooking = async (
	_prevState: BookingActionState,
	formData: FormData
): Promise<BookingActionState> => {
	const session = await assertUser();
	if (isTherapist(session)) {
		return { message: 'Therapists cannot create client bookings.' };
	}

	const parsed = createBookingSchema.safeParse({
		sessionTypeId: formData.get('sessionTypeId'),
		format: formData.get('format'),
		startsAt: formData.get('startsAt'),
		notes: formData.get('notes')
	});

	if (!parsed.success) {
		return {
			errors: parsed.error.flatten().fieldErrors as BookingFieldErrors
		};
	}

	const startsAt = parsePragueDateTimeLocal(parsed.data.startsAt);
	if (!startsAt) {
		return { message: 'Enter a valid Prague date and time.' };
	}

	const result = await db.transaction(async tx => {
		const clientRows = await tx
			.select({ id: clients.id })
			.from(clients)
			.where(eq(clients.userId, session.user.id))
			.limit(1);
		const client = clientRows[0];

		if (!client) {
			return { message: 'Client profile not found.' };
		}

		const sessionTypeRows = await tx
			.select()
			.from(sessionTypes)
			.where(
				and(
					eq(sessionTypes.id, parsed.data.sessionTypeId),
					eq(sessionTypes.isActive, true)
				)
			)
			.limit(1);
		const sessionType = sessionTypeRows[0];

		if (!sessionType) {
			return { message: 'This session type is not available.' };
		}

		const endsAt = new Date(
			startsAt.getTime() + sessionType.durationMinutes * 60_000
		);

		if (startsAt <= new Date()) {
			return { message: 'The selected time has passed.' };
		}

		const blockRows = await tx
			.select({ id: availabilityBlocks.id })
			.from(availabilityBlocks)
			.where(
				and(
					lte(availabilityBlocks.startsAt, startsAt),
					gte(availabilityBlocks.endsAt, endsAt)
				)
			)
			.limit(2);

		if (blockRows.length !== 1) {
			return { message: 'The selected time is not available.' };
		}

		const overlapping = await tx
			.select({ id: bookings.id })
			.from(bookings)
			.where(
				and(
					ne(bookings.status, 'cancelled'),
					lt(bookings.startsAt, endsAt),
					gt(bookings.endsAt, startsAt)
				)
			)
			.limit(1);

		if (overlapping.length > 0) {
			return { message: 'This slot is already booked.' };
		}

		await tx.insert(bookings).values({
			clientId: client.id,
			sessionTypeId: sessionType.id,
			availabilityBlockId: blockRows[0].id,
			priceCents: sessionType.priceCents,
			format: parsed.data.format,
			startsAt,
			endsAt,
			status: 'pending',
			notes: parsed.data.notes || null
		});

		return { success: true };
	});

	if (!result.success) return result;

	revalidatePath(bookPath);
	revalidatePath(myBookingsPath);
	redirect(myBookingsPath);
};

export const cancelBooking = async (
	_prevState: BookingActionState,
	formData: FormData
): Promise<BookingActionState> => {
	const session = await assertUser();
	if (isTherapist(session)) {
		return { message: 'Therapists cannot cancel client bookings here.' };
	}

	const parsed = cancelBookingSchema.safeParse(formData.get('bookingId'));
	if (!parsed.success) {
		return { message: 'Invalid booking.' };
	}

	const result = await db.transaction(async tx => {
		const rows = await tx
			.select({ booking: bookings, userId: clients.userId })
			.from(bookings)
			.innerJoin(clients, eq(bookings.clientId, clients.id))
			.where(eq(bookings.id, parsed.data))
			.limit(1);
		const row = rows[0];

		if (!row || row.userId !== session.user.id) {
			return { message: 'Booking not found.' };
		}

		if (!canClientCancel(row.booking.status, row.booking.startsAt)) {
			return { message: 'This booking can no longer be cancelled.' };
		}

		await tx
			.update(bookings)
			.set({
				status: 'cancelled',
				cancelledBy: 'client',
				cancelledAt: new Date()
			})
			.where(eq(bookings.id, parsed.data));

		return { success: true };
	});

	if (result.success) {
		revalidatePath(bookPath);
		revalidatePath(myBookingsPath);
	}

	return result;
};
