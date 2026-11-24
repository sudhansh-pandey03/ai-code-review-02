# 08: Vercel functions ko database ke paas (Singapore) chalana

## Problem kya tha

Neon database **Singapore** (`ap-southeast-1`) mein hai. Repo mein `vercel.json` nahi tha, aur region set na ho to Vercel functions apne default region (aam taur pe US East, Washington D.C., `iad1`) mein chalte hain. Matlab har DB query US se Singapore jaati aur wapas aati, aur har round trip mein lagbhag 200 ms ya usse zyada lagte.

Ek dashboard click pe kai DB queries hoti hain, isliye yeh sabse bada reason tha.

## Kya change kiya

Project ke root mein `vercel.json` banaya, jisme `"regions": ["sin1"]` hai. `sin1` Vercel ka Singapore region hai, jo Neon ke `ap-southeast-1` ke saath same city mein hai. Ab functions DB ke bilkul paas chalenge, aur har query ka round trip lagbhag 200 ms se ghat ke kuch milliseconds reh jayega.

**Dhyan dein:**
- `vercel.json` ki setting Vercel dashboard wali region setting ko override karti hai.
- Agar aapke zyada users India mein hain, to Singapore unke liye bhi paas hai.
- Hobby (free) plan pe ek region choose kar sakte hain, isliye ek hi region diya hai.

## Files changed

- `vercel.json`: new

## Code changes (line by line)

### `vercel.json`

**Pehle (Before):** file exist nahi karti thi.

**Baad mein (After):** lines 1–4

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["sin1"]
}
```

**Har line ka matlab:**

- Line 1: `{`: JSON object shuru.
- Line 2: `"$schema": ...`: editor (VS Code) ko batata hai ki yeh Vercel config hai, taaki autocomplete aur galti pe warning mile. Deploy pe iska koi asar nahi.
- Line 3: `"regions": ["sin1"]`: saare serverless functions (pages, API routes, Inngest route) Singapore mein chalao, database ke paas.
- Line 4: `}`: object band.

## Iska fayda

- **Sabse bada fayda yahi hai.** Agar functions pehle US mein chal rahe the, to har DB query pe lagbhag 200+ ms bachenge. Ek click pe kai queries hoti hain, isliye ek click mein **1-2 second tak** bach sakte hain.
- Pichle changes (02, 03, 05) ne queries ki ginti kam ki. Yeh change har bachi hui query ko tez karta hai.

## Kaise test karein

1. Is branch ko Vercel pe deploy karo (push karne pe preview deployment banega).
2. Vercel → Project → Deployments → naya deployment → **Functions** tab. Region **sin1** dikhna chahiye. Ya Settings → Functions mein dekho.
3. Dashboard kholo aur sidebar clicks try karo. Pehle se kaafi tez lagna chahiye.
4. Browser DevTools → Network mein kisi page request ka response header `x-vercel-id` dekho. Usme `sin1` hona chahiye (jaise `bom1::sin1::...`).

## Rollback kaise karein

- Is change ka commit revert karo: `git revert <commit-hash>` (commit message: "perf: run Vercel functions in Singapore next to the database").
- Ya `vercel.json` delete kar do. Vercel wapas dashboard wali (ya default) region use karega.
