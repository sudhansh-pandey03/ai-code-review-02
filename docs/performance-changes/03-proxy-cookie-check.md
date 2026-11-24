# 03: Proxy mein sirf cookie check (DB call nahi)

## Problem kya tha

`proxy.ts` (Next.js 16 mein middleware ka naya naam) har `/dashboard` request pe `auth.api.getSession()` call karta tha, jo DB query karta hai. Yeh query page render shuru hone se **pehle** hoti thi, aur iske baad layouts session dobara check karte the. Matlab har click pe ek extra DB round trip.

## Kya change kiya

Ab `/dashboard` pages ke liye proxy sirf yeh dekhta hai ki browser mein session **cookie maujood hai ya nahi** (`getSessionCookie`). Isme koi DB call nahi hoti, bas cookie padhi jaati hai. Cookie nahi hai to seedha sign-in pe bhej do.

Asli check (session valid hai ya expire ho gaya) pehle jaisa `app/(protected)/layout.tsx` mein `requireAuth()` karta hai. Isliye security kam nahi hui. Agar koi nakli ya purani cookie bhejega, to layout use sign-in pe bhej dega. Better Auth khud Next.js ke liye yahi pattern recommend karta hai.

`/sign-in` page ke liye maine **poora check** (DB wala) rakha. Wajah: agar cookie hai lekin session expire ho chuka hai, to cookie-only check user ko `/sign-in` se `/dashboard` bhejta, aur dashboard wapas `/sign-in` bhejta. Yeh ek **infinite redirect loop** ban jaata. Sign-in page kabhi-kabhi hi khulta hai, isliye wahan DB call se speed pe koi asar nahi.

## Files changed

- `features/auth/utils/auth-proxy.ts`: modified

## Code changes (line by line)

### `features/auth/utils/auth-proxy.ts`

**Pehle (Before):** lines 1–2

```ts
import { auth } from "@/lib/auth";
import { getSafeCallbackPath, SIGN_IN_PATH } from "./index";
```

**Baad mein (After):** lines 1–3

```ts
import { auth } from "@/lib/auth";
import { getSessionCookie } from "better-auth/cookies";
import { getSafeCallbackPath, SIGN_IN_PATH } from "./index";
```

**Har line ka matlab:**

- Line 1: pehle jaisa, Better Auth ka server object (sign-in page ke check ke liye abhi bhi chahiye).
- Line 2: `import { getSessionCookie } from "better-auth/cookies";`: **naya.** Better Auth ka helper jo request se session cookie padhta hai, bina DB ke. Yeh Better Auth ka hi part hai, koi naya npm package nahi.
- Line 3: pehle jaisa.

**Pehle (Before):** lines 29–42

```ts
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (pathname === SIGN_IN_PATH) {
    if (session) {
      const redirectPath = getPostAuthRedirectPath(request);
      return NextResponse.redirect(new URL(redirectPath, request.url));
    }

    return NextResponse.next();
  }

  if (!session) {
```

**Baad mein (After):** lines 30–47

```ts
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
```

**Har line ka matlab:**

- Line 30: `if (pathname === SIGN_IN_PATH) {`: agar user `/sign-in` pe hai. Pehle yeh check session fetch ke **baad** tha, ab **pehle** hai.
- Line 31-32: comment, jo batata hai ki sign-in pe poora check kyun rakha (redirect loop se bachne ke liye).
- Line 33: `const session = await auth.api.getSession({`: session ka DB wala check ab **sirf sign-in page** pe hota hai, har dashboard click pe nahi.
- Line 34: `headers: request.headers,`: request ke headers (cookies) diye.
- Line 35: `});`: call band.
- Line 36: khali line.
- Line 37: `if (session) {`: agar user pehle se logged in hai...
- Line 38: `const redirectPath = getPostAuthRedirectPath(request);`: ...to `callbackUrl` ya `/dashboard` nikalo (pehle jaisa).
- Line 39: `return NextResponse.redirect(...)`: wahan bhej do (pehle jaisa).
- Line 40: `}`: if band.
- Line 41: khali line.
- Line 42: `return NextResponse.next();`: logged-out user ko sign-in page dikhao (pehle jaisa).
- Line 43: `}`: sign-in wala block band.
- Line 44: khali line.
- Line 45-46: comment, jo batata hai ki dashboard pe sirf cookie check hai aur asli check layout mein hota hai.
- Line 47: `if (!getSessionCookie(request)) {`: **badla hua.** Pehle `if (!session)` tha (DB result). Ab check hota hai ki session cookie hai ya nahi. Nahi hai to agli line (pehle jaisi) `redirectToSignIn` chalti hai.

Baaki lines (`redirectToSignIn`, `getPostAuthRedirectPath`, `"/"` wala check, aur end ka `NextResponse.next()`) bilkul pehle jaisi hain.

## Iska fayda

- Har dashboard click pe **1 DB round trip kam**, aur yeh page render shuru hone se pehle wala round trip tha, to iska asar seedha dikhega.
- Change 02 ke saath milke: pehle har click pe session ke liye 4 queries, ab maximum 1 (aur cookie cache valid ho to 0).

## Kaise test karein

1. Logged out haalat mein `/dashboard/settings` kholo. Sign-in pe redirect hona chahiye, URL mein `callbackUrl=/dashboard/settings` ke saath.
2. Login karo. Dashboard ke saare pages khulne chahiye.
3. Logged in haalat mein `/sign-in` kholo. `/dashboard` pe redirect hona chahiye.
4. **Expired session test:** DevTools → Application → Cookies mein `better-auth.session_token` ki value badal ke kuch bhi kar do, aur `better-auth.session_data` delete kar do. Phir `/dashboard` kholo. Sign-in page aana chahiye, aur koi redirect loop nahi hona chahiye.

## Rollback kaise karein

- Is change ka commit revert karo: `git revert <commit-hash>` (commit message: "perf: proxy checks only the session cookie for dashboard").
- Ya manually: `getSessionCookie` import hatao, `auth.api.getSession(...)` ko wapas `if (pathname === SIGN_IN_PATH)` se pehle le aao, aur `if (!getSessionCookie(request))` ko wapas `if (!session)` kar do.
