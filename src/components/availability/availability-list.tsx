import type { AvailabilityBlockWithBookings } from '@/server/availability';

import { AvailabilityListItem } from './availability-list-item';

type AvailabilityListProps = {
	blocks: AvailabilityBlockWithBookings[];
};

export const AvailabilityList = ({ blocks }: AvailabilityListProps) => {
	if (blocks.length === 0) {
		return (
			<p className="rounded-lg border border-gray-200 p-6 text-center text-sm text-gray-500">
				No upcoming availability blocks.
			</p>
		);
	}

	return (
		<ul className="flex flex-col gap-3">
			{blocks.map(block => (
				<AvailabilityListItem key={block.id} block={block} />
			))}
		</ul>
	);
};
