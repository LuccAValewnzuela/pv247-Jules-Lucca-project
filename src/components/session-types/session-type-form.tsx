'use client';

import { redirect } from 'next/navigation';
import { useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { FieldError, FormAlert } from '@/components/ui/field-error';
import { Input } from '@/components/ui/input';
import { SessionType } from '@/db/schema';
import { initialSessionTypeActionState } from '@/lib/session-types';
import {
	createSessionType,
	updateSessionTypeForm
} from '@/server/session-type-actions';

type SessionTypeFormProps = {
	sessionType?: Pick<
		SessionType,
		'id' | 'name' | 'description' | 'durationMinutes' | 'priceCents'
	>;
};

export const SessionTypeForm = ({ sessionType }: SessionTypeFormProps) => {
	const action = sessionType ? updateSessionTypeForm : createSessionType;
	const [state, formAction, pending] = useActionState(
		action,
		initialSessionTypeActionState
	);

	return (
		<form
			action={formAction}
			onSubmit={() => redirect('/dashboard/session-types')}
			className="flex max-w-xl flex-col gap-4"
		>
			{sessionType && <Input type="hidden" name="id" value={sessionType.id} />}

			<div>
				<label htmlFor="name" className="font-medium">
					Name
				</label>
				<Input
					id="name"
					name="name"
					type="text"
					defaultValue={sessionType?.name}
					required
				/>
				<FieldError messages={state.errors?.name} />
			</div>

			<div>
				<label htmlFor="description" className="font-medium">
					Description
				</label>
				<Input
					id="description"
					name="description"
					type="text"
					defaultValue={sessionType?.description}
					required
				/>
				<FieldError messages={state.errors?.description} />
			</div>

			<div>
				<label htmlFor="durationMinutes" className="font-medium">
					Duration, in minutes
				</label>
				<Input
					id="durationMinutes"
					name="durationMinutes"
					type="number"
					min={1}
					step={1}
					defaultValue={sessionType?.durationMinutes}
					required
				/>
				<FieldError messages={state.errors?.durationMinutes} />
			</div>

			<div>
				<label htmlFor="price" className="font-medium">
					Price
				</label>
				<Input
					id="price"
					name="price"
					type="number"
					min={0}
					step={0.01}
					defaultValue={
						sessionType ? (sessionType.priceCents / 100).toFixed(2) : undefined
					}
					required
				/>
				<FieldError messages={state.errors?.price} />
			</div>

			<FormAlert message={state.message} />

			<Button type="submit" disabled={pending}>
				{pending
					? 'Saving...'
					: sessionType
						? 'Save changes'
						: 'Create session type'}
			</Button>
		</form>
	);
};
