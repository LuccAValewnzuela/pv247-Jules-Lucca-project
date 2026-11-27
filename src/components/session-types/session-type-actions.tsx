'use client';

import { Ellipsis } from 'lucide-react';
import Link from 'next/link';
import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { SessionType } from '@/db/schema';
import { initialSessionTypeActionState } from '@/lib/session-types';
import { toggleSessionTypeActive } from '@/server/session-type-actions';

type SessionTypeActionsProps = {
	sessionType: Pick<SessionType, 'id' | 'isActive'>;
};

export const SessionTypeActions = ({
	sessionType
}: SessionTypeActionsProps) => {
	const [open, setOpen] = useState(false);
	const [state, formAction, pending] = useActionState(
		toggleSessionTypeActive,
		initialSessionTypeActionState
	);

	const menuId = `session-type-actions-${sessionType.id}`;

	return (
		<div className="relative">
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={() => setOpen(value => !value)}
				aria-expanded={open}
				aria-controls={menuId}
			>
				<Ellipsis />
			</Button>

			{open && (
				<div
					id={menuId}
					className="bg-background absolute right-0 z-10 mt-1 flex min-w-36 flex-col rounded-md border p-1 shadow-sm"
				>
					<Button asChild variant="ghost" size="sm" className="justify-start">
						<Link href={`/dashboard/session-types/${sessionType.id}`}>
							Edit
						</Link>
					</Button>

					<form action={formAction}>
						<Input type="hidden" name="id" value={sessionType.id} />
						<Button
							type="submit"
							variant={sessionType.isActive ? 'destructive' : 'ghost'}
							size="sm"
							disabled={pending}
							className="w-full justify-start"
						>
							{pending
								? 'Saving...'
								: sessionType.isActive
									? 'Deactivate'
									: 'Activate'}
						</Button>
					</form>
					<FormAlert message={state.message} className="px-2 pb-1 text-xs" />
				</div>
			)}
		</div>
	);
};
