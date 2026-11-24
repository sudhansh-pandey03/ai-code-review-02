# 07: Pull Requests list ko server component banaya (markdown server pe)

## Problem kya tha

`features/reviews/components/pull-request-list.tsx` ke upar `"use client"` tha. Isliye uske saare imports, including `react-markdown` aur `remark-gfm` (AI review ka markdown dikhane wali libraries), browser mein download hote the. Build check karne pe yeh **168 KB ka JavaScript chunk** nikla, jo Pull Requests page kholte hi download, parse aur run hota tha.

## Kya change kiya

Maine check kiya ki is file ko client hone ki zarurat kyun thi. Isme koi `useState`, `useEffect` ya `onClick` nahi hai. Expand/collapse ka kaam `Collapsible` karta hai, jo khud ek client component hai (`components/ui/collapsible.tsx` mein `"use client"` hai).

Next.js mein ek **server component** client component ko render kar sakta hai aur usko server pe bane children de sakta hai. Isliye:

- `"use client"` hata diya. Ab yeh file server pe chalti hai, aur markdown server pe hi HTML ban jaata hai.
- Browser ko sirf tayyar HTML aur chhota `Collapsible` code milta hai. `react-markdown` browser tak jaata hi nahi.
- Phosphor icons ka import `@phosphor-icons/react` se `@phosphor-icons/react/dist/ssr` kiya, kyunki server components ke liye Phosphor yahi path batata hai (baaki server files jaise landing page aur overview bhi yahi use karti hain).

## Files changed

- `features/reviews/components/pull-request-list.tsx`: modified

## Code changes (line by line)

### `features/reviews/components/pull-request-list.tsx`

**Pehle (Before):** lines 1–8

```tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import {
    ArrowSquareOutIcon,
    CaretDownIcon,
    GitPullRequestIcon,
} from "@phosphor-icons/react";
```

**Baad mein (After):** lines 1–8

```tsx
// Server component: the markdown is rendered on the server, so react-markdown
// never ships to the browser. Collapsible is a client component and still works.
import { formatDistanceToNow } from "date-fns";
import {
    ArrowSquareOutIcon,
    CaretDownIcon,
    GitPullRequestIcon,
} from "@phosphor-icons/react/dist/ssr";
```

**Har line ka matlab:**

- Line 1: **badla.** Pehle `"use client";` tha, jo poori file aur uske imports ko browser bundle mein daalta tha. Ab uski jagah ek comment hai, jo batata hai ki yeh server component hai aur kyun.
- Line 2: **badla.** Pehle khali line thi. Ab comment ka doosra hissa, jo batata hai ki `Collapsible` client component hai aur expand/collapse abhi bhi chalega.
- Line 3: `import { formatDistanceToNow } from "date-fns";`: pehle jaisa. "2 hours ago" jaisa time ab server pe banta hai.
- Line 4-7: wahi teen icons, pehle jaise.
- Line 8: `} from "@phosphor-icons/react/dist/ssr";`: **badla.** Pehle `"@phosphor-icons/react"` tha. `/dist/ssr` wala version server components mein kaam karta hai (React context ke bina).

Baaki file (lines 9 ke baad) mein koi change nahi.

## Iska fayda

- Pull Requests page pe browser ko **lagbhag 168 KB (uncompressed) JavaScript kam** download/parse karna padta hai. Build ke baad poore app ka client JS **1.9 MB se 1.7 MB** hua.
- Page jaldi interactive hota hai, khaaskar slow phone ya slow internet pe.
- Review ka markdown server se tayyar HTML aata hai, to page load hote hi dikh jaata hai.

## Kaise test karein

1. `npm run build` pass hona chahiye.
2. Check karo ki markdown library browser bundle mein nahi hai: `grep -l "micromark" .next/static/chunks/*.js`. Kuch bhi print nahi hona chahiye.
3. `npm run start` karke Pull Requests page kholo. Kisi PR card pe click karo. Card khulna chahiye aur AI review sahi format (headings, lists, code) mein dikhna chahiye.
4. GitHub link (↗ icon) kaam karna chahiye.

## Rollback kaise karein

- Is change ka commit revert karo: `git revert <commit-hash>` (commit message: "perf: render pull request reviews on the server").
- Ya manually: line 1 pe wapas `"use client";` likho, comment hatao, aur import ko wapas `"@phosphor-icons/react"` kar do.
