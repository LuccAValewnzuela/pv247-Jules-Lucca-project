'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

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
					const { error } = await signIn.social({
						provider: 'google',
						callbackURL: callbackUrl,
						errorCallbackURL: '/login'
					});
					if (error) {
						toast.error('Login failed. Please try again.');
					}
				})
			}
			className="rounded-md border px-4 py-2 font-medium hover:bg-black/5 disabled:opacity-50"
		>
			{isPending ? 'Redirecting...' : 'Continue with Google'}
		</button>
	);
};
