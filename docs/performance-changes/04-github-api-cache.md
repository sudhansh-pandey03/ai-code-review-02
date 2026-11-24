# 04: GitHub API calls ka server-side cache (5 minute)

## Problem kya tha

Overview page har load pe GitHub API se repositories ki list laata tha (`getInstallationReposPage`). Har baar pehle ek installation token banta tha, phir repos ki request jaati thi. Matlab GitHub tak 1-2 network round trips, har page load pe, bina kisi cache ke. `/api/github/repos` route (Repositories page) bhi yahi function use karta hai.

## Kya change kiya

Next.js ka `unstable_cache` use kiya. Yeh function ka result server pe save kar leta hai. Agli baar same arguments (`installationId`, `page`) ke saath call hone pe GitHub ko call nahi karta, saved result de deta hai. 5 minute (`revalidate: 300`) baad cache purana maana jaata hai, aur nayi copy GitHub se aati hai.

- Asli GitHub wala code ek private function `fetchInstallationReposPage` mein chala gaya (code same hai).
- Exported `getInstallationReposPage` ka naam aur signature same hai, isliye Overview aur `/api/github/repos` dono bina change ke cache ka fayda lete hain.
- Cache key mein `installationId` hai, isliye ek user ko kabhi doosre user ki repos nahi dikhengi.
- Agar GitHub call fail ho (error throw ho), to error cache **nahi** hota. Agli request dobara try karti hai.

Note: Next.js 16 docs ke hisaab se `unstable_cache` ki jagah naya `"use cache"` directive recommended hai. Lekin uske liye poore app mein "Cache Components" on karna padta, jo bahut bada change hai. `unstable_cache` Next 16 mein abhi bhi poori tarah kaam karta hai.

**Trade-off:** agar aap GitHub App mein koi nayi repo add karo, to woh dashboard mein **max 5 minute** baad dikhegi.

## Files changed

- `features/github/server/repos.ts`: modified

## Code changes (line by line)

### `features/github/server/repos.ts`

**Pehle (Before):** lines 1–2

```ts

import { getGithubApp } from "@/features/github/utils/github-app";
```

**Baad mein (After):** lines 1–3

```ts

import { unstable_cache } from "next/cache";
import { getGithubApp } from "@/features/github/utils/github-app";
```

**Har line ka matlab:**

- Line 1: khali line (pehle jaisi).
- Line 2: `import { unstable_cache } from "next/cache";`: **naya.** Next.js ka built-in server cache function. Koi naya npm package nahi.
- Line 3: pehle jaisa.

**Pehle (Before):** lines 65–71

```ts
const REPOS_PER_PAGE = 100;


export async function getInstallationReposPage(
    installationId: number,
    page = 1
): Promise<InstallationReposPage> {
```

**Baad mein (After):** lines 66–74

```ts
const REPOS_PER_PAGE = 100;

// GitHub repo lists change rarely: cache each page for 5 minutes per installation.
const REPOS_CACHE_SECONDS = 5 * 60;

async function fetchInstallationReposPage(
    installationId: number,
    page: number
): Promise<InstallationReposPage> {
```

**Har line ka matlab:**

- Line 66: pehle jaisa, ek page mein 100 repos.
- Line 67: khali line.
- Line 68: comment, jo batata hai ki repo list kam badalti hai, isliye 5 minute ka cache hai.
- Line 69: `const REPOS_CACHE_SECONDS = 5 * 60;`: **naya.** Cache kitne second valid rahega (300).
- Line 70: khali line.
- Line 71: `async function fetchInstallationReposPage(`: **badla.** Pehle yeh `export async function getInstallationReposPage` tha. Ab yeh private function hai jo asli GitHub call karta hai. Andar ka code (lines 75-91) bilkul same hai.
- Line 72: `installationId: number,`: pehle jaisa.
- Line 73: `page: number`: **badla.** Pehle `page = 1` (default value) tha. Default ab exported function mein hai (neeche), taaki cache key hamesha clear ho.
- Line 74: `): Promise<InstallationReposPage> {`: pehle jaisa.

**Pehle (Before):** lines 86–89 (function ka end)

```ts
        hasMore: page * REPOS_PER_PAGE < totalCount,
    };
}
```

**Baad mein (After):** lines 90–106

```ts
        hasMore: page * REPOS_PER_PAGE < totalCount,
    };
}

// The cache key includes the arguments (installationId, page), so users never share results.
const getCachedInstallationReposPage = unstable_cache(
    fetchInstallationReposPage,
    ["github-installation-repos"],
    { revalidate: REPOS_CACHE_SECONDS, tags: ["github-repos"] }
);

export async function getInstallationReposPage(
    installationId: number,
    page = 1
): Promise<InstallationReposPage> {
    return getCachedInstallationReposPage(installationId, page);
}
```

**Har line ka matlab:**

- Line 90-92: pehle jaisa, `fetchInstallationReposPage` ka end.
- Line 93: khali line.
- Line 94: comment, jo batata hai ki cache key mein arguments hain, isliye alag users ka data mix nahi hoga.
- Line 95: `const getCachedInstallationReposPage = unstable_cache(`: **naya.** Cached version banaya.
- Line 96: `fetchInstallationReposPage,`: kaunsa function cache karna hai.
- Line 97: `["github-installation-repos"],`: cache key ka fixed hissa, taaki doosre cached functions se mix na ho. Arguments `installationId` aur `page` Next.js apne aap key mein jod deta hai.
- Line 98: `{ revalidate: REPOS_CACHE_SECONDS, tags: ["github-repos"] }`: 300 second baad nayi copy laao. `tags` se future mein `revalidateTag("github-repos")` call karke cache turant clear kar sakte hain.
- Line 99: `);`: `unstable_cache` band.
- Line 100: khali line.
- Line 101: `export async function getInstallationReposPage(`: exported function, **naam pehle jaisa**, taaki baaki code na badle.
- Line 102: `installationId: number,`: same parameter.
- Line 103: `page = 1`: default page 1 (pehle jaisa behavior).
- Line 104: `): Promise<InstallationReposPage> {`: same return type.
- Line 105: `return getCachedInstallationReposPage(installationId, page);`: ab GitHub ki jagah cached function call hota hai.
- Line 106: `}`: function band.

## Iska fayda

- Overview page pe 5 minute ke andar dobara aane par **GitHub ke 1-2 round trips bachenge** (lagbhag 200-600 ms).
- Repositories page ki API (`/api/github/repos`) bhi cache se tez hogi.
- GitHub API rate limit bhi kam use hoga.

## Kaise test karein

1. `npm run build && npm run start`.
2. Overview page kholo (pehli baar GitHub call hogi), phir refresh karo. Doosri baar "Repositories" card aur "Connected repositories" number tezi se aana chahiye.
3. Repositories page kholo. Repos list pehle jaisi dikhni chahiye.
4. GitHub App settings mein ek repo add/remove karo. Max 5 minute mein dashboard pe dikhna chahiye.

## Rollback kaise karein

- Is change ka commit revert karo: `git revert <commit-hash>` (commit message: "perf: cache GitHub installation repos for 5 minutes").
- Ya manually: `unstable_cache` import aur `getCachedInstallationReposPage` hatao, `fetchInstallationReposPage` ko wapas `export async function getInstallationReposPage(installationId: number, page = 1)` bana do.
