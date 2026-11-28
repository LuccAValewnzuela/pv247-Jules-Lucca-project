import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { requireTherapist } from '@/auth/session';
import { SessionTypeForm } from '@/components/session-types';
import { Loader } from '@/components/ui/loader';
import { getSessionTypeById } from '@/server/session-types';

export const metadata: Metadata = { title: 'Update session type' };

type UpdateSessionTypeProps = Pick<
	PageProps<'/dashboard/session-types/[id]'>,
	'params'
>;

const UpdateSessionType = async ({ params }: UpdateSessionTypeProps) => {
	await requireTherapist('/dashboard/session-types');

	const { id } = await params;
	const sessionType = await getSessionTypeById(id);

	if (!sessionType) notFound();

	return <SessionTypeForm sessionType={sessionType} />;
};

const UpdateSessionTypePage = ({
	params
}: PageProps<'/dashboard/session-types/[id]'>) => (
	<main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
		<h1 className="text-2xl font-semibold">Update session type</h1>
		<Suspense fallback={<Loader />}>
			<UpdateSessionType params={params} />
		</Suspense>
	</main>
);

export default UpdateSessionTypePage;
