'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

import { signOut } from '@/auth/client';
import { Button } from '@/components/ui/button';

export const LogoutButton = () => {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();

	return (
		<Button
			type="button"
			variant="outline"
			disabled={isPending}
			onClick={() =>
				startTransition(async () => {
					await signOut({
						fetchOptions: {
							onSuccess: () => {
								toast.success('Logged out');
								router.push('/login');
								router.refresh();
							},
							onError: () => {
								toast.error('Logout failed. Please try again.');
							}
						}
					});
				})
			}
		>
			{isPending ? 'Logging out...' : 'Log out'}
		</Button>
	);
};
