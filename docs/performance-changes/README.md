# Performance Changes: Suddh-AI-Review

## Problem kya tha

Vercel pe deployed app mein sidebar ka koi bhi link click karo to naya page khulne mein bahut time lagta tha. Click ke baad screen pe kuch nahi badalta tha, jab tak server poora page bana ke na bhej de.

Investigation mein yeh main reasons mile (details [00-investigation.md](00-investigation.md) mein):

1. **Database door hai:** Neon database Singapore (`ap-southeast-1`) mein hai. Agar Vercel functions default region (US East, `iad1`) mein chal rahe hain, to har ek DB query ko Pacific ke paar jaana padta hai.
2. **Ek click pe bahut saari DB queries:** har click pe session 4 baar check hota hai (proxy + 2 layouts + page), aur kai queries ek ke baad ek (sequential) chalti hain.
3. **Loading screen nahi hai:** sirf Overview page ka `loading.tsx` hai. Baaki pages pe click ke baad kuch nahi dikhta, aur Next.js unhe pehle se prefetch bhi nahi kar pata.
4. **GitHub API har baar call hoti hai:** Overview page har load pe GitHub se repos laata hai, bina cache ke.

## Fixes

_Step 2 ke baad yahan har fix ki list aayegi._

## Index

- [00 - Investigation](00-investigation.md)

## Summary table

_Saare changes ke baad yahan table aayegi._
