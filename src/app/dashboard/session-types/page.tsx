import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';
import { SessionTypesTable } from '@/components/session-types';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { getSessionTypes } from '@/server/session-types';

export const metadata: Metadata = { title: 'Session types' };

const SessionTypesList = async () => {
	await requireTherapist('/dashboard/session-types');
	const sessionTypes = await getSessionTypes();

	return <SessionTypesTable sessionTypes={sessionTypes} />;
};

const SessionTypesPage = async () => (
	<main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
		<div className="flex flex-wrap items-center justify-between gap-3">
			<h1 className="text-2xl font-semibold">Session types</h1>
			<Button asChild>
				<Link href="/dashboard/session-types/new">
					Create a new session type
				</Link>
			</Button>
		</div>
		<Suspense fallback={<Loader />}>
			<SessionTypesList />
		</Suspense>
	</main>
);

export default SessionTypesPage;
