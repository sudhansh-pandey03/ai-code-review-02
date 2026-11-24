# 00: Investigation (sirf padha, kuch change nahi kiya)

Is step mein maine sirf code padha. Koi bhi code file change nahi ki.

## Sabse bada reason: Database aur server alag-alag continent pe

`.env` mein `DATABASE_URL` ka host hai `...-pooler.c-3.ap-southeast-1.aws.neon.tech`. Matlab:

- Database **Singapore** (`ap-southeast-1`) mein hai.
- Connection **pooled** hai (`-pooler`), yeh achha hai.
- Repo mein `vercel.json` nahi hai, isliye Vercel functions shayad default region **US East (`iad1`)** mein chal rahe hain. Yeh aapko Vercel dashboard mein confirm karna hoga.

Agar server US mein hai aur DB Singapore mein, to **har ek query** mein lagbhag 200 ms se zyada lagte hain. Neeche dekho, ek sidebar click pe 6 se 10 queries hoti hain. Isliye ek click mein 2 se 3 second tak lag sakte hain.

### Ek sidebar click pe kya-kya hota hai (example: Settings)

| Kahan | Kya hota hai | DB round trips |
|---|---|---|
| `proxy.ts:5` → `auth-proxy.ts:29` | `auth.api.getSession()` | 1 |
| `app/(protected)/layout.tsx:9` | `requireAuth()` → `getSession()` | 1 |
| `app/(protected)/dashboard/layout.tsx:13` | `requireAuth()` → `getSession()` | 1 |
| `app/(protected)/dashboard/layout.tsx:14` | `getUserSubscription()` (sidebar plan badge, abhi uncommitted change) | 1 |
| `settings/page.tsx` | `requireAuth()` → `getSession()` | 1 |
| `get-settings.ts:7, 21, 22` | user, subscription, usage **ek ke baad ek** | 4 (usage ke andar subscription dobara + installation + count) |

Total: lagbhag **9 round trips**, aur zyadatar sequential.

---

## Checklist ke 8 points

### 1. Har dashboard route mein `loading.tsx` hai?

**Nahi.** Sirf ek hai:

- ✅ `app/(protected)/dashboard/(overview)/loading.tsx`
- ❌ `app/(protected)/dashboard/repos/page.tsx`
- ❌ `app/(protected)/dashboard/pull-request/page.tsx`
- ❌ `app/(protected)/dashboard/pull-request/[id]/page.tsx`
- ❌ `app/(protected)/dashboard/github/page.tsx`
- ❌ `app/(protected)/dashboard/settings/page.tsx`

**Asar:** yeh pages dynamic hain (session check karte hain). `loading.tsx` ke bina, `<Link>` inhe prefetch nahi kar pata, aur click ke baad screen tab tak freeze dikhti hai jab tak server poora page na bana le.

**Fix lagega:** ✅ (a)

### 2. Sidebar `<Link>` use karta hai?

**Haan, sahi hai.**

- `features/dashboard/components/dashboard-nav.tsx:58`: `<Link href={item.href}>`
- `features/dashboard/components/dashboard-sidebar.tsx:36`: logo bhi `<Link>` hai
- Koi `<a href>` ya `router.push` onClick mein navigation ke liye nahi hai (`user-menu.tsx:85` mein `router.push` sirf logout ke baad hai, woh theek hai).

**Fix lagega:** ❌ (b) ki zarurat nahi. Prefetch tabhi kaam karega jab (a) ke `loading.tsx` add honge.

### 3. Session har request pe DB se aata hai? Cookie cache hai? `cache()` hai?

**Haan, har baar DB se, aur ek request mein 4 baar.**

- `lib/auth.ts:5`: `betterAuth({...})` mein `session.cookieCache` **set nahi hai**. Isliye har `getSession()` DB query karta hai.
- `features/auth/actions/index.ts:28-32`: `getServerSession()` React `cache()` mein **wrapped nahi hai**. Isliye ek hi page render mein layout aur page dono alag-alag DB query karte hain.
- `proxy.ts:11`: matcher `/dashboard/:path*` pe proxy chalta hai, aur `auth-proxy.ts:29` har request pe `getSession()` (DB) call karta hai.
- Session check in jagah hota hai: `proxy`, `app/(protected)/layout.tsx:9`, `app/(protected)/dashboard/layout.tsx:13`, aur har `page.tsx`.

**Fix lagega:** ✅ (c)

**Dhyan dene wali baat (trade-off):** cookie cache on karne ke baad, agar kisi session ko DB se delete/revoke karo, to woh max 5 minute tak cookie se valid dikhega. Is app ke liye yeh theek lagta hai.

**Proxy ke baare mein ek extra suggestion (aapki permission chahiye):** Better Auth khud recommend karta hai ki proxy/middleware mein sirf cookie hai ya nahi check karo (`getSessionCookie`, koi DB call nahi), aur asli check layout mein karo. Isse har click pe 1 round trip aur bachega. Lekin yeh auth flow ka change hai, isliye maine ise apne aap nahi kiya. Aap bolo to karunga.

