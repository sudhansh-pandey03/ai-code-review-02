# 02: Session cookie cache + React `cache()`

## Problem kya tha

Ek sidebar click pe login session **4 baar** check hota tha (proxy, `(protected)/layout`, `dashboard/layout`, aur page). Har check `auth.api.getSession()` se database query karta tha, aur DB door (Singapore) hai. Isliye sirf session check mein hi kaafi time lag raha tha.

## Kya change kiya

Do cheezein:

1. **Cookie cache (Better Auth):** login ke baad Better Auth session ki ek signed (tamper-proof) copy cookie mein rakhta hai, 5 minute ke liye. Jab tak yeh cookie valid hai, `getSession()` DB se nahi poochta, cookie se hi session padh leta hai.
2. **React `cache()`:** ek hi page render ke andar layout aur page dono `getServerSession()` call karte hain. `cache()` pehli call ka result yaad rakhta hai, aur baaki calls wahi result use karti hain. Matlab ek request mein session sirf **ek baar** fetch hota hai.

`features/auth/actions/index.ts` file ke upar `"use server"` likha hai. Aisi file se sirf `async function` export kar sakte hain. Isliye maine `cache()` wala function file ke andar private rakha (`getCachedSession`), aur exported `getServerSession` usko call karta hai. Baaki code ko kuch badalna nahi pada.

**Trade-off:** agar kisi user ka session DB se delete karo (jaise forced logout), to woh max 5 minute tak cookie se logged-in dikh sakta hai. Normal logout pe cookie turant delete ho jaati hai, to uspe koi asar nahi.

**Ek limit:** cookie cache sirf tab banta/refresh hota hai jab Better Auth cookie set kar sake (jaise login ke waqt ya `/api/auth/*` calls pe). Server component page render mein cookie set nahi ho sakti. Isliye 5 minute ke baad cache expire hone pe dobara DB query hogi. Lekin `cache()` ki wajah se phir bhi har click pe **sirf 1** query hogi, 4 nahi.

## Files changed

- `lib/auth.ts`: modified
- `features/auth/actions/index.ts`: modified

## Code changes (line by line)

### `lib/auth.ts`

**Pehle (Before):** lines 19–21

```ts
  }, 

   plugins: [nextCookies()] 
```

**Baad mein (After):** lines 19–30

```ts
  },

  // Cache the session in a signed cookie for 5 minutes, so getSession()
  // doesn't need a database query on every request.
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },

   plugins: [nextCookies()]
```

**Har line ka matlab:**

- Line 19: `},`: `socialProviders` block ka end (pehle jaisa hi; sirf line ke end ka extra space hata).
- Line 20: khali line.
- Line 21-22: comment, jo batata hai ki yeh setting kyun hai.
- Line 23: `session: {`: Better Auth ki session settings shuru.
- Line 24: `cookieCache: {`: cookie cache ki settings.
- Line 25: `enabled: true,`: cookie cache on kiya (default off hota hai).
- Line 26: `maxAge: 5 * 60,`: cookie 300 second (5 minute) tak valid rahegi.
- Line 27: `},`: `cookieCache` band.
- Line 28: `},`: `session` band.
- Line 29: khali line.
- Line 30: `plugins: [nextCookies()]`: pehle jaisa hi, koi change nahi (sirf end ka extra space hata). Yeh plugin Next.js server actions mein cookies set karne deta hai.

### `features/auth/actions/index.ts`

**Pehle (Before):** lines 3–4

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
```

**Baad mein (After):** lines 3–5

```ts
import { cache } from "react";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
```

**Har line ka matlab:**

- Line 3: `import { cache } from "react";`: **naya.** React ka `cache` function laaya, jo ek request ke andar function ka result yaad rakhta hai.
- Line 4-5: pehle wale imports, koi change nahi.

**Pehle (Before):** lines 28–32

```ts
export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
```

**Baad mein (After):** lines 29–38

```ts
// One session lookup per request: layouts and the page share the result.
const getCachedSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function getServerSession() {
  return getCachedSession();
}
```

**Har line ka matlab:**

- Line 29: comment, jo batata hai ki ab har request mein ek hi lookup hoga.
- Line 30: `const getCachedSession = cache(async () => {`: ek private function banaya, jo `cache()` mein wrapped hai. Export nahi kiya, kyunki `"use server"` file sirf async functions export kar sakti hai.
- Line 31: `return auth.api.getSession({`: pehle jaisa hi, Better Auth se session maanga.
- Line 32: `headers: await headers(),`: request ke headers (cookies inmein hoti hain) diye.
- Line 33: `});`: `getSession` call band.
- Line 34: `});`: `cache(...)` band.
- Line 35: khali line.
- Line 36: `export async function getServerSession() {`: exported naam aur signature pehle jaisa hi hai, isliye `requireAuth`, `requireUnauth`, API routes, sab bina change ke chalte rahenge.
- Line 37: `return getCachedSession();`: ab seedha DB nahi, cached function call karta hai.
- Line 38: `}`: function band.

## Iska fayda

- Ek click pe session ke liye DB queries **3 se ghat ke 1** (layouts + page). Proxy wali query change 03 mein hategi.
- Login ke baad pehle 5 minute (aur har `/api/auth` call ke baad) session cookie se aata hai, matlab **0 DB queries**.
- Agar server US mein aur DB Singapore mein hai, to har click pe lagbhag 400-600 ms bach sakte hain.

## Kaise test karein

1. `npx tsc --noEmit` aur `npm run build` pass hone chahiye.
2. Logout karke dobara GitHub se login karo. Browser DevTools → Application → Cookies mein ab `better-auth.session_data` naam ki ek nayi cookie dikhni chahiye.
3. Dashboard ke saare pages kholo. Sab pehle jaisa kaam karna chahiye.
4. Logout karo. Dashboard pe jaane ki koshish karo, sign-in page pe redirect hona chahiye.

## Rollback kaise karein

- Is change ka commit revert karo: `git revert <commit-hash>` (commit message: "perf: cache session in cookie and per request").
- Ya manually: `lib/auth.ts` se `session: { cookieCache: ... }` block hatao, aur `actions/index.ts` mein `getServerSession` ko wapas seedha `auth.api.getSession(...)` return karne do aur `cache` import hatao.
