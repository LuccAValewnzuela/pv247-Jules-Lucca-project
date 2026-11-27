import { cn } from '@/lib/cn';

type FieldErrorProps = {
	id?: string;
	messages?: string[];
};

export const FieldError = ({ id, messages }: FieldErrorProps) => {
	if (!messages?.length) return null;

	return (
		<p id={id} className="mt-1 text-sm text-red-600">
			{messages[0]}
		</p>
	);
};

type FormAlertProps = {
	message?: string;
	className?: string;
};

export const FormAlert = ({ message, className }: FormAlertProps) => {
	if (!message) return null;

	return (
		<p
			role="alert"
			aria-live="polite"
			className={cn('text-sm text-red-600', className)}
		>
			{message}
		</p>
	);
};
