import { type ComponentProps } from 'react';

import { cn } from '@/lib/cn';

type LoaderProps = ComponentProps<'div'> & { label?: string };

export const Loader = ({
	label = 'Loading...',
	className,
	...props
}: LoaderProps) => (
	<div
		role="status"
		className={cn('flex flex-1 items-center justify-center p-6', className)}
		{...props}
	>
		<div className="size-8 animate-spin rounded-full border-4 border-current border-t-transparent opacity-60" />
		<span className="sr-only">{label}</span>
	</div>
);
