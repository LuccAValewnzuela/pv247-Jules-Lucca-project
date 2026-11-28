import { Metadata } from 'next';
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
	<main>
		<h1> New session type </h1>
		<Suspense fallback={<Loader />}>
			<NewSessionType />
		</Suspense>
	</main>
);

export default NewSessionTypePage;
