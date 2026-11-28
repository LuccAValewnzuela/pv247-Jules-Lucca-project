import { requireTherapist } from "@/auth/session";
import { BookingsCalendar } from "@/components/bookings";
import { Loader } from "@/components/ui/loader";
import { buildMonthGrid, parseMonthParam } from "@/lib/calendar";
import { getBookingsForMonth } from "@/server/bookings";
import { Suspense } from "react";


type TherapistBookingCalendarProps = Pick<PageProps<'/dashboard/bookings'>, 'searchParams'>;

const TherapistBookingCalendar = async ({ searchParams } : TherapistBookingCalendarProps) => {
    await requireTherapist('/dashboard/bookings');

    const { month: monthParam } = await searchParams;
    const month = parseMonthParam(monthParam);
    const bookings = await getBookingsForMonth(month);

    if(!bookings) {
        return (
            <p className="rounded-lg border border-gray-200 p-6 text-sm text-gray-500">
                No bookings found.
            </p>
        );
    }

    return (
        <BookingsCalendar
            month={month}
            days={buildMonthGrid(month)}
            bookings={bookings}
            todayMonthKey={parseMonthParam(undefined).key}
            isTherapist={true}
        />
    );
};


const TherapistBookings = ({ searchParams }: PageProps<'/dashboard/bookings'> ) => (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
            <h1 className="text-2xl font-semibold">Bookings</h1>
            <Suspense fallback={<Loader />}>
                <TherapistBookingCalendar searchParams={searchParams} />
            </Suspense>
        </main>
);

export default TherapistBookings;