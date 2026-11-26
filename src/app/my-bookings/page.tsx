import type { Metadata } from 'next';
import { Suspense } from 'react';

import { requireUser } from '@/auth/session';
import { Loader } from '@/components/loader';

export const metadata: Metadata = { title: 'My bookings' };

// placeholder until the bookings feature (#9)
const MyBookings = async () => {
	const { user } = await requireUser('/my-bookings');

	return <p>Bookings of {user.name} will be listed here.</p>;
};

const MyBookingsPage = () => (
	<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
		<h1 className="text-2xl font-semibold">My bookings</h1>
		<Suspense fallback={<Loader />}>
			<MyBookings />
		</Suspense>
	</main>
);

export default MyBookingsPage;
