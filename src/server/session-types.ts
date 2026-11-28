import 'server-only';
import { eq } from 'drizzle-orm';

import { db } from '@/db/client';
import { sessionTypes } from '@/db/schema';

export const getSessionTypes = async () => {
	return db.select().from(sessionTypes);
};

export const getSessionTypeById = async (id: string) => {
	return db.query.sessionTypes.findFirst({
		where: eq(sessionTypes.id, id)
	});
};
