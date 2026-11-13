import { NextResponse } from "next/server";

// TODO: route protection — keep unauthenticated visitors out of /my-bookings
// (client area) and /dashboard (therapist area), e.g. by checking the auth
// session here and redirecting to the sign-in page.
// See the Next.js 16 "Proxy" guide (formerly Middleware).
export default function proxy() {
  return NextResponse.next();
}
