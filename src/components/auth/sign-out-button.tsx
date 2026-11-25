'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { signOut } from '@/auth/auth-client';

export const SignOutButton = () => {
	const router = useRouter();
	const [pending, setPending] = useState(false);

	const handleClick = async () => {
		setPending(true);
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					router.push('/');
					router.refresh();
				}
			}
		});
		setPending(false);
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={pending}
			className="rounded-md border px-4 py-2 font-medium hover:bg-black/5 disabled:opacity-50"
		>
			{pending ? 'Signing out…' : 'Sign out'}
		</button>
	);
};
