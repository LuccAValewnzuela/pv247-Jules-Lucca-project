'use client';

import { getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { columns } from "./columns"
import { SessionType } from "@/db/schema"
import { Table, TableBody, TableDataCell, TableHead, TableHeaderCell, TableRow } from "../table";

type SessionTypesTableProps = {
    sessionTypes: SessionType[];
}

export const SessionTypesTable = ({ sessionTypes }: SessionTypesTableProps) => {
    
    const table = useReactTable({
        columns,
        data: sessionTypes,
        getCoreRowModel: getCoreRowModel()
    });

    return (
        <Table>
            <TableHead>
                {table.getHeaderGroups().map(headerGroup => (
                    <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                            <TableHeaderCell key={header.id} header={header} />
                        ))}
                    </TableRow>
                ))}
            </TableHead>
            <TableBody>
                {table.getRowModel().rows.map(row => (
                    <TableRow key={row.id}>
                        {row.getVisibleCells().map(cell => (
                            <TableDataCell key={cell.id} cell={cell} />
                        ))}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};