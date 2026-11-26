import 'server-only';
import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { clients } from '@/db/schema';

type NewAccount = { id: string; name: string; email: string };

export const linkOrCreateClient = async ({ id, name, email }: NewAccount) => {
	const existing = await db.query.clients.findFirst({
		where: and(
			isNull(clients.userId),
			eq(sql`lower(${clients.email})`, email.toLowerCase())
		),
		columns: { id: true }
	});

	if (existing) {
		await db
			.update(clients)
			.set({ userId: id, name })
			.where(eq(clients.id, existing.id));
		return;
	}

	await db.insert(clients).values({ userId: id, name, email });
};
