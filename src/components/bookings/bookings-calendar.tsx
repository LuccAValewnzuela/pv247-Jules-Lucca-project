'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/field-error';
import {
	formatDuration,
	formatPriceCents,
	formatPragueDateTime,
	formatTimeRange
} from '@/lib/availability';
import {
	canCancel,
	formatLabels,
	initialBookingActionState,
	statusLabels,
	toPragueDateKey
} from '@/lib/bookings';
import {
	formatMonthLabel,
	sessionTypeColor,
	shiftMonth,
	type CalendarDay,
	type Month
} from '@/lib/calendar';
import { cn } from '@/lib/cn';
import { cancelBooking, confirmBooking } from '@/server/booking-actions';
import type { MonthBooking } from '@/server/bookings';

import { RescheduleForm } from './reschedule-form';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type BookingsCalendarProps = {
	month: Month;
	days: CalendarDay[];
	bookings: MonthBooking[];
	todayMonthKey: string;
	isTherapist: boolean;
};

export const BookingsCalendar = ({
	month,
	days,
	bookings,
	todayMonthKey,
	isTherapist
}: BookingsCalendarProps) => {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [confirming, setConfirming] = useState(false);
	const [rescheduling, setRescheduling] = useState(false);
	const [confirmState, confirmAction, confirmPending] = useActionState(
		confirmBooking,
		initialBookingActionState
	);
	const [cancelState, cancelAction, cancelPending] = useActionState(
		cancelBooking,
		initialBookingActionState
	);

	const baseUrl = isTherapist ? '/dashboard/bookings' : '/my-bookings';

	const bookingsByDay = useMemo(() => {
		const grouped = new Map<string, MonthBooking[]>();

		for (const booking of bookings) {
			const key = toPragueDateKey(booking.startsAt);
			const dayBookings = grouped.get(key) ?? [];
			dayBookings.push(booking);
			grouped.set(key, dayBookings);
		}

		return grouped;
	}, [bookings]);

	const legend = useMemo(() => {
		const seen = new Set<string>();

		return bookings.filter(booking => {
			if (seen.has(booking.sessionType.id)) return false;
			seen.add(booking.sessionType.id);
			return true;
		});
	}, [bookings]);

	const selected = bookings.find(booking => booking.id === selectedId);

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-3">
					<Button asChild variant="outline" size="sm">
						<Link href={`${baseUrl}?month=${shiftMonth(month, -1).key}`}>
							Previous
						</Link>
					</Button>
					<h2 className="min-w-40 text-center text-lg font-semibold">
						{formatMonthLabel(month)}
					</h2>
					<Button asChild variant="outline" size="sm">
						<Link href={`${baseUrl}?month=${shiftMonth(month, 1).key}`}>
							Next
						</Link>
					</Button>
				</div>
				{month.key !== todayMonthKey && (
					<Button asChild variant="link" size="sm">
						<Link href={`${baseUrl}?month=${todayMonthKey}`}>Today</Link>
					</Button>
				)}
			</div>

			{legend.length > 0 && (
				<ul className="flex flex-wrap gap-4">
					{legend.map(booking => (
						<li
							key={booking.sessionType.id}
							className="flex items-center gap-2 text-sm text-gray-600"
						>
							<span
								className={cn(
									'size-3 rounded-sm',
									sessionTypeColor(booking.sessionType.id).swatch
								)}
							/>
							{booking.sessionType.name}
						</li>
					))}
				</ul>
			)}

			<div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
				{WEEKDAYS.map(weekday => (
					<div
						key={weekday}
						className="bg-gray-50 px-2 py-1 text-center text-xs font-medium text-gray-500"
					>
						{weekday}
					</div>
				))}
				{days.map(day => (
					<div
						key={day.date}
						className={cn(
							'min-h-28 bg-white p-2',
							!day.inMonth && 'bg-gray-50 text-gray-400'
						)}
					>
						<span
							className={cn(
								'inline-flex size-6 items-center justify-center rounded-full text-xs',
								day.isToday && 'bg-gray-900 font-semibold text-white'
							)}
						>
							{day.day}
						</span>
						<ul className="mt-1 flex flex-col gap-1">
							{(bookingsByDay.get(day.date) ?? []).map(booking => {
								const color = sessionTypeColor(booking.sessionType.id);

								return (
									<li key={booking.id}>
										<button
											type="button"
											onClick={() => {
												setSelectedId(booking.id);
												setConfirming(false);
												setRescheduling(false);
											}}
											aria-pressed={selectedId === booking.id}
											className={cn(
												'flex w-full flex-col gap-0.5 rounded border px-1.5 py-1 text-left text-xs',
												color.chip,
												selectedId === booking.id && 'ring-2 ring-gray-400'
											)}
										>
											<span className="flex items-center gap-1">
												<span
													className={cn(
														'size-2 shrink-0 rounded-sm',
														color.swatch
													)}
												/>
												<span className="truncate">
													{isTherapist
														? booking.client.name
														: booking.sessionType.name}
												</span>
											</span>
											<span className="text-gray-600">
												{formatDuration(booking.startsAt, booking.endsAt)}
											</span>
										</button>
									</li>
								);
							})}
						</ul>
					</div>
				))}
			</div>

			{selected && (
				<section
					aria-live="polite"
					className="rounded-lg border border-gray-200 p-4"
				>
					<div className="flex flex-wrap items-center gap-3">
						<div>
							{isTherapist ? (
								<div>
									<span className="text-lg font-semibold">
										{selected.client.name}
									</span>
									<span> - </span>
									<span className="text-md">{selected.sessionType.name}</span>
								</div>
							) : (
								<span className="text-lg font-semibold">
									{selected.sessionType.name}
								</span>
							)}
						</div>
						<span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
							{statusLabels[selected.status]}
						</span>
					</div>
					<dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
						<div>
							<dt className="text-gray-500">When</dt>
							<dd>{formatPragueDateTime(selected.startsAt)}</dd>
							<dd>{formatTimeRange(selected.startsAt, selected.endsAt)}</dd>
						</div>
						<div>
							<dt className="text-gray-500">Duration</dt>
							<dd>{formatDuration(selected.startsAt, selected.endsAt)}</dd>
						</div>
						<div>
							<dt className="text-gray-500">Price</dt>
							<dd>{formatPriceCents(selected.priceCents)}</dd>
						</div>
						<div>
							<dt className="text-gray-500">Format</dt>
							<dd>{formatLabels[selected.format]}</dd>
						</div>
						<div className="sm:col-span-2">
							<dt className="text-gray-500">Note</dt>
							<dd className="whitespace-pre-wrap">
								{selected.notes?.trim() || 'No note'}
							</dd>
						</div>
					</dl>

					<div className="mt-4 flex flex-col gap-3">
						<div className="flex flex-wrap items-center gap-3">
							{isTherapist && selected.status === 'pending' && (
								<form action={confirmAction}>
									<input type="hidden" name="bookingId" value={selected.id} />
									<Button
										type="submit"
										size="sm"
										disabled={confirmPending || cancelPending || rescheduling}
									>
										{confirmPending ? 'Confirming...' : 'Confirm booking'}
									</Button>
								</form>
							)}

							{isTherapist &&
								(selected.status === 'pending' ||
									selected.status === 'confirmed') &&
								!rescheduling && (
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={confirmPending || cancelPending || confirming}
										onClick={() => {
											setRescheduling(true);
											setConfirming(false);
										}}
									>
										Reschedule
									</Button>
								)}

							{canCancel(selected.status, selected.startsAt, isTherapist) &&
								(confirming ? (
									<form
										action={cancelAction}
										className="flex flex-wrap items-center gap-3"
									>
										<input type="hidden" name="bookingId" value={selected.id} />
										<p className="text-sm text-gray-600">
											Cancel this booking?
										</p>
										<Button
											type="submit"
											variant="destructive"
											size="sm"
											disabled={cancelPending}
										>
											{cancelPending ? 'Cancelling...' : 'Yes, cancel'}
										</Button>
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={cancelPending}
											onClick={() => setConfirming(false)}
										>
											Keep booking
										</Button>
									</form>
								) : (
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={confirmPending || rescheduling}
										onClick={() => {
											setConfirming(true);
											setRescheduling(false);
										}}
									>
										Cancel booking
									</Button>
								))}

							<FormAlert message={confirmState.message} />
						</div>

						{isTherapist &&
							rescheduling &&
							(selected.status === 'pending' ||
								selected.status === 'confirmed') && (
								<RescheduleForm
									key={selected.id}
									booking={selected}
									onClose={() => setRescheduling(false)}
								/>
							)}

						{(selected.status === 'pending' ||
							selected.status === 'confirmed') &&
							!canCancel(selected.status, selected.startsAt, isTherapist) && (
								<p className="text-sm text-gray-500">
									Cancellation closes 48 hours before the session.
								</p>
							)}
						<FormAlert message={cancelState.message} />
					</div>
				</section>
			)}
		</div>
	);
};