### 4. Server components bina cache ke GitHub API call karte hain?

**Haan, Overview page pe.**

- `features/overview/server/repo-summary.ts`: `getInstallationReposPage()` har Overview load pe call hota hai.
- `features/github/server/repos.ts`: har call mein pehle installation token banta hai (`getInstallationOctokit`), phir `GET /installation/repositories`. Yeh GitHub tak 1-2 extra round trips hain, koi cache nahi.
- Repositories page (`repo-list.tsx`) client pe TanStack Query use karta hai, aur `features/github/lib/repos-query.ts` mein `staleTime: 10 minute` already set hai. Woh theek hai.

**Fix lagega:** ✅ (d). Server pe `unstable_cache` with `revalidate: 300`, kyunki Overview server component hai.

### 5. Sequential `await` jo parallel ho sakte hain?

**Haan:**

- `features/settings/server/get-settings.ts:7, 21, 22`: user, subscription, usage teeno ek ke baad ek. Teeno independent hain.
- `features/billing/server/usage.ts` (`getUsageSummary`): `getUserSubscription` aur `getReviewsThisMonth` ek ke baad ek.
- `app/(protected)/dashboard/layout.tsx:13-14`: session ke baad subscription. Yeh dependent hai (userId chahiye), isliye parallel nahi ho sakta, lekin `cache()` se session wala hissa sasta ho jayega.
- `app/(protected)/dashboard/(overview)/page.tsx:23-24`: session ke baad installation status. Dependent hai, chhod sakte hain.

**Fix lagega:** ✅ (e)

### 6. Prisma singleton hai? `.env.example` mein pooled URL hai?

- `lib/db.ts:5-24`: **haan, singleton sahi hai.** Production mein module ek baar load hota hai, aur dev mein `globalThis` pe save hota hai.
- **`.env.example` file exist hi nahi karti.**
- Asli `.env` mein URL already pooled hai (`-pooler`), yeh achha hai.

**Fix lagega:** ✅ (f). `.env.example` banaunga (sirf variable names, koi secret nahi) aur pooled URL ka comment add karunga.

### 7. Bina zarurat "use client" ya bhaari client imports?

- `features/reviews/components/pull-request-list.tsx:1` ("use client") `review-markdown.tsx` import karta hai, jo `react-markdown` + `remark-gfm` laata hai. Yeh **bhaari libraries browser mein jaati hain**, jabki markdown server pe hi render ho sakta hai.
- `features/dashboard/components/dashboard-header.tsx:8`: "use client" hai, lekin sirf `SidebarTrigger` ko client chahiye. Chhota issue hai, iska asar kam hai.
- `features/dashboard/components/settings-content.tsx:8`: poora settings page client component hai. Medium issue hai, abhi chhod raha hoon.
- `next.config.ts`: `@phosphor-icons/react` Next.js ki default `optimizePackageImports` list mein nahi hai (`lucide-react` aur `date-fns` hain). Phosphor ka main import bahut bada barrel file hai, isliye dev mein har page compile slow hota hai. Production pe asar kam hai, lekin config mein ek line add karna safe hai.

**Fix lagega:** ✅ (g). Markdown ko server pe render karna, aur phosphor ko `optimizePackageImports` mein add karna.

### 8. TanStack Query `staleTime`

- `components/providers/query-provider.tsx`: `new QueryClient()` bina default options. Default `staleTime` 0 hai.
- Lekin abhi app mein sirf ek query hai (`githubReposInfiniteQuery`) aur uska `staleTime` 10 minute set hai.

**Fix lagega:** ❌. Abhi koi zarurat nahi.

---

## Plan: kaunse fixes lagenge

| Fix | Lagega? | Kahan |
|---|---|---|
| (a) `loading.tsx` har route mein | ✅ | 5 naye `loading.tsx` |
| (b) Sidebar `<Link>` | ❌ already sahi | - |
| (c) Cookie cache + `cache()` | ✅ | `lib/auth.ts`, `features/auth/actions/index.ts` |
| (d) GitHub API cache | ✅ | `features/github/server/repos.ts` ya `repo-summary.ts` |
| (e) `Promise.all` | ✅ | `get-settings.ts`, `usage.ts` |
| (f) Prisma + `.env.example` | ✅ (sirf `.env.example`) | `.env.example` (naya) |
| (g) Extra | ✅ | markdown server pe, `next.config.ts` |
| Region (`vercel.json`) | ❓ aapse puchna hai | `vercel.json` (naya) |
| Proxy cookie-only check | ❓ aapse puchna hai | `features/auth/utils/auth-proxy.ts` |

## Jo aapko khud karna padega (code se nahi ho sakta)

- Vercel → Project → Settings → Functions → **Function Region**: Singapore (`sin1`) choose karo, database ke paas. Ya main `vercel.json` mein `"regions": ["sin1"]` daal sakta hoon, aapki permission se.
- Vercel → Settings → Environment Variables: confirm karo ki `DATABASE_URL` wahi **pooled** URL hai (`-pooler` wala), jo local `.env` mein hai.
