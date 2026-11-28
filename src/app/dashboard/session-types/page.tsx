import Link from 'next/link';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';
import { SessionTypesTable } from '@/components/session-types';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/ui/loader';
import { getSessionTypes } from '@/server/session-types';

const SessionTypesList = async () => {
	await requireTherapist('/dashboard/session-types');
	const sessionTypes = await getSessionTypes();

	return <SessionTypesTable sessionTypes={sessionTypes} />;
};

const SessionTypesPage = async () => (
	<main>
		<h1>Session types</h1>
		<Suspense fallback={<Loader />}>
			<SessionTypesList />
		</Suspense>
		<Button asChild>
			<Link href="/dashboard/session-types/new">Create a new session type</Link>
		</Button>
	</main>
);

export default SessionTypesPage;
