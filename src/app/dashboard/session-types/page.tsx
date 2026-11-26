import Link from 'next/link';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';
import { Loader } from '@/components/loader';
import { SessionTypesTable } from '@/components/session-types-table/session-types-table';
import { buttonVariants } from '@/components/ui/button';
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
		<Link href="/dashboard/session-types/new" className={buttonVariants()}>
			Create a new session type
		</Link>
	</main>
);

export default SessionTypesPage;
