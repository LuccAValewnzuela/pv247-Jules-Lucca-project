import type { Metadata } from 'next';

import { getSession, safeCallbackURL } from '@/auth/session';
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button';
import { SignOutButton } from '@/components/auth/sign-out-button';

export const metadata: Metadata = { title: 'Sign in' };

const SignInPage = async ({ searchParams }: PageProps<'/sign-in'>) => {
	const { callbackURL, error } = await searchParams;
	const session = await getSession();

	return (
		<main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
			<h1 className="text-2xl font-semibold">Sign in</h1>

			{error && (
				<p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
					Sign-in failed. Please try again.
				</p>
			)}

			{session ? (
				<>
					<p>
						Signed in as <strong>{session.user.email}</strong> (
						{session.user.role}).
					</p>
					<SignOutButton />
				</>
			) : (
				<GoogleSignInButton callbackURL={safeCallbackURL(callbackURL)} />
			)}
		</main>
	);
};

export default SignInPage;
