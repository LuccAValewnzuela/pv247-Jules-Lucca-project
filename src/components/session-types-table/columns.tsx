import { SessionType } from "@/db/schema";
import { ColumnDef } from "@tanstack/react-table";

const priceFormatter = new Intl.NumberFormat('en-GB', {
    currency: 'EUR',
    style: 'currency'
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Prague'
});

export const columns: ColumnDef<SessionType>[] = [
    {
        accessorKey: "name",
        header: "NAME",
    },
    {
        accessorKey: "durationMinutes",
        header: "DURATION",
        cell: ({ getValue }) => <span>{getValue<number>()} min</span>
    },
    {
        accessorKey: "description",
        header: "DESCRIPTION",
    },
    {
        accessorKey: "priceCents",
        header: "PRICE",
        cell: ({ getValue }) => priceFormatter.format(getValue<number>() / 100)
    },
    {
        accessorKey: "isActive",
        header: "ACTIVE",
        cell: ({ getValue }) => {
            const active = getValue<Boolean>();

            return (
                <span className={active ? 
                    'rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700'
                    : 'rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600'}
                >
                    {active ? 'Active' : 'Inactive'}
                </span>
            );
        }
    },
];