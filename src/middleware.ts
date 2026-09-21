import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import authConfig from "./auth.config";

const ADMIN_ONLY_PREFIXES = ["/reports/clients", "/clienti", "/categorie", "/preventivi"];
const SUPERVISOR_ONLY_PREFIXES = ["/reports/collaboratori", "/reports/overview", "/utenti"];

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const isLoginPage = nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    const loginUrl = new URL("/login", nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  const role = req.auth?.user?.role;

  if (
    role === "EMPLOYEE" &&
    (ADMIN_ONLY_PREFIXES.some((p) => nextUrl.pathname.startsWith(p)) ||
      SUPERVISOR_ONLY_PREFIXES.some((p) => nextUrl.pathname.startsWith(p)))
  ) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  if (
    role === "ADMIN" &&
    SUPERVISOR_ONLY_PREFIXES.some((p) => nextUrl.pathname.startsWith(p))
  ) {
    return NextResponse.redirect(new URL("/", nextUrl.origin));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
