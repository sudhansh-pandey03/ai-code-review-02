# 01: Har dashboard page ke liye loading screen

## Problem kya tha

Sirf Overview page ke paas `loading.tsx` tha. Baaki 5 pages (Repositories, Pull Requests, PR detail, GitHub App, Settings) pe sidebar click karne ke baad screen freeze dikhti thi, jab tak server poora page na bana le. Aur `loading.tsx` ke bina Next.js `<Link>` in dynamic pages ka kuch bhi pehle se prefetch nahi kar pata.

## Kya change kiya

Next.js mein agar kisi folder mein `loading.tsx` ho, to page load hote waqt Next.js turant woh file dikhata hai, aur jab asli page ready ho jaata hai to use replace kar deta hai. Isse user ko click ke turant baad kuch dikhta hai.

Maine ek common component `PageSkeleton` banaya (header + grey placeholder boxes), aur 5 routes mein chhoti `loading.tsx` files banayi jo is component ko use karti hain. Har page ke liye header ka title wahi rakha jo asli page ka hai, taaki loading se asli page pe jaate waqt header "jump" na kare.

Bonus: ab `<Link>` in pages ka loading screen pehle se prefetch kar leta hai, to click pe screen turant badal jaati hai.

## Files changed

- `features/dashboard/components/page-skeleton.tsx`: new
- `app/(protected)/dashboard/repos/loading.tsx`: new
- `app/(protected)/dashboard/pull-request/loading.tsx`: new
- `app/(protected)/dashboard/pull-request/[id]/loading.tsx`: new
- `app/(protected)/dashboard/github/loading.tsx`: new
- `app/(protected)/dashboard/settings/loading.tsx`: new

## Code changes (line by line)

### `features/dashboard/components/page-skeleton.tsx`

**Pehle (Before):** file exist nahi karti thi.

**Baad mein (After):** lines 1–31

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardHeader } from "@/features/dashboard/components/dashboard-header";

type PageSkeletonProps = {
  title: string;
  description?: string;
  /** list = stacked cards, table = rows, card = one wide card */
  variant: "list" | "table" | "card";
};

