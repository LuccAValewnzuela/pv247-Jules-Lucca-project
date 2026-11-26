'use client';

import { SessionType } from "@/db/schema";
import { initialSessionTypeActionState } from "@/lib/session-types";
import { toggleSessionTypeActive } from "@/server/session-type-actions";
import { useActionState, useState } from "react";
import { Button } from "../ui/button";
import { Ellipsis } from 'lucide-react';
import Link from "next/link";
import { Input } from "../ui/input";

type SessionTypeActionsProps = {
    sessionType : Pick<SessionType, 'id' | 'isActive'>;
};

export const SessionTypeActions = ({ sessionType } : SessionTypeActionsProps) => {
    const [open, setOpen] = useState(false);
    const [state, formAction, pending] = useActionState(toggleSessionTypeActive, initialSessionTypeActionState);

    const menuId = `session-type-actions-${sessionType.id}`
    return (
        <div className="relative">
            <Button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} aria-controls={menuId}>
                <Ellipsis />
            </Button>

            {open && (
                <div id={menuId}>
                    <Link href={`/dashboard/session-types/${sessionType.id}`}>
                        Edit
                    </Link>

                    <form action={formAction}>
                        <Input type="hidden" name="id" value={sessionType.id} />
                        <Button type="submit" disabled={pending} className={sessionType.isActive
                                                            ? 'w-full rounded px-2 py-1.5 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50'
                                                            : 'w-full rounded px-2 py-1.5 text-left text-sm text-emerald-700 hover:bg-emerald-50 disabled:opacity-50'}
                        >
                            {pending ? 'Saving...' : sessionType.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                    </form>
                    {state.message && (
                        <p role="alert" aria-live="polite" className="px-2 pb-1 text-xs text-red-600">
                            {state.message}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};