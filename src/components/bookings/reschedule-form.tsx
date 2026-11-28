'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FieldError, FormAlert } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
	initialBookingActionState,
	toPragueDateKey,
	type SlotOption
} from '@/lib/bookings';
import {
	getSlotsForSessionType,
	rescheduleBooking
} from '@/server/booking-actions';
import type { MonthBooking } from '@/server/bookings';

type RescheduleFormProps = {
	booking: MonthBooking;
	onClose: () => void;
};

export const RescheduleForm = ({ booking, onClose }: RescheduleFormProps) => {
	const [state, formAction, pending] = useActionState(
		rescheduleBooking,
		initialBookingActionState
	);
	const [slots, setSlots] = useState<SlotOption[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string>();
	const [selectedDay, setSelectedDay] = useState(() =>
		toPragueDateKey(booking.startsAt)
	);
	const [selectedSlot, setSelectedSlot] = useState('');

	useEffect(() => {
		let active = true;

		getSlotsForSessionType(booking.sessionTypeId, booking.id)
			.then(({ slots: nextSlots }) => {
				if (!active) return;

				setSlots(nextSlots);
				setSelectedDay(current =>
					nextSlots.some(slot => slot.date === current)
						? current
						: (nextSlots[0]?.date ?? '')
				);
				setLoading(false);
			})
			.catch(() => {
				if (!active) return;

				setLoadError('Could not load available times.');
				setLoading(false);
			});

		return () => {
			active = false;
		};
	}, [booking.id, booking.sessionTypeId]);

	const slotsForDay = useMemo(
		() => slots.filter(slot => slot.date === selectedDay),
		[slots, selectedDay]
	);
	const startsAtError = Boolean(state.errors?.startsAt?.length);

	return (
		<form
			action={formAction}
			className="mt-4 flex flex-col gap-3 rounded-md border border-gray-200 p-3"
		>
			<input type="hidden" name="bookingId" value={booking.id} />

			<p className="text-sm font-medium">Reschedule booking</p>

			<div>
				<label htmlFor="reschedule-day" className="text-sm font-medium">
					Day
				</label>
				<Input
					id="reschedule-day"
					type="date"
					value={selectedDay}
					min={slots[0]?.date}
					max={slots[slots.length - 1]?.date}
					onChange={event => {
						setSelectedDay(event.target.value);
						setSelectedSlot('');
					}}
					disabled={pending || loading || slots.length === 0}
					required
				/>
			</div>

			<div>
				<label htmlFor="reschedule-startsAt" className="text-sm font-medium">
					Time
				</label>
				<Select
					id="reschedule-startsAt"
					name="startsAt"
					value={selectedSlot}
					onChange={event => setSelectedSlot(event.target.value)}
					disabled={pending || loading || slotsForDay.length === 0}
					required
					aria-invalid={startsAtError}
					aria-describedby={
						startsAtError ? 'reschedule-startsAt-error' : undefined
					}
				>
					<option value="">
						{loading ? 'Loading times...' : 'Choose a time'}
					</option>
					{slotsForDay.map(slot => (
						<option key={slot.value} value={slot.value}>
							{slot.label}
						</option>
					))}
				</Select>
				<FieldError
					id={startsAtError ? 'reschedule-startsAt-error' : undefined}
					messages={state.errors?.startsAt}
				/>
				{!loading && slots.length === 0 && (
					<p className="mt-1 text-sm text-gray-500">
						No slots available for this session type.
					</p>
				)}
				{!loading && slots.length > 0 && slotsForDay.length === 0 && (
					<p className="mt-1 text-sm text-gray-500">
						No times available on this day.
					</p>
				)}
			</div>

			<FormAlert message={loadError} />
			<FormAlert message={state.message} />

			<div className="flex flex-wrap gap-2">
				<Button
					type="submit"
					size="sm"
					disabled={pending || loading || !selectedSlot}
				>
					{pending ? 'Rescheduling...' : 'Save new time'}
				</Button>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={pending}
					onClick={onClose}
				>
					Keep original time
				</Button>
			</div>
		</form>
	);
};
