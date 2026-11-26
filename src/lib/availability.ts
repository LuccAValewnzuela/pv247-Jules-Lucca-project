import z from 'zod';

const DATE_TIME_LOCAL_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const praguePartsFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Europe/Prague',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

const pragueDateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Europe/Prague',
	dateStyle: 'medium',
	timeStyle: 'short'
});

const pragueDateFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Europe/Prague',
	day: '2-digit',
	month: 'short',
	year: 'numeric'
});

const pragueTimeFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Europe/Prague',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

const eurFormatter = new Intl.NumberFormat('en-GB', {
	style: 'currency',
	currency: 'EUR'
});

type PragueParts = {
	year: number;
	month: number;
	day: number;
	hour: number;
	minute: number;
};

const getPragueParts = (date: Date): PragueParts => {
	const parts = praguePartsFormatter.formatToParts(date);
	const partValue = (type: string) =>
		Number(parts.find(part => part.type === type)?.value);

	return {
		year: partValue('year'),
		month: partValue('month'),
		day: partValue('day'),
		hour: partValue('hour'),
		minute: partValue('minute')
	};
};

const isSameParts = (parts: PragueParts, expected: PragueParts) =>
	parts.year === expected.year &&
	parts.month === expected.month &&
	parts.day === expected.day &&
	parts.hour === expected.hour &&
	parts.minute === expected.minute;

export const parsePragueDateTimeLocal = (value: string): Date | null => {
	const match = DATE_TIME_LOCAL_PATTERN.exec(value);
	if (!match) return null;

	const [year, month, day, hour, minute] = match.slice(1).map(Number);
	const expected = { year, month, day, hour, minute };
	const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute));

	if (Number.isNaN(utcGuess.getTime())) return null;

	const guessParts = getPragueParts(utcGuess);
	const pragueOffsetMs =
		Date.UTC(
			guessParts.year,
			guessParts.month - 1,
			guessParts.day,
			guessParts.hour,
			guessParts.minute
		) - utcGuess.getTime();
	const result = new Date(utcGuess.getTime() - pragueOffsetMs);

	return isSameParts(getPragueParts(result), expected) ? result : null;
};

export const formatPragueDateTime = (date: Date) =>
	pragueDateTimeFormatter.format(date);

export const formatPragueDate = (date: Date) =>
	pragueDateFormatter.format(date);

export const formatTimeRange = (startsAt: Date, endsAt: Date) =>
	`${pragueTimeFormatter.format(startsAt)}–${pragueTimeFormatter.format(endsAt)}`;

export const formatPriceCents = (priceCents: number) =>
	eurFormatter.format(priceCents / 100);

export const formatDuration = (startsAt: Date, endsAt: Date) => {
	const minutes = Math.max(
		0,
		Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000)
	);
	const hours = Math.floor(minutes / 60);
	const remainder = minutes % 60;

	if (hours === 0) return `${remainder} min`;
	if (remainder === 0) return `${hours} h`;

	return `${hours} h ${remainder} min`;
};

export const availabilityBlockIdSchema = z
	.string()
	.regex(/^[0-9a-f]{32}$/, 'Invalid availability block.');

const dateTimeLocalSchema = z
	.string()
	.regex(DATE_TIME_LOCAL_PATTERN, 'Use a valid date and time.');

export const availabilityFormSchema = z
	.object({
		startsAt: dateTimeLocalSchema,
		endsAt: dateTimeLocalSchema
	})
	.superRefine(({ startsAt, endsAt }, ctx) => {
		const parsedStart = parsePragueDateTimeLocal(startsAt);
		const parsedEnd = parsePragueDateTimeLocal(endsAt);
		const now = new Date();

		if (!parsedStart) {
			ctx.addIssue({
				code: 'custom',
				path: ['startsAt'],
				message: 'Enter a valid Prague date and time.'
			});
		} else if (parsedStart <= now) {
			ctx.addIssue({
				code: 'custom',
				path: ['startsAt'],
				message: 'Start must be in the future.'
			});
		}

		if (!parsedEnd) {
			ctx.addIssue({
				code: 'custom',
				path: ['endsAt'],
				message: 'Enter a valid Prague date and time.'
			});
		} else if (parsedStart && parsedEnd <= parsedStart) {
			ctx.addIssue({
				code: 'custom',
				path: ['endsAt'],
				message: 'End must be after start.'
			});
		}
	});

export const availabilityBlockSchema = z
	.object({
		startsAt: z.date(),
		endsAt: z.date()
	})
	.refine(({ startsAt, endsAt }) => endsAt > startsAt, {
		path: ['endsAt'],
		message: 'End must be after start.'
	});

export type AvailabilityFormValues = z.infer<typeof availabilityFormSchema>;
export type AvailabilityFieldErrors = Partial<
	Record<keyof AvailabilityFormValues, string[]>
>;
export type AvailabilityActionState = {
	errors?: AvailabilityFieldErrors;
	message?: string;
	success?: boolean;
};

export const initialAvailabilityActionState: AvailabilityActionState = {};
