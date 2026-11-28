'use server';

import { and, eq, gt, gte, lt, lte, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { assertTherapist, assertUser, isTherapist } from '@/auth/session';
import { db } from '@/db/client';
import {
	availabilityBlocks,
	bookings,
	clients,
	sessionTypes
} from '@/db/schema';
import { parsePragueDateTimeLocal } from '@/lib/availability';
import {
	bookingIdSchema,
	canCancel,
	cancelBookingSchema,
	createBookingSchema,
	rescheduleBookingSchema,
	toSlotOptions,
	type BookingActionState,
	type BookingFieldErrors,
	type SlotOption
} from '@/lib/bookings';
import { getBookableSlots } from '@/server/bookings';

const bookPath = '/book';
const myBookingsPath = '/my-bookings';
const dashboardBookingsPath = '/dashboard/bookings';

type BookingTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type ValidateSlotOptions = {
	sessionTypeId: string;
	startsAt: Date;
	excludeBookingId?: string;
};

const revalidateBookingPaths = () => {
	revalidatePath(bookPath);
	revalidatePath(myBookingsPath);
	revalidatePath(dashboardBookingsPath);
};

const validateSlot = async (
	tx: BookingTransaction,
	{ sessionTypeId, startsAt, excludeBookingId }: ValidateSlotOptions
) => {
	const sessionTypeRows = await tx
		.select()
		.from(sessionTypes)
		.where(
			and(eq(sessionTypes.id, sessionTypeId), eq(sessionTypes.isActive, true))
		)
		.limit(1);
	const sessionType = sessionTypeRows[0];

	if (!sessionType) {
		return {
			success: false as const,
			message: 'This session type is not available.'
		};
	}

	const endsAt = new Date(
		startsAt.getTime() + sessionType.durationMinutes * 60_000
	);

	if (startsAt <= new Date()) {
		return {
			success: false as const,
			message: 'The selected time has passed.'
		};
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
		return {
			success: false as const,
			message: 'The selected time is not available.'
		};
	}

	const overlapping = await tx
		.select({ id: bookings.id })
		.from(bookings)
		.where(
			and(
				ne(bookings.status, 'cancelled'),
				lt(bookings.startsAt, endsAt),
				gt(bookings.endsAt, startsAt),
				excludeBookingId ? ne(bookings.id, excludeBookingId) : undefined
			)
		)
		.limit(1);

	if (overlapping.length > 0) {
		return { success: false as const, message: 'This slot is already booked.' };
	}

	return {
		success: true as const,
		availabilityBlockId: blockRows[0].id,
		endsAt,
		priceCents: sessionType.priceCents
	};
};

export const getSlotsForSessionType = async (
	sessionTypeId: string,
	excludeBookingId?: string
): Promise<{ slots: SlotOption[] }> => {
	const session = await assertUser();

	const parsedId =
		createBookingSchema.shape.sessionTypeId.safeParse(sessionTypeId);
	if (!parsedId.success) return { slots: [] };

	const parsedExcludeBookingId = excludeBookingId
		? bookingIdSchema.safeParse(excludeBookingId)
		: null;

	if (
		excludeBookingId &&
		(!parsedExcludeBookingId?.success || !isTherapist(session))
	) {
		return { slots: [] };
	}

	const result = await getBookableSlots(parsedId.data, {
		excludeBookingId: parsedExcludeBookingId?.success
			? parsedExcludeBookingId.data
			: undefined
	});
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

		const slot = await validateSlot(tx, {
			sessionTypeId: parsed.data.sessionTypeId,
			startsAt
		});
		if (!slot.success) return slot;

		await tx.insert(bookings).values({
			clientId: client.id,
			sessionTypeId: parsed.data.sessionTypeId,
			availabilityBlockId: slot.availabilityBlockId,
			priceCents: slot.priceCents,
			format: parsed.data.format,
			startsAt,
			endsAt: slot.endsAt,
			status: 'pending',
			notes: parsed.data.notes || null
		});

		return { success: true };
	});

	if (!result.success) return result;

	revalidateBookingPaths();
	redirect(myBookingsPath);
};

export const confirmBooking = async (
	_prevState: BookingActionState,
	formData: FormData
): Promise<BookingActionState> => {
	await assertTherapist();

	const parsed = bookingIdSchema.safeParse(formData.get('bookingId'));
	if (!parsed.success) {
		return { message: 'Invalid booking.' };
	}

	const result = await db.transaction(async tx => {
		const rows = await tx
			.select()
			.from(bookings)
			.where(eq(bookings.id, parsed.data))
			.limit(1);
		const booking = rows[0];

		if (!booking) {
			return { message: 'Booking not found.' };
		}

		if (booking.status !== 'pending') {
			return { message: 'Only pending bookings can be confirmed.' };
		}

		await tx
			.update(bookings)
			.set({ status: 'confirmed' })
			.where(eq(bookings.id, booking.id));

		return { success: true };
	});

	if (result.success) revalidateBookingPaths();

	return result;
};

export const rescheduleBooking = async (
	_prevState: BookingActionState,
	formData: FormData
): Promise<BookingActionState> => {
	await assertTherapist();

	const parsed = rescheduleBookingSchema.safeParse({
		bookingId: formData.get('bookingId'),
		startsAt: formData.get('startsAt')
	});

	if (!parsed.success) {
		return { message: 'Enter a valid date and time.' };
	}

	const startsAt = parsePragueDateTimeLocal(parsed.data.startsAt);
	if (!startsAt) {
		return { message: 'Enter a valid Prague date and time.' };
	}

	const result = await db.transaction(async tx => {
		const rows = await tx
			.select()
			.from(bookings)
			.where(eq(bookings.id, parsed.data.bookingId))
			.limit(1);
		const booking = rows[0];

		if (!booking) {
			return { message: 'Booking not found.' };
		}

		if (booking.status !== 'pending' && booking.status !== 'confirmed') {
			return { message: 'This booking can no longer be rescheduled.' };
		}

		const slot = await validateSlot(tx, {
			sessionTypeId: booking.sessionTypeId,
			startsAt,
			excludeBookingId: booking.id
		});
		if (!slot.success) return slot;

		await tx
			.update(bookings)
			.set({
				status: 'cancelled',
				cancelledBy: 'therapist',
				cancelledAt: new Date()
			})
			.where(eq(bookings.id, booking.id));

		await tx.insert(bookings).values({
			clientId: booking.clientId,
			sessionTypeId: booking.sessionTypeId,
			availabilityBlockId: slot.availabilityBlockId,
			priceCents: booking.priceCents,
			format: booking.format,
			startsAt,
			endsAt: slot.endsAt,
			status: 'confirmed',
			videoCallUrl: booking.videoCallUrl,
			notes: booking.notes,
			rescheduledFromId: booking.id
		});

		return { success: true };
	});

	if (result.success) revalidateBookingPaths();

	return result;
};

export const cancelBooking = async (
	_prevState: BookingActionState,
	formData: FormData
): Promise<BookingActionState> => {
	const session = await assertUser();
	const therapist = isTherapist(session);

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

		if (!row || (!therapist && row.userId !== session.user.id)) {
			return { message: 'Booking not found.' };
		}

		if (!canCancel(row.booking.status, row.booking.startsAt, therapist)) {
			return { message: 'This booking can no longer be cancelled.' };
		}

		await tx
			.update(bookings)
			.set({
				status: 'cancelled',
				cancelledBy: therapist ? 'therapist' : 'client',
				cancelledAt: new Date()
			})
			.where(eq(bookings.id, parsed.data));

		return { success: true };
	});

	if (result.success) revalidateBookingPaths();

	return result;
};
