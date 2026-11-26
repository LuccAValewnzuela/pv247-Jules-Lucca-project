import { requireTherapist } from "@/auth/session"
import { Loader } from "@/components/loader";
import { SessionTypeForm } from "@/components/session-type-form";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: 'New session type' };

const NewSessionType = async () => {
    await requireTherapist('/dashboard/session-types/new');
    return (
        <SessionTypeForm />
    );
};

const NewSessionTypePage = () => (
    <main>
        <h1> New session type </h1>
        <Suspense fallback={<Loader />}>
            <NewSessionType />
        </Suspense>
    </main>
);

export default NewSessionTypePage;