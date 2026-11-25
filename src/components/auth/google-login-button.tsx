'use client';

import { useTransition } from 'react';

import { signIn } from '@/auth/client';

type GoogleLoginButtonProps = { callbackUrl: string };

export const GoogleLoginButton = ({ callbackUrl }: GoogleLoginButtonProps) => {
	const [isPending, startTransition] = useTransition();

	return (
		<button
			type="button"
			disabled={isPending}
			onClick={() =>
				startTransition(async () => {
					await signIn.social({
						provider: 'google',
						callbackURL: callbackUrl,
						errorCallbackURL: '/login'
					});
				})
			}
			className="rounded-md border px-4 py-2 font-medium hover:bg-black/5 disabled:opacity-50"
		>
			{isPending ? 'Redirecting...' : 'Continue with Google'}
		</button>
	);
};
