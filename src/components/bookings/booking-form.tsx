'use client';

import {
	useActionState,
	useMemo,
	useRef,
	useState,
	useTransition
} from 'react';

import { Button } from '@/components/ui/button';
import { FieldError, FormAlert } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { formatPriceCents } from '@/lib/availability';
import {
	formatLabels,
	initialBookingActionState,
	type BookingFormat,
	type SlotOption
} from '@/lib/bookings';
import {
	createBooking,
	createTherapistBooking,
	getSlotsForSessionType
} from '@/server/booking-actions';
import type { ActiveSessionType } from '@/server/bookings';

type ClientOption = {
	id: string;
	name: string;
	email: string;
};

type BookingFormProps = {
	sessionTypes: ActiveSessionType[];
	initialSlots: SlotOption[];
	defaultSessionTypeId: string;
	isTherapist: boolean;
	clients: ClientOption[];
};

export const BookingForm = ({
	sessionTypes,
	initialSlots,
	defaultSessionTypeId,
	isTherapist,
	clients
}: BookingFormProps) => {
	const [state, formAction, pending] = useActionState(
		isTherapist ? createTherapistBooking : createBooking,
		initialBookingActionState
	);
	const [clientId, setClientId] = useState(
		isTherapist ? (clients[0]?.id ?? 'new') : ''
	);
	const [sessionTypeId, setSessionTypeId] = useState(defaultSessionTypeId);
	const [slots, setSlots] = useState(initialSlots);
	const [selectedDay, setSelectedDay] = useState(initialSlots[0]?.date ?? '');
	const [selectedSlot, setSelectedSlot] = useState('');
	const [format, setFormat] = useState<BookingFormat>('in_person');
	const [slotsLoading, startTransition] = useTransition();
	const latestRequest = useRef(sessionTypeId);

	const slotsForDay = useMemo(
		() => slots.filter(slot => slot.date === selectedDay),
		[slots, selectedDay]
	);

	const handleSessionTypeChange = (value: string) => {
		setSessionTypeId(value);
		setSelectedSlot('');
		latestRequest.current = value;

		startTransition(async () => {
			const { slots: nextSlots } = await getSlotsForSessionType(value);
			if (latestRequest.current !== value) return;

			setSlots(nextSlots);
			setSelectedDay(current =>
				nextSlots.some(slot => slot.date === current)
					? current
					: (nextSlots[0]?.date ?? '')
			);
		});
	};

	const handleDayChange = (value: string) => {
		setSelectedDay(value);
		setSelectedSlot('');
	};

	const clientIdError = Boolean(state.errors?.clientId?.length);
	const clientNameError = Boolean(state.errors?.clientName?.length);
	const clientEmailError = Boolean(state.errors?.clientEmail?.length);
	const clientPhoneError = Boolean(state.errors?.clientPhone?.length);
	const startsAtError = Boolean(state.errors?.startsAt?.length);
	const notesError = Boolean(state.errors?.notes?.length);

	return (
		<form action={formAction} className="flex max-w-xl flex-col gap-5">
			{isTherapist && (
				<>
					<div>
						<label htmlFor="client" className="font-medium">
							Client
						</label>
						<Select
							id="client"
							value={clientId}
							onChange={event => setClientId(event.target.value)}
							disabled={pending}
							required
							aria-invalid={clientIdError}
							aria-describedby={clientIdError ? 'client-error' : undefined}
						>
							{clients.map(client => (
								<option key={client.id} value={client.id}>
									{client.name} · {client.email}
								</option>
							))}
							<option value="new">New client</option>
						</Select>
						{clientId !== 'new' && (
							<input type="hidden" name="clientId" value={clientId} />
						)}
						<FieldError
							id={clientIdError ? 'client-error' : undefined}
							messages={state.errors?.clientId}
						/>
					</div>

					{clientId === 'new' && (
						<>
							<div>
								<label htmlFor="clientName" className="font-medium">
									Client name
								</label>
								<Input
									id="clientName"
									name="clientName"
									maxLength={120}
									disabled={pending}
									required
									aria-invalid={clientNameError}
									aria-describedby={
										clientNameError ? 'clientName-error' : undefined
									}
								/>
								<FieldError
									id={clientNameError ? 'clientName-error' : undefined}
									messages={state.errors?.clientName}
								/>
							</div>

							<div>
								<label htmlFor="clientEmail" className="font-medium">
									Client email
								</label>
								<Input
									id="clientEmail"
									name="clientEmail"
									type="email"
									maxLength={254}
									disabled={pending}
									required
									aria-invalid={clientEmailError}
									aria-describedby={
										clientEmailError ? 'clientEmail-error' : undefined
									}
								/>
								<FieldError
									id={clientEmailError ? 'clientEmail-error' : undefined}
									messages={state.errors?.clientEmail}
								/>
							</div>

							<div>
								<label htmlFor="clientPhone" className="font-medium">
									Phone (optional)
								</label>
								<Input
									id="clientPhone"
									name="clientPhone"
									type="tel"
									maxLength={80}
									disabled={pending}
									aria-invalid={clientPhoneError}
									aria-describedby={
										clientPhoneError ? 'clientPhone-error' : undefined
									}
								/>
								<FieldError
									id={clientPhoneError ? 'clientPhone-error' : undefined}
									messages={state.errors?.clientPhone}
								/>
							</div>
						</>
					)}
				</>
			)}

			<div>
				<label htmlFor="sessionTypeId" className="font-medium">
					Session type
				</label>
				<Select
					id="sessionTypeId"
					name="sessionTypeId"
					value={sessionTypeId}
					onChange={event => handleSessionTypeChange(event.target.value)}
					disabled={pending || slotsLoading}
					required
				>
					{sessionTypes.map(sessionType => (
						<option key={sessionType.id} value={sessionType.id}>
							{sessionType.name} · {formatPriceCents(sessionType.priceCents)} ·{' '}
							{sessionType.durationMinutes} min
						</option>
					))}
				</Select>
			</div>

			<div>
				<label htmlFor="day" className="font-medium">
					Day
				</label>
				<Input
					id="day"
					type="date"
					value={selectedDay}
					min={slots[0]?.date}
					max={slots[slots.length - 1]?.date}
					onChange={event => handleDayChange(event.target.value)}
					disabled={pending || slotsLoading || slots.length === 0}
					required
				/>
			</div>

			<div>
				<label htmlFor="startsAt" className="font-medium">
					Time
				</label>
				<Select
					id="startsAt"
					name="startsAt"
					value={selectedSlot}
					onChange={event => setSelectedSlot(event.target.value)}
					disabled={pending || slotsLoading || slotsForDay.length === 0}
					required
					aria-invalid={startsAtError}
					aria-describedby={startsAtError ? 'startsAt-error' : undefined}
				>
					<option value="">
						{slotsLoading ? 'Loading times...' : 'Choose a time'}
					</option>
					{slotsForDay.map(slot => (
						<option key={slot.value} value={slot.value}>
							{slot.label}
						</option>
					))}
				</Select>
				<FieldError
					id={startsAtError ? 'startsAt-error' : undefined}
					messages={state.errors?.startsAt}
				/>
				{!slotsLoading && slots.length === 0 && (
					<p className="mt-1 text-sm text-gray-500">
						No slots available for this session type.
					</p>
				)}
				{!slotsLoading && slots.length > 0 && slotsForDay.length === 0 && (
					<p className="mt-1 text-sm text-gray-500">
						No times available on this day.
					</p>
				)}
			</div>

			<fieldset disabled={pending}>
				<legend className="font-medium">Format</legend>
				<div className="mt-2 flex flex-wrap gap-5">
					{(Object.keys(formatLabels) as BookingFormat[]).map(value => (
						<label key={value} className="flex items-center gap-2 text-sm">
							<input
								type="radio"
								name="format"
								value={value}
								checked={format === value}
								onChange={() => setFormat(value)}
								className="size-4"
							/>
							{formatLabels[value]}
						</label>
					))}
				</div>
			</fieldset>

			<div>
				<label htmlFor="notes" className="font-medium">
					Note (optional)
				</label>
				<Textarea
					id="notes"
					name="notes"
					maxLength={1000}
					disabled={pending}
					aria-invalid={notesError}
					aria-describedby={notesError ? 'notes-error' : undefined}
				/>
				<FieldError
					id={notesError ? 'notes-error' : undefined}
					messages={state.errors?.notes}
				/>
			</div>

			<FormAlert message={state.message} />

			<Button type="submit" disabled={pending || slotsLoading || !selectedSlot}>
				{pending
					? 'Creating...'
					: isTherapist
						? 'Create booking'
						: 'Book session'}
			</Button>
		</form>
	);
};
