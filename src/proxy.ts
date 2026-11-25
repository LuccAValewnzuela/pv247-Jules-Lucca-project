import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/my-bookings', '/dashboard'];

const isProtected = (pathname: string) =>
	protectedRoutes.some(
		route => pathname === route || pathname.startsWith(`${route}/`)
	);


export default function proxy(request: NextRequest) {
	const { pathname, search } = request.nextUrl;

	if (isProtected(pathname) && !getSessionCookie(request)) {
		const loginUrl = new URL('/login', request.url);
		loginUrl.searchParams.set('callbackUrl', `${pathname}${search}`);
		return NextResponse.redirect(loginUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};
