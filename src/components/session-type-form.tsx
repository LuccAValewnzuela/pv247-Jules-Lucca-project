'use client';

import { SessionType } from "@/db/schema";
import { initialSessionTypeActionState, SessionTypeActionState } from "@/lib/session-types";
import { createSessionType, updateSessionTypeForm } from "@/server/session-type-actions";
import { useActionState } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { redirect } from "next/navigation";

type SessionTypeFormProps = {
    sessionType?: Pick<SessionType, 'id' | 'name' | 'description' | 'durationMinutes'| 'priceCents'>;
};

type FieldErrors = NonNullable<SessionTypeActionState['errors']>;

const FieldError = ({ errors, field } : { errors?: FieldErrors; field: keyof FieldErrors}) => {
    const messages = errors?.[field];
    if(!messages?.length) return null;

    return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>
}


export const SessionTypeForm = ({ sessionType }: SessionTypeFormProps) => {
    const action = sessionType ? updateSessionTypeForm : createSessionType;
    const [state, formAction, pending] = useActionState(action, initialSessionTypeActionState);

    return (
        <form action={formAction} onSubmit={() => redirect('/dashboard/session-types')} className="flex max-w-xl flex-col gap-4">
            {sessionType && (
                <Input type="hidden" name="id" value={sessionType.id} />
            )}

            <div>
                <label htmlFor="name" className="font-medium">
                    Name
                </label>
                <Input id="name" name="name" type="text" defaultValue={sessionType?.name} required />
                <FieldError errors={state.errors} field="name" />
            </div>

            <div>
                <label htmlFor="description" className="font-medium">
                    Description
                </label>
                <Input id="description" name="description" type="text" defaultValue={sessionType?.description} required />
                <FieldError errors={state.errors} field="description" />
            </div>

            <div>
                <label htmlFor="durationMinutes" className="font-medium">
                    Duration, in minutes
                </label>
                <Input id="durationMinutes" name="durationMinutes" type="number" min={1} step={1} defaultValue={sessionType?.durationMinutes} required />
                <FieldError errors={state.errors} field="durationMinutes" />
            </div>

            <div>
                <label htmlFor="price" className="font-medium">
                    Price
                </label>
                <Input id="price" name="price" type="number" min={0} step={0.01} defaultValue={sessionType ? (sessionType.priceCents / 100).toFixed(2) : undefined} required />
                <FieldError errors={state.errors} field="price" />
            </div>

            {state.message && (
                <p role="alert" aria-live="polite" className="text-sm text-red-600">
                    {state.message}
                </p>
            )}

            <Button type="submit" disabled={pending} className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50">
                {pending ? 'Saving...' : sessionType ? 'Save changes' : 'Create session type'}
            </Button>
        </form>
    );
};