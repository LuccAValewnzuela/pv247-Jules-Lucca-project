import { forwardRef } from 'react';

import { cn } from '@/lib/cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = forwardRef<HTMLSelectElement, SelectProps>(
	({ className, ...props }, ref) => (
		<select
			className={cn(
				'border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			ref={ref}
			{...props}
		/>
	)
);
Select.displayName = 'Select';

export { Select };
