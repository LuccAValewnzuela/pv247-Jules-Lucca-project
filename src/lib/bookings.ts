import z from 'zod';

import { formatPragueDate, formatTimeRange } from '@/lib/availability';

const DATE_TIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const pragueLocalPartsFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Europe/Prague',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

export const SLOT_STEP_MINUTES = 30;
export const CANCEL_LEAD_MS = 48 * 60 * 60 * 1000;

export type BookingFormat = 'in_person' | 'online';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export const formatLabels: Record<BookingFormat, string> = {
	in_person: 'In person',
	online: 'Online'
};

export const statusLabels: Record<BookingStatus, string> = {
	pending: 'Pending confirmation',
	confirmed: 'Confirmed',
	completed: 'Completed',
	cancelled: 'Cancelled'
};

export type Interval = {
	startsAt: Date;
	endsAt: Date;
};

export type BookableSlot = Interval & {
	availabilityBlockId: string;
};

export type SlotOption = {
	value: string;
	label: string;
	date: string;
	dayLabel: string;
};

type GenerateSlotsOptions = {
	availabilityBlockId: string;
	blockStart: Date;
	blockEnd: Date;
	durationMinutes: number;
	taken?: Interval[];
	now?: Date;
};

export const intervalsOverlap = (a: Interval, b: Interval): boolean =>
	a.startsAt < b.endsAt && b.startsAt < a.endsAt;

export const generateSlots = ({
	availabilityBlockId,
	blockStart,
	blockEnd,
	durationMinutes,
	taken = [],
	now = new Date()
}: GenerateSlotsOptions): BookableSlot[] => {
	const durationMs = durationMinutes * 60_000;
	const stepMs = SLOT_STEP_MINUTES * 60_000;

	if (durationMs <= 0 || blockEnd <= blockStart) return [];

	const firstStartMs = Math.ceil(blockStart.getTime() / stepMs) * stepMs;
	const slots: BookableSlot[] = [];

	for (
		let startMs = firstStartMs;
		startMs + durationMs <= blockEnd.getTime();
		startMs += stepMs
	) {
		if (startMs < now.getTime()) continue;

		const startsAt = new Date(startMs);
		const endsAt = new Date(startMs + durationMs);
		const slot: Interval = { startsAt, endsAt };

		if (taken.some(interval => intervalsOverlap(slot, interval))) continue;

		slots.push({ availabilityBlockId, ...slot });
	}

	return slots;
};

export const canClientCancel = (
	status: BookingStatus,
	startsAt: Date,
	now = new Date()
): boolean =>
	(status === 'pending' || status === 'confirmed') &&
	startsAt.getTime() - now.getTime() >= CANCEL_LEAD_MS;

const pragueDateTimeLocalParts = (date: Date) => {
	const parts = pragueLocalPartsFormatter.formatToParts(date);
	return (type: Intl.DateTimeFormatPartTypes) =>
		parts.find(part => part.type === type)?.value ?? '';
};

export const toPragueDateKey = (date: Date): string => {
	const value = pragueDateTimeLocalParts(date);

	return `${value('year')}-${value('month')}-${value('day')}`;
};

export const toPragueDateTimeLocal = (date: Date): string => {
	const value = pragueDateTimeLocalParts(date);

	return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`;
};

export const toSlotOptions = (slots: BookableSlot[]): SlotOption[] =>
	slots.map(slot => ({
		value: toPragueDateTimeLocal(slot.startsAt),
		label: formatTimeRange(slot.startsAt, slot.endsAt),
		date: toPragueDateKey(slot.startsAt),
		dayLabel: formatPragueDate(slot.startsAt)
	}));

export const createBookingSchema = z.object({
	sessionTypeId: z.string().regex(/^[0-9a-f]{32}$/, 'Invalid session type id'),
	format: z.enum(['in_person', 'online']),
	startsAt: z
		.string()
		.regex(DATE_TIME_LOCAL_PATTERN, 'Use a valid date and time'),
	notes: z.string().max(1000, 'Note is too long').nullable()
});

export const cancelBookingSchema = z.object({
	bookingId: z.string().regex(/^[0-9a-f]{32}$/, 'Invalid booking')
});

export type BookingFieldErrors = Partial<
	Record<keyof z.infer<typeof createBookingSchema>, string[]>
>;

export type BookingActionState = {
	errors?: BookingFieldErrors;
	message?: string;
	success?: boolean;
};

export const initialBookingActionState: BookingActionState = {};
