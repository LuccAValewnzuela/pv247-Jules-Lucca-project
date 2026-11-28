import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';

export const metadata: Metadata = { title: 'Dashboard' };

const Dashboard = async () => {
	const { user } = await requireTherapist('/dashboard');

	return (
		<div className="flex flex-col gap-6">
			<p>Welcome, {user.name}.</p>
			<nav aria-label="Therapist sections" className="flex flex-wrap gap-3">
				<Button asChild variant="outline">
					<Link href="/dashboard/session-types">Session types</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href="/dashboard/availability">Availability</Link>
				</Button>
				<Button asChild variant="outline">
					<Link href="/dashboard/bookings">Bookings</Link>
				</Button>
			</nav>
		</div>
	);
};

const DashboardPage = () => (
	<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
		<h1 className="text-2xl font-semibold">Dashboard</h1>
		<Suspense fallback={<Loader />}>
			<Dashboard />
		</Suspense>
	</main>
);

export default DashboardPage;
