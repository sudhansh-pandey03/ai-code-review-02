# 05: DB queries ek saath (parallel) chalana + subscription ka per-request cache

## Problem kya tha

Kuch jagah DB queries **ek ke baad ek** chal rahi thi, jabki woh ek doosre pe depend nahi karti:

- `get-settings.ts`: pehle user, phir subscription, phir usage. 3 round trips line mein.
- `usage.ts` (`getUsageSummary`): pehle subscription, phir is month ke reviews ka count.

Saath hi, `getUserSubscription()` ek hi request mein kai baar call hota tha (dashboard layout ka sidebar badge, Settings page, usage summary, Overview). Har baar nayi DB query.

DB door hai, to har extra round trip mehenga hai.

## Kya change kiya

1. **`Promise.all`:** jo queries independent hain, unhe ek saath start kiya. `Promise.all` sabke khatam hone ka wait karta hai. Total time = sabse slow query ka time, sabka jod nahi.
2. **`cache()` on `getUserSubscription`:** React ka `cache()` ek request ke andar result yaad rakhta hai. Layout aur page dono subscription maange, to DB query sirf ek baar hogi. Request khatam hote hi cache khatam, isliye purana data agli request mein nahi dikhta.
   - Asli function ka naam `fetchUserSubscription` kiya (private), aur `getUserSubscription` uska cached version hai. Export ka naam same hai, isliye baaki files ko kuch nahi badalna pada.
   - Razorpay webhook ya Inngest jaise jagah (jo React render nahi hai) mein `cache()` kuch nahi karta, function seedha chalta hai. Isliye wahan behavior same hai.

## Files changed

- `features/billing/server/subscription.ts`: modified
- `features/settings/server/get-settings.ts`: modified
- `features/billing/server/usage.ts`: modified

## Code changes (line by line)

### `features/billing/server/subscription.ts`

**Pehle (Before):** lines 3–9

```ts
import type { UserSubscription } from "@/features/dashboard/lib/types";
import { getRazorpay } from "@/features/billing/lib/razorpay";
import { prisma } from "@/lib/db";

export async function getUserSubscription(
  userId: string
): Promise<UserSubscription> {
```

**Baad mein (After):** lines 3–10

```ts
import { cache } from "react";
import type { UserSubscription } from "@/features/dashboard/lib/types";
import { getRazorpay } from "@/features/billing/lib/razorpay";
import { prisma } from "@/lib/db";

async function fetchUserSubscription(
  userId: string
): Promise<UserSubscription> {
```

**Har line ka matlab:**

- Line 3: `import { cache } from "react";`: **naya.** React ka per-request cache function.
- Line 4-6: pehle jaise imports.
- Line 7: khali line.
- Line 8: `async function fetchUserSubscription(`: **badla.** Pehle `export async function getUserSubscription(` tha. Ab yeh private function hai jo asli DB query karta hai. Andar ka code (lines 11-49) bilkul same hai.
- Line 9-10: parameter aur return type, pehle jaise.

**Pehle (Before):** lines 48–50

```ts
  return { plan: "free", status: "canceled", renewsAt };
}

```

**Baad mein (After):** lines 49–55

```ts
  return { plan: "free", status: "canceled", renewsAt };
}

// The layout, Settings, Overview and usage all ask for the subscription in
// the same request; cache() makes that one database query instead of several.
export const getUserSubscription = cache(fetchUserSubscription);

```

**Har line ka matlab:**

- Line 49-50: pehle jaisa, function ka end.
- Line 51: khali line.
- Line 52-53: comment, jo batata hai ki kaun-kaun subscription maangta hai aur `cache()` kyun lagaya.
- Line 54: `export const getUserSubscription = cache(fetchUserSubscription);`: **naya.** Same naam se cached version export kiya. Ek request mein pehli call DB jaati hai, baaki calls (same `userId` ke saath) wahi result use karti hain.
- Line 55: khali line, phir `createProSubscription` pehle jaisa.

### `features/settings/server/get-settings.ts`

**Pehle (Before):** lines 7–22

```ts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        image: true,
        createdAt: true,
      },
    });
  
    if (!user) {
      throw new Error("User not found");
    }
  
    const subscription = await getUserSubscription(userId);
    const usage = await getUsageSummary(userId);
```

**Baad mein (After):** lines 7–24

```ts
    // These three don't depend on each other, so run them at the same time.
    const [user, subscription, usage] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      }),
      getUserSubscription(userId),
      getUsageSummary(userId),
    ]);
  
    if (!user) {
      throw new Error("User not found");
    }
```

**Har line ka matlab:**

- Line 7: comment, jo batata hai ki teeno queries independent hain.
- Line 8: `const [user, subscription, usage] = await Promise.all([`: teeno kaam ek saath shuru kiye, aur teeno ke result ek array se nikaale (same order mein).
- Line 9: `prisma.user.findUnique({`: user ka profile (pehle jaisa, bas ab `await` alag se nahi).
- Line 10-16: kaunsa user aur kaunse fields, pehle jaise.
- Line 17: `}),`: user query band.
- Line 18: `getUserSubscription(userId),`: subscription (pehle line 21 pe alag `await` tha).
- Line 19: `getUsageSummary(userId),`: usage (pehle line 22 pe alag `await` tha).
- Line 20: `]);`: `Promise.all` band. Yahan teeno ke khatam hone ka wait hota hai.
- Line 21: khali line.
- Line 22-24: user na mile to error, pehle jaisa. Bas ab yeh check teeno queries ke baad hota hai (pehle sirf user query ke baad hota tha). Result same hai.

### `features/billing/server/usage.ts`

**Pehle (Before):** lines 41–43

```ts
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const subscription = await getUserSubscription(userId);
  const used = await getReviewsThisMonth(userId);
```

**Baad mein (After):** lines 41–45

```ts
export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  const [subscription, used] = await Promise.all([
    getUserSubscription(userId),
    getReviewsThisMonth(userId),
  ]);
```

**Har line ka matlab:**

- Line 41: function signature, pehle jaisa.
- Line 42: `const [subscription, used] = await Promise.all([`: dono kaam ek saath shuru kiye.
- Line 43: `getUserSubscription(userId),`: plan nikalo (ab cached bhi hai).
- Line 44: `getReviewsThisMonth(userId),`: is month ke reviews ka count.
- Line 45: `]);`: dono ka wait. Neeche ka code (pro hai to unlimited, warna 5 ki limit) pehle jaisa.

## Iska fayda

- Settings page: DB ka wait **3 sequential steps se ghat ke 1 parallel step** (andar usage wale 2 steps bhi parallel).
- Har dashboard page pe subscription query layout aur page mein share hoti hai. Settings aur Overview pe **2-3 queries kam**.
- Door DB ke saath, Settings page pe lagbhag 400-700 ms bach sakte hain.

## Kaise test karein

1. `npx tsc --noEmit` aur `npm run build` pass hone chahiye.
2. Settings page kholo. Profile, plan aur usage pehle jaise dikhne chahiye.
3. Sidebar ka plan badge (Free/Pro) sahi dikhna chahiye.
4. Overview page ka "Plan & usage" card sahi dikhna chahiye.

## Rollback kaise karein

- Is change ka commit revert karo: `git revert <commit-hash>` (commit message: "perf: run independent queries in parallel and cache subscription per request").
- Ya manually: `subscription.ts` mein `cache` import aur line 54 hatao, `fetchUserSubscription` ko wapas `export async function getUserSubscription` bana do. `get-settings.ts` aur `usage.ts` mein `Promise.all` ki jagah wapas alag-alag `await` likh do.
