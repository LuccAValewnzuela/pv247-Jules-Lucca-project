import z from "zod";

export const sessionTypeIdSchema = z.string().regex(/^[0-9a-f]{32}$/, 'Invalid session type.');

export const sessionTypeFormSchema = z.object({
    name: z.string().trim().min(1, 'Name is required.').max(120, 'Name is too long'),
    description: z.string().trim().min(1, 'Description is required').max(1000, 'Description is too long'),
    durationMinutes: z.coerce.number().int().positive('Duration must be positive'),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Enter a valid price in EUR")
});

export type SessionTypeFormValues = z.infer<typeof sessionTypeFormSchema>;
export type SessionTypeFieldErrors = Partial< Record<keyof SessionTypeFormValues, string[]> >;
export type SessionTypeActionState = { errors?: SessionTypeFieldErrors; message?: string };

export const initialSessionTypeActionState: SessionTypeActionState = {};