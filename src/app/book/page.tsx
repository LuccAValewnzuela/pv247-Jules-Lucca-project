import type { Metadata } from 'next';
import { Suspense } from 'react';

import { isTherapist, requireUser } from '@/auth/session';
import { BookingForm } from '@/components/bookings';
import { Loader } from '@/components/ui/loader';
import { toSlotOptions } from '@/lib/bookings';
import { getActiveSessionTypes, getBookableSlots } from '@/server/bookings';
import { getClients } from '@/server/clients';

export const metadata: Metadata = { title: 'Book a session' };

const BookingSection = async () => {
	const session = await requireUser('/book');
	const therapist = isTherapist(session);
	const [sessionTypes, clients] = await Promise.all([
		getActiveSessionTypes(),
		therapist ? getClients() : Promise.resolve([])
	]);
	if (sessionTypes.length === 0) {
		return (
			<p className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
				No session types are currently available.
			</p>
		);
	}

	const defaultSessionTypeId = sessionTypes[0].id;
	const result = await getBookableSlots(defaultSessionTypeId);

	return (
		<BookingForm
			sessionTypes={sessionTypes}
			initialSlots={toSlotOptions(result?.slots ?? [])}
			defaultSessionTypeId={defaultSessionTypeId}
			isTherapist={therapist}
			clients={clients}
		/>
	);
};

const BookPage = () => (
	<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
		<h1 className="text-2xl font-semibold">Create a new booking</h1>
		<Suspense fallback={<Loader />}>
			<BookingSection />
		</Suspense>
	</main>
);

export default BookPage;
