# Performance Changes: Suddh-AI-Review

## Problem kya tha

Vercel pe deployed app mein sidebar ka koi bhi link click karo to naya page khulne mein bahut time lagta tha. Click ke baad screen pe kuch nahi badalta tha, jab tak server poora page bana ke na bhej de.

Investigation mein yeh main reasons mile (details [00-investigation.md](00-investigation.md) mein):

1. **Database door hai:** Neon database Singapore (`ap-southeast-1`) mein hai, lekin `vercel.json` na hone ki wajah se functions shayad US East mein chal rahe the. Har DB query Pacific ke paar jaati thi.
2. **Ek click pe bahut saari DB queries:** session 4 baar check hota tha (proxy + 2 layouts + page), aur kai queries ek ke baad ek (sequential) chalti thi. Settings page pe lagbhag 9 round trips.
3. **Loading screen nahi thi:** sirf Overview ka `loading.tsx` tha. Baaki pages pe click ke baad screen freeze dikhti thi.
4. **GitHub API har baar call hoti thi:** Overview har load pe GitHub se repos laata tha, bina cache ke.
5. **Bhaari JavaScript browser mein:** Pull Requests page markdown library (168 KB) browser mein bhejta tha.

## Fixes jo lagaye

1. Har dashboard page ke liye turant dikhne wala loading screen.
2. Session ko cookie mein 5 minute cache kiya, aur ek request mein session sirf ek baar fetch hota hai (`cache()`).
3. Proxy ab dashboard ke liye sirf cookie check karta hai (DB call nahi). Asli check layout mein hota hai.
4. GitHub repos ki list server pe 5 minute cache hoti hai.
5. Independent DB queries ab ek saath (`Promise.all`) chalti hain, aur subscription ek request mein ek hi baar fetch hota hai.
6. `.env.example` banaya, jisme pooled DB URL ka note hai.
7. Pull Requests list server component bani, isliye markdown library ab browser mein nahi jaati.
8. `vercel.json` se functions Singapore (`sin1`) mein, database ke paas.

## Jo fixes nahi lagaye (aur kyun)

- **Sidebar `<Link>` (spec ka point b):** sidebar pehle se `next/link` `<Link>` use karta hai. Kuch badalne ki zarurat nahi thi.
- **`optimizePackageImports` for Phosphor icons:** app dev aur build dono mein Turbopack use karta hai (`Next.js 16.2.9 (Turbopack)`). Next.js docs ke hisaab se Turbopack imports apne aap optimize karta hai, isliye yeh config bekaar hoti. Nahi lagayi.
- **TanStack Query `staleTime` (point 8):** app mein ek hi query hai (repos), aur uska `staleTime` pehle se 10 minute hai.
- **Prisma singleton (point 6):** `lib/db.ts` pehle se sahi singleton hai.
- **`dashboard-header.tsx` aur `settings-content.tsx` ka `"use client"`:** inka asar chhota hai, aur badalne mein risk zyada tha. Abhi chhod diye.

## Index

- [00 - Investigation](00-investigation.md)
- [01 - Loading states](01-loading-states.md)
- [02 - Session cookie cache + `cache()`](02-session-cache.md)
- [03 - Proxy mein sirf cookie check](03-proxy-cookie-check.md)
- [04 - GitHub API cache](04-github-api-cache.md)
- [05 - Parallel DB queries + subscription cache](05-parallel-queries.md)
- [06 - `.env.example` + pooled DB note](06-env-example-pooled-db.md)
- [07 - Markdown server pe render](07-server-markdown.md)
- [08 - Vercel region Singapore](08-vercel-region.md)

## Har change ka git commit

Har change alag commit mein hai, taaki kisi ek ko bhi `git revert <hash>` se wapas le sako:

| # | Commit message |
|---|---|
| 01 | `perf: add loading states for dashboard routes` |
| 02 | `perf: cache session in cookie and per request` |
| 03 | `perf: proxy checks only the session cookie for dashboard` |
| 04 | `perf: cache GitHub installation repos for 5 minutes` |
| 05 | `perf: run independent queries in parallel and cache subscription per request` |
| 06 | `docs: add .env.example with pooled database note` |
| 07 | `perf: render pull request reviews on the server` |
| 08 | `perf: run Vercel functions in Singapore next to the database` |

Hash dekhne ke liye: `git log --oneline --grep="perf:"`

## Summary table

| # | Change | Files | Expected improvement |
|---|---|---|---|
| 01 | Loading states | `features/dashboard/components/page-skeleton.tsx` (new), 5 × `loading.tsx` (new) | Click ke turant baad screen badalti hai (freeze khatam); `<Link>` prefetch kaam karta hai |
| 02 | Session cookie cache + `cache()` | `lib/auth.ts`, `features/auth/actions/index.ts` | Har click pe session ki DB queries 3 se 1 (cookie valid ho to 0) |
| 03 | Proxy cookie-only check | `features/auth/utils/auth-proxy.ts` | Har dashboard click pe 1 DB round trip kam (render se pehle wala) |
| 04 | GitHub repos cache (5 min) | `features/github/server/repos.ts` | Overview/Repos pe GitHub ke 1-2 round trips bache (≈200-600 ms) |
| 05 | `Promise.all` + subscription `cache()` | `features/billing/server/subscription.ts`, `features/settings/server/get-settings.ts`, `features/billing/server/usage.ts` | Settings pe 3 sequential steps → 1; har page pe 1-3 queries kam |
| 06 | `.env.example` + pooled URL note | `.env.example` (new), `.gitignore` | Galat (non-pooled) DB setup se bachav |
| 07 | Markdown server pe | `features/reviews/components/pull-request-list.tsx` | Browser JS 168 KB kam; client JS total 1.9 MB → 1.7 MB |
| 08 | Vercel region `sin1` | `vercel.json` (new) | Har DB query ≈200 ms se ghat ke kuch ms; ek click pe 1-2 s tak bachat (agar pehle US mein the) |

## Jo aapko khud karna hai (code se nahi ho sakta)

1. **Vercel region confirm karo:** deploy ke baad Vercel → Project → Settings → Functions mein region **Singapore (`sin1`)** dikhna chahiye. `vercel.json` isko set karta hai. Agar aap dashboard se koi aur region chahte ho, to `vercel.json` hata ke wahan se choose karo, lekin woh DB (Singapore) ke paas hona chahiye.
2. **Pooled `DATABASE_URL` Vercel mein set karo:** Vercel → Settings → Environment Variables mein `DATABASE_URL` ki value mein host `...-pooler...neon.tech` hona chahiye (jaise local `.env` mein hai). Non-pooled URL (bina `-pooler` ke) mat lagao.
3. **Neon compute "scale to zero" check karo:** Neon free plan pe database kuch der idle rehne ke baad so jaata hai. Pehli request pe use jaagne mein 0.5-1 second lagta hai. Agar yeh pareshani de, to Neon console → Compute settings mein "Scale to zero" delay badhao (paid plan pe band bhi kar sakte ho).
4. **Redeploy karo:** env variables ya region badalne ke baad Vercel pe naya deployment chalao, tabhi changes lagenge.
5. **Inngest ka region:** Inngest functions bhi Vercel pe `/api/inngest` route se chalte hain, to woh bhi `sin1` mein chalenge. Agar Inngest Cloud dashboard mein koi app URL/region setting ho, to wahi Vercel URL rakho.
6. **Speed check karo:** deploy ke baad browser DevTools → Network mein page requests ka `x-vercel-id` header dekho (`sin1` hona chahiye), aur sidebar clicks ka time pehle se compare karo.
