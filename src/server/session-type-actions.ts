'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { assertTherapist } from '@/auth/session';
import { db } from '@/db/client';
import { sessionTypes } from '@/db/schema';
import {
	SessionTypeActionState,
	sessionTypeFormSchema,
	sessionTypeIdSchema
} from '@/lib/session-types';

const sessionTypesPath = '/dashboard/session-types';
const parseSessionTypeForm = (formData: FormData) =>
	sessionTypeFormSchema.safeParse(Object.fromEntries(formData));

export const createSessionType = async (
	_prevState: SessionTypeActionState,
	formData: FormData
): Promise<SessionTypeActionState> => {
	await assertTherapist();

	const parsed = parseSessionTypeForm(formData);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const { name, description, price, durationMinutes } = parsed.data;
	await db.insert(sessionTypes).values({
		name,
		description,
		durationMinutes,
		isActive: true,
		priceCents: Math.round(Number(price) * 100)
	});

	revalidatePath(sessionTypesPath);
	redirect(sessionTypesPath);
};

export const updateSessionTypeForm = async (
	_prevState: SessionTypeActionState,
	formData: FormData
): Promise<SessionTypeActionState> => {
	await assertTherapist();

	const parsedId = sessionTypeIdSchema.safeParse(formData.get('id'));
	if (!parsedId.success) {
		return { message: 'Invalid session id' };
	}

	const parsed = parseSessionTypeForm(formData);
	if (!parsed.success) {
		return { errors: parsed.error.flatten().fieldErrors };
	}

	const existing = await db
		.select({ id: sessionTypes.id })
		.from(sessionTypes)
		.where(eq(sessionTypes.id, parsedId.data))
		.limit(1);
	if (existing.length === 0) {
		return { message: 'Session type not found' };
	}

	const { name, description, durationMinutes, price } = parsed.data;
	await db
		.update(sessionTypes)
		.set({
			name,
			description,
			durationMinutes,
			priceCents: Math.round(Number(price) * 100)
		})
		.where(eq(sessionTypes.id, parsedId.data));

	revalidatePath(sessionTypesPath);
	redirect(sessionTypesPath);
};

export const toggleSessionTypeActive = async (
	_prevState: SessionTypeActionState,
	formData: FormData
): Promise<SessionTypeActionState> => {
	await assertTherapist();

	const parsedId = sessionTypeIdSchema.safeParse(formData.get('id'));
	if (!parsedId.success) {
		return { message: 'Invalid session type' };
	}

	const existing = await db
		.select({ id: sessionTypes.id, isActive: sessionTypes.isActive })
		.from(sessionTypes)
		.where(eq(sessionTypes.id, parsedId.data))
		.limit(1);
	const sessionType = existing[0];

	if (!sessionType) {
		return { message: 'SessionType not found' };
	}

	await db
		.update(sessionTypes)
		.set({ isActive: !sessionType.isActive })
		.where(eq(sessionTypes.id, sessionType.id));

	revalidatePath(sessionTypesPath);

	return {};
};
