import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';
import { Loader } from '@/components/loader';
import { buttonVariants } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Dashboard' };

const Dashboard = async () => {
	const { user } = await requireTherapist('/dashboard');

	return (
		<div className="flex flex-col gap-6">
			<p>Welcome, {user.name}.</p>
			<nav aria-label="Therapist sections" className="flex flex-wrap gap-3">
				<Link
					href="/dashboard/session-types"
					className={buttonVariants({ variant: 'outline' })}
				>
					Session types
				</Link>
				<Link
					href="/dashboard/availability"
					className={buttonVariants({ variant: 'outline' })}
				>
					Availability
				</Link>
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
