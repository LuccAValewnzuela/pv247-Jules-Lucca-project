import type { Metadata } from 'next';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';
import { SessionTypeForm } from '@/components/session-types';
import { Loader } from '@/components/ui/loader';

export const metadata: Metadata = { title: 'New session type' };

const NewSessionType = async () => {
	await requireTherapist('/dashboard/session-types/new');
	return <SessionTypeForm />;
};

const NewSessionTypePage = () => (
	<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
		<h1 className="text-2xl font-semibold">New session type</h1>
		<Suspense fallback={<Loader />}>
			<NewSessionType />
		</Suspense>
	</main>
);

export default NewSessionTypePage;
