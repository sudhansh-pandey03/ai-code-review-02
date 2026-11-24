# 06: `.env.example` aur pooled DATABASE_URL ka note

## Problem kya tha

Project mein `.env.example` file hi nahi thi, isliye koi naya developer (ya Vercel setup karte waqt aap khud) nahi jaan sakta tha ki kaunse environment variables chahiye, aur ki DB ke liye **pooled** connection string use karni hai. Galat (non-pooled) URL serverless pe har request pe naya DB connection banata hai, jo slow hai aur "too many connections" error de sakta hai.

Prisma client (`lib/db.ts`) maine check kiya. Woh already sahi singleton hai, usme koi change nahi kiya.

## Kya change kiya

- `.env.example` banaya. Isme **sirf variable ke naam** hain, koi asli secret nahi. DB wale variable ke upar comment hai ki pooled URL (`-pooler`) use karo aur Vercel region DB ke paas rakho.
- `.gitignore` mein `.env*` rule saari env files ignore karta tha, `.env.example` bhi. Ek line `!.env.example` add ki, taaki sirf example file commit ho sake. Asli `.env` abhi bhi ignore hai (maine check kiya).

## Files changed

- `.env.example`: new
- `.gitignore`: modified

## Code changes (line by line)

### `.env.example`

**Pehle (Before):** file exist nahi karti thi.

**Baad mein (After):** lines 1–42

```bash
# Copy this file to .env and fill in the values. Never commit the real .env.

# --- Database (Neon Postgres) ---
# Use the POOLED connection string (host contains "-pooler") in production.
# Serverless functions open many short connections; the pooler (PgBouncer)
# shares a few real connections between them, which is faster and avoids
# "too many connections" errors.
# Also run your Vercel functions in the region closest to this database.
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require"

# --- Better Auth ---
BETTER_AUTH_SECRET=""
BETTER_AUTH_URL="http://localhost:3000"

# --- GitHub OAuth (sign in) ---
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""

# --- GitHub App (reviews) ---
GITHUB_APP_ID=""
GITHUB_APP_NAME=""
GITHUB_APP_PRIVATE_KEY=""
GITHUB_WEBHOOK_SECRET=""

# --- Inngest ---
INNGEST_DEV=1
INNGEST_EVENT_KEY=""

# --- Pinecone ---
PINECONE_API_KEY=""
PINECONE_INDEX=""
PINECONE_HOST=""

# --- OpenRouter (AI model) ---
OPENROUTER_API_KEY=""

# --- Razorpay (billing) ---
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_PLAN_ID=""
RAZORPAY_WEBHOOK_SECRET=""
NEXT_PUBLIC_RAZORPAY_KEY_ID=""
```

**Har line ka matlab:**

- Line 1: is file ko `.env` mein copy karke values bharo, aur asli `.env` kabhi commit mat karo.
- Line 2: khali line.
- Line 3: Database section ka heading.
- Line 4: production mein **pooled** connection string use karo (host mein `-pooler` hota hai).
- Line 5-7: kyun? Serverless functions bahut saare chhote connections kholte hain. Pooler (PgBouncer) kuch asli connections ko sabke beech share karta hai, jo tez hai aur "too many connections" error se bachata hai.
- Line 8: Vercel functions ko DB ke sabse paas wale region mein chalao.
- Line 9: `DATABASE_URL=...`: example format. `USER`, `PASSWORD`, `REGION`, `DB` apni values se badlo. `sslmode=require` Neon ke liye zaroori hai.
- Line 10: khali line.
- Line 11: Better Auth section.
- Line 12: `BETTER_AUTH_SECRET`: session cookies sign karne ki secret key (lambi random string).
- Line 13: `BETTER_AUTH_URL`: app ka public URL (local pe localhost, Vercel pe aapka domain).
- Line 14: khali line.
- Line 15: GitHub login (OAuth) section.
- Line 16-17: GitHub OAuth/App ka client ID aur client secret.
- Line 18: khali line.
- Line 19: GitHub App (PR reviews) section.
- Line 20: `GITHUB_APP_ID`: GitHub App ka number ID.
- Line 21: `GITHUB_APP_NAME`: GitHub App ka naam.
- Line 22: `GITHUB_APP_PRIVATE_KEY`: App ki private key (PEM), jisse installation tokens bante hain.
- Line 23: `GITHUB_WEBHOOK_SECRET`: webhook requests verify karne ka secret.
- Line 24: khali line.
- Line 25: Inngest section.
- Line 26: `INNGEST_DEV=1`: local pe Inngest dev server use karo (production mein hata do).
- Line 27: `INNGEST_EVENT_KEY`: production Inngest ki event key.
- Line 28: khali line.
- Line 29: Pinecone (vector DB) section.
- Line 30-32: Pinecone ki API key, index ka naam, aur host URL.
- Line 33: khali line.
- Line 34: OpenRouter section.
- Line 35: `OPENROUTER_API_KEY`: AI model ki API key.
- Line 36: khali line.
- Line 37: Razorpay (billing) section.
- Line 38-39: Razorpay ki key ID aur secret (server pe).
- Line 40: `RAZORPAY_PLAN_ID`: Pro plan ka ID.
- Line 41: `RAZORPAY_WEBHOOK_SECRET`: Razorpay webhook verify karne ka secret.
- Line 42: `NEXT_PUBLIC_RAZORPAY_KEY_ID`: browser mein checkout kholne ke liye public key (`NEXT_PUBLIC_` wale variables browser tak jaate hain, isliye isme sirf public key daalo).

### `.gitignore`

**Pehle (Before):** lines 33–34

```gitignore
# env files (can opt-in for committing if needed)
.env*
```

**Baad mein (After):** lines 33–35

```gitignore
# env files (can opt-in for committing if needed)
.env*
!.env.example
```

**Har line ka matlab:**

- Line 33: pehle jaisa comment.
- Line 34: `.env*`: pehle jaisa, `.env`, `.env.local` waghera sab ignore.
- Line 35: `!.env.example`: **naya.** `!` ka matlab "is rule ka exception". Sirf `.env.example` commit ho sakti hai, kyunki usme koi secret nahi hai.

## Iska fayda

- Seedha speed nahi badhti, lekin yeh **galat setup se bachata hai**. Agar Vercel pe galti se non-pooled URL laga ho, to har request pe naya connection banta hai (100-300 ms extra) aur load pe errors aate hain.
- Naye developer ko pata chal jaata hai ki kaunse variables chahiye.

## Kaise test karein

1. `git check-ignore -v .env.example` chalao. Output mein `!.env.example` rule dikhna chahiye (matlab ignore **nahi** hai).
2. `git check-ignore .env` chalao. `.env` print hona chahiye (matlab asli file abhi bhi ignore hai).
3. `.env.example` khol ke dekho ki koi asli secret nahi hai.

## Rollback kaise karein

- Is change ka commit revert karo: `git revert <commit-hash>` (commit message: "docs: add .env.example with pooled database note").
- Ya `.env.example` delete karo aur `.gitignore` se `!.env.example` line hatao.
