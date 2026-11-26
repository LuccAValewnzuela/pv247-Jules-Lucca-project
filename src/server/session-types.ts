import 'server-only'
import { db } from "@/db/client"
import { sessionTypes } from "@/db/schema"

export const getSessionTypes = async () => {
    return db
            .select()
            .from(sessionTypes);
};
