import { requireTherapist } from "@/auth/session"
import { Loader } from "@/components/loader";
import { SessionTypesTable } from "@/components/session-types-table/session-types-table";
import { getSessionTypes } from "@/server/session-types";
import { Suspense } from "react";


const SessionTypesList = async () => {
    const { user } = await requireTherapist("/dashboard");
    const sessionTypes = await getSessionTypes();

    return (
        <SessionTypesTable sessionTypes={sessionTypes} />
    );
}

const SessionTypesPage = async () => (
    <main>
        <h1>Session Types' list</h1>
        <Suspense fallback={<Loader />}>
            <SessionTypesList />
        </Suspense>
    </main>
);

export default SessionTypesPage;