/** Instant loading screen for a dashboard page while the server renders it. */
export function PageSkeleton({ title, description, variant }: PageSkeletonProps) {
  return (
    <>
      <DashboardHeader title={title} description={description} />
      <div className="flex flex-1 flex-col gap-3 p-4 md:p-6" aria-busy="true" aria-label="Loading">
        {variant === "list" &&
          Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        {variant === "table" && (
          <>
            <Skeleton className="h-8 w-full max-w-xs" />
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </>
        )}
        {variant === "card" && <Skeleton className="h-64 w-full max-w-2xl" />}
      </div>
    </>
  );
}
```

**Har line ka matlab:**

- Line 1: `import { Skeleton } ...`: shadcn ka grey "pulse" wala box laaya, jo loading placeholder banata hai.
- Line 2: `import { DashboardHeader } ...`: wahi header jo har dashboard page ke upar hota hai.
- Line 3: khali line.
- Line 4: `type PageSkeletonProps = {`: is component ko kaunse props milenge, uska TypeScript type.
- Line 5: `title: string;`: header mein dikhne wala title (zaroori).
- Line 6: `description?: string;`: title ke neeche ki chhoti line (optional).
- Line 7: comment, jo batata hai ki teen variant kya hain.
- Line 8: `variant: "list" | "table" | "card";`: page ka shape. List (cards ki line), table (rows), ya ek bada card.
- Line 9: `};`: type khatam.
- Line 10: khali line.
- Line 11: comment, jo batata hai ki component kya karta hai.
- Line 12: `export function PageSkeleton(...)`: component, jo props se title, description aur variant nikalta hai.
- Line 13: `return (`: JSX return shuru.
- Line 14: `<>`: fragment, taaki header aur body dono bina extra div ke return ho sakein.
- Line 15: `<DashboardHeader ... />`: asli page jaisa header turant dikhata hai.
- Line 16: `<div ... aria-busy="true" aria-label="Loading">`: body ka container. Padding asli pages jaisi hai. `aria-busy` screen reader ko batata hai ki content load ho raha hai.
- Line 17-18: `variant === "list"` ho to 5 lambe grey boxes (Pull Requests page jaisa).
- Line 19: `variant === "table"` ho to:
- Line 20: `<>`: fragment shuru.
- Line 21: search box jaisa ek chhota box.
- Line 22-24: 8 table rows jaise boxes.
- Line 25: `</>`: fragment band.
- Line 26: `)}`: table wala hissa band.
- Line 27: `variant === "card"` ho to ek bada card jaisa box (GitHub, Settings, PR detail ke liye).
- Line 28: `</div>`: body band.
- Line 29: `</>`: fragment band.
- Line 30: `);`: return band.
- Line 31: `}`: function band.

### `app/(protected)/dashboard/repos/loading.tsx`

**Pehle (Before):** file exist nahi karti thi.

**Baad mein (After):** lines 1–5

```tsx
import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="Repositories" description="All public and private repositories available to the GitHub App." variant="table" />;
}
```

**Har line ka matlab:**

- Line 1: `import { PageSkeleton } ...`: upar wala common skeleton component laaya.
- Line 2: khali line.
- Line 3: `export default function Loading()`: Next.js is file ka default export loading screen ki tarah use karta hai.
- Line 4: `return <PageSkeleton ... variant="table" />`: Repositories page table hai, isliye `table` variant. Title aur description asli page se copy kiye.
- Line 5: `}`: function band.

### `app/(protected)/dashboard/pull-request/loading.tsx`

**Pehle (Before):** file exist nahi karti thi.

**Baad mein (After):** lines 1–5

```tsx
import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="Pull Requests" description="Pull requests reviewed by the AI, with the review for each one." variant="list" />;
}
```

**Har line ka matlab:**

- Line 1: common skeleton import.
- Line 2: khali line.
- Line 3: Next.js ka loading component.
- Line 4: Pull Requests page cards ki list hai, isliye `list` variant.
- Line 5: function band.

### `app/(protected)/dashboard/pull-request/[id]/loading.tsx`

**Pehle (Before):** file exist nahi karti thi.

**Baad mein (After):** lines 1–5

```tsx
import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="Pull Request" description="Loading the AI review…" variant="card" />;
}
```

**Har line ka matlab:**

- Line 1: common skeleton import.
- Line 2: khali line.
- Line 3: Next.js ka loading component.
- Line 4: PR ka asli title abhi pata nahi hota, isliye general title "Pull Request". Detail page ek bada card hai, isliye `card` variant. Yeh file isliye alag hai taaki detail page pe list wala skeleton na dikhe.
- Line 5: function band.

### `app/(protected)/dashboard/github/loading.tsx`

**Pehle (Before):** file exist nahi karti thi.

**Baad mein (After):** lines 1–5

```tsx
import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="GitHub App" description="Install or disconnect the reviewer app on your GitHub account." variant="card" />;
}
```

**Har line ka matlab:**

- Line 1: common skeleton import.
- Line 2: khali line.
- Line 3: Next.js ka loading component.
- Line 4: GitHub App page ek card hai, isliye `card` variant. Title aur description asli page se.
- Line 5: function band.

### `app/(protected)/dashboard/settings/loading.tsx`

**Pehle (Before):** file exist nahi karti thi.

**Baad mein (After):** lines 1–5

```tsx
import { PageSkeleton } from "@/features/dashboard/components/page-skeleton";

export default function Loading() {
  return <PageSkeleton title="Settings" description="Manage your profile and subscription." variant="card" />;
}
```

**Har line ka matlab:**

- Line 1: common skeleton import.
- Line 2: khali line.
- Line 3: Next.js ka loading component.
- Line 4: Settings page cards/tabs wala hai, isliye `card` variant.
- Line 5: function band.

## Iska fayda

- Sidebar click ke **turant baad** (lagbhag 0 ms) naya header aur loading boxes dikhte hain, freeze nahi lagta.
- `<Link>` ab har page ka loading hissa pehle se prefetch karta hai, isliye navigation instant feel hota hai.
- Total load time is change se kam nahi hota, lekin user ko wait "dikhta" hai, aur yeh baaki fixes ke saath milke kaam karta hai.

## Kaise test karein

1. `npm run build && npm run start` chalao (dev mode mein compile time bhi judta hai, isliye production mode better hai).
2. Login karke dashboard kholo.
3. Sidebar mein Repositories, Pull Requests, GitHub App, Settings pe click karo. Click ke turant baad grey loading boxes dikhne chahiye, phir asli page.
4. Pull Requests list se kisi PR pe jaao (Overview ki activity se). Card wala skeleton dikhna chahiye.

## Rollback kaise karein

- Is change ka commit revert karo: `git revert <commit-hash>` (commit message: "perf: add loading states for dashboard routes").
- Ya yeh 6 files delete kar do. Koi aur file inhe use nahi karti.
