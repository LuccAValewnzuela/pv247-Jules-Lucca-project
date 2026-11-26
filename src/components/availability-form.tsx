'use client';

import { useActionState, useEffect, useRef } from 'react';

import {
	initialAvailabilityActionState,
	type AvailabilityActionState
} from '@/lib/availability';
import { createAvailabilityBlock } from '@/server/availability-actions';

import { Button } from './ui/button';
import { Input } from './ui/input';

type FieldErrors = NonNullable<AvailabilityActionState['errors']>;

const FieldError = ({
	errors,
	field
}: {
	errors?: FieldErrors;
	field: keyof FieldErrors;
}) => {
	const messages = errors?.[field];
	if (!messages?.length) return null;

	return (
		<p id={`${field}-error`} className="mt-1 text-sm text-red-600">
			{messages[0]}
		</p>
	);
};

export const AvailabilityForm = () => {
	const [state, formAction, pending] = useActionState(
		createAvailabilityBlock,
		initialAvailabilityActionState
	);
	const formRef = useRef<HTMLFormElement>(null);

	useEffect(() => {
		if (state.success) formRef.current?.reset();
	}, [state]);

	const startError = Boolean(state.errors?.startsAt?.length);
	const endError = Boolean(state.errors?.endsAt?.length);

	return (
		<form
			ref={formRef}
			action={formAction}
			className="flex max-w-xl flex-col gap-4"
		>
			<p className="text-sm text-gray-600">
				Times are entered in Europe/Prague.
			</p>

			<div>
				<label htmlFor="startsAt" className="font-medium">
					Start
				</label>
				<Input
					id="startsAt"
					name="startsAt"
					type="datetime-local"
					disabled={pending}
					required
					aria-invalid={startError}
					aria-describedby={startError ? 'startsAt-error' : undefined}
				/>
				<FieldError errors={state.errors} field="startsAt" />
			</div>

			<div>
				<label htmlFor="endsAt" className="font-medium">
					End
				</label>
				<Input
					id="endsAt"
					name="endsAt"
					type="datetime-local"
					disabled={pending}
					required
					aria-invalid={endError}
					aria-describedby={endError ? 'endsAt-error' : undefined}
				/>
				<FieldError errors={state.errors} field="endsAt" />
			</div>

			{state.message && (
				<p role="alert" aria-live="polite" className="text-sm text-red-600">
					{state.message}
				</p>
			)}

			<Button
				type="submit"
				disabled={pending}
				className="rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
			>
				{pending ? 'Adding...' : 'Add availability block'}
			</Button>
		</form>
	);
};
