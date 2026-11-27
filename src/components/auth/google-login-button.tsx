'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';

import { signIn } from '@/auth/client';
import { Button } from '@/components/ui/button';

type GoogleLoginButtonProps = { callbackUrl: string };

export const GoogleLoginButton = ({ callbackUrl }: GoogleLoginButtonProps) => {
	const [isPending, startTransition] = useTransition();

	return (
		<Button
			type="button"
			variant="outline"
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
		>
			{isPending ? 'Redirecting...' : 'Continue with Google'}
		</Button>
	);
};
