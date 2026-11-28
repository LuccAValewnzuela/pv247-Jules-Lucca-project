'use client';

import { useActionState, useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { FieldError, FormAlert } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { initialAvailabilityActionState } from '@/lib/availability';
import { createAvailabilityBlock } from '@/server/availability-actions';

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
				<FieldError
					id={startError ? 'startsAt-error' : undefined}
					messages={state.errors?.startsAt}
				/>
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
				<FieldError
					id={endError ? 'endsAt-error' : undefined}
					messages={state.errors?.endsAt}
				/>
			</div>

			<FormAlert message={state.message} />

			<Button type="submit" disabled={pending}>
				{pending ? 'Adding...' : 'Add availability block'}
			</Button>
		</form>
	);
};
