import 'server-only';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';

import { auth } from '@/auth/auth';

export type Session = typeof auth.$Infer.Session;
export type Role = Session['user']['role'];

export const getSession = cache(async () =>
	auth.api.getSession({ headers: await headers() })
);

// allow only same site relative paths as post login redirect url
export const safeCallbackUrl = (value: unknown, fallback = '/') =>
	typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
		? value
		: fallback;

export const isTherapist = (session: Session | null) =>
	session?.user.role === 'therapist';

const loginUrl = (callbackUrl?: string) =>
	callbackUrl
		? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
		: '/login';

// ----- Helper functions -----

// redirect to /login when access is denied on pages
export const requireUser = async (callbackUrl?: string) => {
	const session = await getSession();
	if (!session) redirect(loginUrl(callbackUrl));
	return session;
};

export const requireTherapist = async (callbackUrl?: string) => {
	const session = await requireUser(callbackUrl);
	if (!isTherapist(session)) redirect(loginUrl(callbackUrl));
	return session;
};

// throw when access is denied on server actions
export const assertUser = async () => {
	const session = await getSession();
	if (!session) throw new Error('Unauthorized');
	return session;
};

export const assertTherapist = async () => {
	const session = await assertUser();
	if (!isTherapist(session)) throw new Error('Forbidden');
	return session;
};
