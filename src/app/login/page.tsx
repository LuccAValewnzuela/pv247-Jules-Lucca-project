import type { Metadata } from 'next';
import { Suspense } from 'react';

import { getSession, safeCallbackUrl } from '@/auth/session';
import { GoogleLoginButton } from '@/components/auth/google-login-button';
import { LoginToast } from '@/components/auth/login-toast';
import { LogoutButton } from '@/components/auth/logout-button';
import { Loader } from '@/components/loader';

export const metadata: Metadata = { title: 'Log in' };

type LoginContentProps = Pick<PageProps<'/login'>, 'searchParams'>;

const Login = async ({ searchParams }: LoginContentProps) => {
	const { callbackUrl, error } = await searchParams;
	const session = await getSession();

	return (
		<>
			{error && (
				<LoginToast type="error" message="Login failed. Please try again." />
			)}

			{session ? (
				<>
					{callbackUrl && (
						<LoginToast
							type="warning"
							message="Your account doesn't have access to this page."
						/>
					)}
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
		<Suspense fallback={<Loader />}>
			<Login searchParams={searchParams} />
		</Suspense>
	</main>
);

export default LoginPage;
