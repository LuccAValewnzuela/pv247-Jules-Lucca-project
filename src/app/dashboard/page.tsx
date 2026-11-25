import type { Metadata } from 'next';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';

export const metadata: Metadata = { title: 'Dashboard' };

// placeholder until the therapist features (#10 and following)
const Dashboard = async () => {
	const { user } = await requireTherapist('/dashboard');

	return <p>Welcome, {user.name}.</p>;
};

const DashboardPage = () => (
	<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
		<h1 className="text-2xl font-semibold">Dashboard</h1>
		<Suspense fallback={<p className="text-sm opacity-60">Loading...</p>}>
			<Dashboard />
		</Suspense>
	</main>
);

export default DashboardPage;
