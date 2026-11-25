import type { Metadata } from 'next';
import { Suspense } from 'react';

import { getSession, safeCallbackUrl } from '@/auth/session';
import { GoogleLoginButton } from '@/components/auth/google-login-button';
import { LogoutButton } from '@/components/auth/logout-button';

export const metadata: Metadata = { title: 'Log in' };

type LoginContentProps = Pick<PageProps<'/login'>, 'searchParams'>;

const Login = async ({ searchParams }: LoginContentProps) => {
	const { callbackUrl, error } = await searchParams;
	const session = await getSession();

	return (
		<>
			{error && (
				<p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
					Login failed. Please try again.
				</p>
			)}

			{session ? (
				<>
					<p>
						Logged in as <strong>{session.user.email}</strong> (
						{session.user.role}).
					</p>
					<LogoutButton />
				</>
			) : (
				<GoogleLoginButton callbackUrl={safeCallbackUrl(callbackUrl)} />
			)}
		</>
	);
};

const LoginPage = ({ searchParams }: PageProps<'/login'>) => (
	<main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
		<h1 className="text-2xl font-semibold">Log in</h1>
		<Suspense fallback={<p className="text-sm opacity-60">Loading...</p>}>
			<Login searchParams={searchParams} />
		</Suspense>
	</main>
);

export default LoginPage;
