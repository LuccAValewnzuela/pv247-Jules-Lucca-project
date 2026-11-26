import 'server-only'
import { db } from "@/db/client"
import { sessionTypes } from "@/db/schema"
import { eq } from 'drizzle-orm';

export const getSessionTypes = async () => {
    return db
            .select()
            .from(sessionTypes);
};

export const getSessionTypeById = async (id: string) => {
    return db.query.sessionTypes.findFirst({
        where: eq(sessionTypes.id, id)
    });
};
