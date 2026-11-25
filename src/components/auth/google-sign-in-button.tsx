'use client';

import { useState } from 'react';

import { signIn } from '@/auth/auth-client';

type Props = { callbackURL: string };

export const GoogleSignInButton = ({ callbackURL }: Props) => {
	const [pending, setPending] = useState(false);

	const handleClick = async () => {
		setPending(true);
		const { error } = await signIn.social({
			provider: 'google',
			callbackURL,
			errorCallbackURL: '/sign-in'
		});
		if (error) setPending(false);
	};

	return (
		<button
			type="button"
			onClick={handleClick}
			disabled={pending}
			className="rounded-md border px-4 py-2 font-medium hover:bg-black/5 disabled:opacity-50"
		>
			{pending ? 'Redirecting…' : 'Continue with Google'}
		</button>
	);
};
