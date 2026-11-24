import { auth } from "@/lib/auth";
import { getSessionCookie } from "better-auth/cookies";
import { getSafeCallbackPath, SIGN_IN_PATH } from "./index";
import { NextRequest, NextResponse } from "next/server";

function redirectToSignIn(request: NextRequest, pathname: string) {
  const signInUrl = new URL(SIGN_IN_PATH, request.url);
  // Include query string so filters/search params survive the round-trip through sign-in.
  signInUrl.searchParams.set(
    "callbackUrl",
    `${pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(signInUrl);
}

function getPostAuthRedirectPath(request: NextRequest): string {
  const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
  return getSafeCallbackPath(callbackUrl);
}

// "/" is always public
// "/sign-in": logged-in users redirect away; guests process
export async function handleAuthProxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  if (pathname === SIGN_IN_PATH) {
    // Full check here (rare page): a cookie-only check could loop between
    // /sign-in and /dashboard when the cookie exists but the session expired.
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (session) {
      const redirectPath = getPostAuthRedirectPath(request);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next();
  }

  // Dashboard: only check that a session cookie exists (no database call).
  // The real session check happens in the dashboard layouts (requireAuth).
  if (!getSessionCookie(request)) {
    return redirectToSignIn(request, pathname);
  }

  return NextResponse.next();
}
