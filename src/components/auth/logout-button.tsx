'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

import { signOut } from '@/auth/client';

export const LogoutButton = () => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<button
			type="button"
			disabled={isPending}
			onClick={() =>
				startTransition(async () => {
					await signOut({
						fetchOptions: {
							onSuccess: () => {
								router.push('/login');
								router.refresh();
							}
						}
					});
				})
			}
			className="rounded-md border px-4 py-2 font-medium hover:bg-black/5 disabled:opacity-50"
		>
			{isPending ? 'Logging out...' : 'Log out'}
		</button>
	);
};
