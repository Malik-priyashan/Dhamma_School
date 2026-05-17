import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./src/config";
import { NextRequest, NextResponse } from "next/server";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

export default function middleware(req: NextRequest) {
  const token = req.cookies.get("accessToken")?.value || req.cookies.get("auth_token")?.value;
  console.log("[middleware] token check", {
    hasAccessToken: Boolean(req.cookies.get("accessToken")?.value),
    hasAuthToken: Boolean(req.cookies.get("auth_token")?.value),
    isAuthenticated: Boolean(token),
  });
  const { pathname } = req.nextUrl;
  
  const isAuthPage = pathname.includes("/login") || pathname.includes("/register");
  
  // Add the specific protected routes here
  const protectedRoutes = ["/prefect-board", "/announcing", "/join-us"];
  const isProtectedRoute = protectedRoutes.some(route => pathname.includes(route));

  // If trying to access a protected route without being logged in, redirect to login
  if (!token && isProtectedRoute) {
    const localePrefix = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
    const url = req.nextUrl.clone();
    url.pathname = `/${localePrefix}/login`;
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from the login/register pages
  if (token && isAuthPage) {
    const localePrefix = locales.find((l) => pathname.startsWith(`/${l}`)) || defaultLocale;
    const url = req.nextUrl.clone();
    url.pathname = `/${localePrefix}`;
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
