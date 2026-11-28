import { parsePragueDateTimeLocal } from '@/lib/availability';
import type { BookingFormat, BookingStatus } from '@/lib/bookings';

const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const praguePartsFormatter = new Intl.DateTimeFormat('en-US', {
	timeZone: 'Europe/Prague',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit',
	hour: '2-digit',
	minute: '2-digit',
	hourCycle: 'h23'
});

const monthLabelFormatter = new Intl.DateTimeFormat('en-GB', {
	timeZone: 'Europe/Prague',
	month: 'long',
	year: 'numeric'
});

const SESSION_TYPE_COLORS = [
	{ swatch: 'bg-sky-500', chip: 'border-sky-200 bg-sky-50 text-sky-900' },
	{
		swatch: 'bg-violet-500',
		chip: 'border-violet-200 bg-violet-50 text-violet-900'
	},
	{
		swatch: 'bg-emerald-500',
		chip: 'border-emerald-200 bg-emerald-50 text-emerald-900'
	},
	{
		swatch: 'bg-amber-500',
		chip: 'border-amber-200 bg-amber-50 text-amber-900'
	},
	{ swatch: 'bg-rose-500', chip: 'border-rose-200 bg-rose-50 text-rose-900' },
	{ swatch: 'bg-teal-500', chip: 'border-teal-200 bg-teal-50 text-teal-900' }
] as const;

const pad = (value: number) => String(value).padStart(2, '0');

const pragueDateKey = (date: Date): string => {
	const parts = praguePartsFormatter.formatToParts(date);
	const value = (type: Intl.DateTimeFormatPartTypes) =>
		parts.find(part => part.type === type)?.value ?? '';

	return `${value('year')}-${value('month')}-${value('day')}`;
};

export type Month = {
	year: number;
	month: number;
	key: string;
};

export type CalendarDay = {
	date: string;
	day: number;
	inMonth: boolean;
	isToday: boolean;
};

export type SessionTypeColor = (typeof SESSION_TYPE_COLORS)[number];

export type CalendarEventSource = {
	id: string;
	startsAt: Date;
	endsAt: Date;
	notes: string | null;
	format: BookingFormat;
	status: BookingStatus;
	sessionType: { name: string };
};

export type CalendarEvent = {
	uid: string;
	title: string;
	startsAt: string;
	endsAt: string;
	description: string;
	location: string;
};

export const parseMonthParam = (value: unknown): Month => {
	if (typeof value === 'string') {
		const match = MONTH_PATTERN.exec(value);
		if (match) {
			const year = Number(match[1]);
			const month = Number(match[2]);
			return { year, month, key: value };
		}
	}

	const today = pragueDateKey(new Date());
	const year = Number(today.slice(0, 4));
	const month = Number(today.slice(5, 7));

	return { year, month, key: `${year}-${pad(month)}` };
};

export const shiftMonth = ({ year, month }: Month, delta: number): Month => {
	const date = new Date(Date.UTC(year, month - 1 + delta, 1));
	const shiftedYear = date.getUTCFullYear();
	const shiftedMonth = date.getUTCMonth() + 1;

	return {
		year: shiftedYear,
		month: shiftedMonth,
		key: `${shiftedYear}-${pad(shiftedMonth)}`
	};
};

export const formatMonthLabel = ({ year, month }: Month): string =>
	monthLabelFormatter.format(new Date(Date.UTC(year, month - 1, 1)));

export const pragueMonthBounds = ({ year, month }: Month): [Date, Date] => {
	const start = parsePragueDateTimeLocal(`${year}-${pad(month)}-01T00:00`);
	const next = new Date(Date.UTC(year, month, 1));
	const end = parsePragueDateTimeLocal(
		`${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-01T00:00`
	);

	if (!start || !end) throw new Error('Invalid month');

	return [start, end];
};

export const buildMonthGrid = (
	{ year, month }: Month,
	todayKey = pragueDateKey(new Date())
): CalendarDay[] => {
	const first = new Date(Date.UTC(year, month - 1, 1));
	const weekdayOffset = (first.getUTCDay() + 6) % 7;
	const gridStart = new Date(first.getTime() - weekdayOffset * 86_400_000);

	return Array.from({ length: 42 }, (_, index) => {
		const date = new Date(gridStart.getTime() + index * 86_400_000);
		const key = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

		return {
			date: key,
			day: date.getUTCDate(),
			inMonth:
				date.getUTCMonth() + 1 === month && date.getUTCFullYear() === year,
			isToday: key === todayKey
		};
	});
};

export const sessionTypeColor = (sessionTypeId: string): SessionTypeColor => {
	let hash = 0;
	for (const character of sessionTypeId) {
		hash = (hash * 31 + character.charCodeAt(0)) | 0;
	}

	return SESSION_TYPE_COLORS[Math.abs(hash) % SESSION_TYPE_COLORS.length];
};

export const toCalendarEvent = ({
	id,
	startsAt,
	endsAt,
	notes,
	format,
	sessionType
}: CalendarEventSource): CalendarEvent => ({
	uid: id,
	title: sessionType.name,
	startsAt: startsAt.toISOString(),
	endsAt: endsAt.toISOString(),
	description: notes ?? '',
	location: format === 'online' ? 'Online' : 'In person'
});
