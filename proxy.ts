import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/user") ||
    pathname.startsWith("/technician") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/cart");

  const isAuthRoute =
    pathname === "/auth/login" ||
    pathname === "/auth/register" ||
    pathname === "/auth/forgot-password";

  // Redirect unauthenticated users trying to access protected routes
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users trying to access login/register to dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/user", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/technician/:path*",
    "/checkout/:path*",
    "/cart/:path*",
    "/auth/:path*",
  ],
};
