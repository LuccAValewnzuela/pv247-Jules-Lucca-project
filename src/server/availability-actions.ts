'use server';

import { and, eq, gt, inArray, lt } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

import { assertTherapist } from '@/auth/session';
import { db } from '@/db/client';
import { availabilityBlocks, bookings } from '@/db/schema';
import {
	availabilityBlockIdSchema,
	availabilityFormSchema,
	parsePragueDateTimeLocal,
	type AvailabilityActionState,
	type AvailabilityFieldErrors
} from '@/lib/availability';

const availabilityPath = '/dashboard/availability';

export const createAvailabilityBlock = async (
	_prevState: AvailabilityActionState,
	formData: FormData
): Promise<AvailabilityActionState> => {
	await assertTherapist();

	const parsed = availabilityFormSchema.safeParse({
		startsAt: formData.get('startsAt'),
		endsAt: formData.get('endsAt')
	});

	if (!parsed.success) {
		return {
			errors: parsed.error.flatten().fieldErrors as AvailabilityFieldErrors
		};
	}

	const startsAt = parsePragueDateTimeLocal(parsed.data.startsAt);
	const endsAt = parsePragueDateTimeLocal(parsed.data.endsAt);

	if (!startsAt || !endsAt) {
		return { message: 'Invalid availability block.' };
	}

	const result = await db.transaction(async tx => {
		const overlapping = await tx
			.select({ id: availabilityBlocks.id })
			.from(availabilityBlocks)
			.where(
				and(
					lt(availabilityBlocks.startsAt, endsAt),
					gt(availabilityBlocks.endsAt, startsAt)
				)
			)
			.limit(1);

		if (overlapping.length > 0) {
			return { message: 'This block overlaps an existing availability block.' };
		}

		await tx.insert(availabilityBlocks).values({ startsAt, endsAt });

		return { success: true };
	});

	if (result.success) revalidatePath(availabilityPath);

	return result;
};

export const deleteAvailabilityBlock = async (
	_prevState: AvailabilityActionState,
	formData: FormData
): Promise<AvailabilityActionState> => {
	await assertTherapist();

	const parsedId = availabilityBlockIdSchema.safeParse(formData.get('id'));
	if (!parsedId.success) {
		return { message: 'Invalid availability block.' };
	}

	const result = await db.transaction(async tx => {
		const block = await tx
			.select({ id: availabilityBlocks.id })
			.from(availabilityBlocks)
			.where(eq(availabilityBlocks.id, parsedId.data))
			.limit(1);

		if (block.length === 0) {
			return { message: 'Availability block not found.' };
		}

		const bookingsToDelete = await tx
			.select({ id: bookings.id })
			.from(bookings)
			.where(eq(bookings.availabilityBlockId, parsedId.data));

		const bookingIds = bookingsToDelete.map(booking => booking.id);

		if (bookingIds.length > 0) {
			await tx
				.update(bookings)
				.set({ rescheduledFromId: null })
				.where(inArray(bookings.rescheduledFromId, bookingIds));

			await tx.delete(bookings).where(inArray(bookings.id, bookingIds));
		}

		await tx
			.delete(availabilityBlocks)
			.where(eq(availabilityBlocks.id, parsedId.data));

		return { success: true };
	});

	if (result.success) revalidatePath(availabilityPath);

	return result;
};
