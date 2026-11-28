'use client';

import { useActionState, useState } from 'react';

import { Button } from '@/components/ui/button';
import { FormAlert } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import {
	initialAvailabilityActionState,
	type AvailabilityActionState
} from '@/lib/availability';
import { deleteAvailabilityBlock } from '@/server/availability-actions';

type CancelBlockButtonProps = {
	blockId: string;
};

export const CancelBlockButton = ({ blockId }: CancelBlockButtonProps) => {
	const [confirming, setConfirming] = useState(false);
	const [state, formAction, pending] = useActionState<
		AvailabilityActionState,
		FormData
	>(deleteAvailabilityBlock, initialAvailabilityActionState);

	if (!confirming) {
		return (
			<Button
				type="button"
				variant="outline"
				onClick={() => setConfirming(true)}
			>
				Cancel block
			</Button>
		);
	}

	return (
		<form action={formAction} className="flex flex-col items-end gap-2">
			<Input type="hidden" name="id" value={blockId} />
			<p className="max-w-48 text-right text-xs text-gray-500">
				This removes the block and its bookings.
			</p>
			<Button type="submit" variant="destructive" disabled={pending}>
				{pending ? 'Cancelling...' : 'Confirm cancel'}
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				disabled={pending}
				onClick={() => setConfirming(false)}
			>
				Keep block
			</Button>
			<FormAlert message={state.message} className="text-xs" />
		</form>
	);
};
