import 'server-only';
import { headers } from 'next/headers';
import { cache } from 'react';

import { auth } from '@/auth/auth';

export type Session = typeof auth.$Infer.Session;
export type Role = Session['user']['role'];

export const getSession = cache(async () =>
	auth.api.getSession({ headers: await headers() })
);

// Only allow same-site relative paths as post-sign-in redirect targets
export const safeCallbackURL = (value: unknown, fallback = '/') =>
	typeof value === 'string' && value.startsWith('/') && !value.startsWith('//')
		? value
		: fallback;
