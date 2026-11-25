import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';

import { db } from '@/db/client';
import { account, session, user, verification } from '@/db/schema';

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'sqlite',
		schema: { user, session, account, verification }
	}),
	socialProviders: {
		google: {
			clientId: process.env.AUTH_GOOGLE_ID!,
			clientSecret: process.env.AUTH_GOOGLE_SECRET!
		}
	},
	user: {
		additionalFields: {
			role: {
				type: ['client', 'therapist'],
				defaultValue: 'client',
				input: false
			}
		}
	},
	plugins: [nextCookies()]
});
