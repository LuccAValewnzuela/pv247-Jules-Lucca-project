import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { isTherapist, requireUser } from '@/auth/session';
import { BookingsCalendar } from '@/components/bookings';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { buildMonthGrid, parseMonthParam } from '@/lib/calendar';
import { getBookingsForMonth } from '@/server/bookings';

export const metadata: Metadata = { title: 'My bookings' };

type MyBookingsProps = Pick<PageProps<'/my-bookings'>, 'searchParams'>;

const MyBookings = async ({ searchParams }: MyBookingsProps) => {
	const session = await requireUser('/my-bookings');
	if (isTherapist(session)) redirect('/dashboard');

	const { month: monthParam } = await searchParams;
	const month = parseMonthParam(monthParam);
	const bookings = await getBookingsForMonth(month, session.user.id);

	if (!bookings) {
		return (
			<p className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
				No client profile is linked to this account.
			</p>
		);
	}

	return (
		<BookingsCalendar
			month={month}
			days={buildMonthGrid(month)}
			bookings={bookings}
			todayMonthKey={parseMonthParam(undefined).key}
			isTherapist={false}
		/>
	);
};

const MyBookingsPage = ({ searchParams }: PageProps<'/my-bookings'>) => (
	<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
		<div className="flex flex-wrap items-center justify-between gap-3">
			<h1 className="text-2xl font-semibold">My bookings</h1>
			<Button asChild>
				<Link href="/book">Book a session</Link>
			</Button>
		</div>
		<Suspense fallback={<Loader />}>
			<MyBookings searchParams={searchParams} />
		</Suspense>
	</main>
);

export default MyBookingsPage;
