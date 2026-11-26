import type { Metadata } from 'next';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';
import { AvailabilityForm } from '@/components/availability-form';
import { AvailabilityList } from '@/components/availability-list';
import { Loader } from '@/components/loader';
import { getUpcomingAvailabilityBlocks } from '@/server/availability';

export const metadata: Metadata = { title: 'Availability' };

const AvailabilityContent = async () => {
	await requireTherapist('/dashboard/availability');
	const blocks = await getUpcomingAvailabilityBlocks();

	return (
		<div className="flex flex-col gap-8">
			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold">Add a block</h2>
				<AvailabilityForm />
			</section>

			<section className="flex flex-col gap-4">
				<h2 className="text-lg font-semibold">Upcoming blocks</h2>
				<AvailabilityList blocks={blocks} />
			</section>
		</div>
	);
};

const AvailabilityPage = () => (
	<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
		<h1 className="text-2xl font-semibold">Availability</h1>
		<Suspense fallback={<Loader />}>
			<AvailabilityContent />
		</Suspense>
	</main>
);

export default AvailabilityPage;
