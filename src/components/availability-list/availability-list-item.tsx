import {
	formatDuration,
	formatPriceCents,
	formatPragueDate,
	formatTimeRange
} from '@/lib/availability';
import type {
	AvailabilityBlockWithBookings,
	BookedSession
} from '@/server/availability';

import { CancelBlockButton } from './cancel-block-button';

const statusLabels: Record<BookedSession['status'], string> = {
	pending: 'Pending',
	confirmed: 'Confirmed',
	completed: 'Completed',
	cancelled: 'Cancelled'
};

const formatLabels: Record<BookedSession['format'], string> = {
	in_person: 'In person',
	online: 'Online'
};

const BookedSessionRow = ({ booking }: { booking: BookedSession }) => (
	<li className="rounded-md border border-gray-200 bg-white p-3">
		<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
			<span className="font-medium">{booking.client.name}</span>
			<span>{booking.sessionType.name}</span>
			<span className="text-gray-500">
				{formatDuration(booking.startsAt, booking.endsAt)}
			</span>
			<span className="font-medium">
				{formatPriceCents(booking.priceCents)}
			</span>
			<span className="rounded bg-gray-100 px-2 py-0.5 text-xs">
				{statusLabels[booking.status]}
			</span>
			<span className="text-gray-500">{formatLabels[booking.format]}</span>
		</div>
	</li>
);

type AvailabilityListItemProps = {
	block: AvailabilityBlockWithBookings;
};

export const AvailabilityListItem = ({ block }: AvailabilityListItemProps) => (
	<li className="rounded-lg border border-gray-200 p-4">
		<div className="grid gap-4 sm:grid-cols-[minmax(9rem,auto)_1fr_auto] sm:items-start">
			<div>
				<p className="font-medium">{formatPragueDate(block.startsAt)}</p>
				<p className="text-sm text-gray-500">
					{formatTimeRange(block.startsAt, block.endsAt)}
				</p>
			</div>

			<div className="min-w-0">
				{block.bookings.length === 0 ? (
					<p className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-500">
						Free slot
					</p>
				) : (
					<ul className="flex flex-col gap-2">
						{block.bookings.map(booking => (
							<BookedSessionRow key={booking.id} booking={booking} />
						))}
					</ul>
				)}
			</div>

			<div className="sm:justify-self-end">
				<CancelBlockButton blockId={block.id} />
			</div>
		</div>
	</li>
);
