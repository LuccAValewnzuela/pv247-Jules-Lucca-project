import { type Header, flexRender, type Cell } from '@tanstack/react-table';
import { type PropsWithChildren } from 'react';

export const Table = ({ children }: PropsWithChildren) => (
	<div className="w-full overflow-x-auto rounded-lg border border-gray-200">
		<table className="min-w-full text-sm">{children}</table>
	</div>
);

export const TableHead = ({ children }: PropsWithChildren) => (
	<thead className="bg-gray-50 text-xs font-semibold tracking-wide text-gray-600 uppercase">
		{children}
	</thead>
);

export const TableRow = ({ children }: PropsWithChildren) => (
	<tr className="border-t border-gray-200 even:bg-gray-50">{children}</tr>
);

export const TableHeaderCell = <T,>({
	header
}: {
	header: Header<T, unknown>;
}) => (
	<th className="px-4 py-3 text-left whitespace-nowrap">
		{flexRender(header.column.columnDef.header, header.getContext())}
	</th>
);

export const TableBody = ({ children }: PropsWithChildren) => (
	<tbody>{children}</tbody>
);

export const TableDataCell = <T,>({ cell }: { cell: Cell<T, unknown> }) => (
	<td
		className="px-4 py-3 align-middle"
		style={{
			width: cell.column.getSize()
		}}
	>
		{flexRender(cell.column.columnDef.cell, cell.getContext())}
	</td>
);
