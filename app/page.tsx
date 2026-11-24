import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRightIcon,
  BrainIcon,
  ChatCircleTextIcon,
  GitPullRequestIcon,
  GithubLogoIcon,
  LightningIcon,
  ListChecksIcon,
  ShieldCheckIcon,
} from "@phosphor-icons/react/dist/ssr";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { getServerSession } from "@/features/auth/actions";
import { DASHBOARD_ROUTES } from "@/features/dashboard/lib/routes";
import { PLAN_DETAILS } from "@/features/settings/lib/plan-details";
import { SIGN_IN_PATH } from "@/features/auth/utils";

export const metadata: Metadata = {
  title: "Chai AI Code Reviewer · AI reviews for every pull request",
  description:
    "Install the GitHub App and get an AI code review on every pull request: bugs, security issues and clear fixes, posted as a PR comment.",
};

const STEPS = [
  {
    icon: GithubLogoIcon,
    title: "Install the GitHub App",
    text: "Sign in with GitHub and choose the repositories you want reviewed.",
  },
  {
    icon: GitPullRequestIcon,
    title: "Open a pull request",
    text: "Every new PR or new commit on a PR is picked up automatically.",
  },
  {
    icon: ChatCircleTextIcon,
    title: "Get your review",
    text: "The AI posts a review on the PR, and you can read every review in your dashboard.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheckIcon,
    title: "Finds real problems",
    text: "Bugs, security holes, unhandled errors and slow code, ranked by how much they matter.",
  },
  {
    icon: BrainIcon,
    title: "Knows your codebase",
    text: "Sync a repository and reviews use related code from it, not just the diff.",
  },
  {
    icon: ListChecksIcon,
    title: "Clear, actionable fixes",
    text: "Each issue says what is wrong, why it matters and how to fix it. No filler.",
  },
  {
    icon: LightningIcon,
    title: "Fully automatic",
    text: "No commands to run. Reviews arrive on the PR within a couple of minutes.",
  },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2" aria-label="Chai AI Code Reviewer home">
      <Image
        src="/logo2.svg"
        alt=""
        width={48}
        height={32}
        priority
      />
      <span className="text-sm font-semibold tracking-tight">Chai AI Code Reviewer</span>
    </Link>
  );
}

function PrimaryCta({ signedIn, size = "lg" }: { signedIn: boolean; size?: "lg" | "default" }) {
  if (signedIn) {
    return (
      <Button size={size} nativeButton={false} render={<Link href={DASHBOARD_ROUTES.overview} />}>
        Go to dashboard
        <ArrowRightIcon data-icon="inline-end" />
      </Button>
    );
  }

  return (
    <Button size={size} nativeButton={false} render={<Link href={SIGN_IN_PATH} />}>
      <GithubLogoIcon data-icon="inline-start" />
      Sign in with GitHub
    </Button>
  );
}

/** A static example of what a review comment looks like. */
function ReviewPreview() {
  return (
    <div className="w-full rounded-lg bg-card text-left text-xs ring-1 ring-foreground/10 shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <GitPullRequestIcon className="size-4 text-green-600 dark:text-green-400" />
        <span className="truncate font-medium">Add user search endpoint</span>
        <span className="ml-auto shrink-0 text-muted-foreground">#42</span>
      </div>
      <div className="space-y-3 px-4 py-4 leading-relaxed">
        <p>
          <span className="font-semibold">Summary:</span> Adds a search API for users. One security issue
          should be fixed before merging.
        </p>
        <div>
          <p className="mb-1 font-semibold">🚨 Issues</p>
          <p>
            <code className="rounded bg-muted px-1 py-0.5 font-mono">api/users/search.ts</code>
            <span className="font-medium"> — SQL injection:</span> the <code className="rounded bg-muted px-1 py-0.5 font-mono">q</code>{" "}
            param is put straight into the query. Use a parameterized query instead.
          </p>
        </div>
        <div>
          <p className="mb-1 font-semibold">⚠️ Suggestions</p>
          <p>Add a limit to the results so large tables don&apos;t load every row.</p>
        </div>
      </div>
      <p className="border-t border-border px-4 py-2 text-[0.625rem] text-muted-foreground">
        Example review
      </p>
    </div>
  );
}

export default async function Home() {
  const session = await getServerSession();
  const signedIn = Boolean(session);

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Logo />
          <nav className="flex items-center gap-2">
            <a href="#how-it-works" className="hidden px-2 text-xs text-muted-foreground hover:text-foreground sm:inline">
              How it works
            </a>
            <a href="#pricing" className="hidden px-2 text-xs text-muted-foreground hover:text-foreground sm:inline">
              Pricing
            </a>
            <ModeToggle />
            <PrimaryCta signedIn={signedIn} size="default" />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col items-start gap-6">
            <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
              AI code review for GitHub
            </span>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
              A careful code review on every pull request.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
              Install the GitHub App and an AI reviewer reads each PR, finds bugs and security problems,
              and explains how to fix them, right in the PR comments.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <PrimaryCta signedIn={signedIn} />
              <Button size="lg" variant="outline" nativeButton={false} render={<a href="#how-it-works" />}>
                See how it works
              </Button>
            </div>
          </div>
          <ReviewPreview />
        </section>

        {/* How it works */}
        <section id="how-it-works" className="scroll-mt-14 border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-16">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">How it works</h2>
            <p className="mt-2 text-sm text-muted-foreground">Set up once in about a minute.</p>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="rounded-lg bg-card p-5 ring-1 ring-foreground/10">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <step.icon className="size-4" />
                    </span>
                    <span className="text-xs text-muted-foreground">Step {index + 1}</span>
                  </div>
                  <h3 className="mt-4 text-sm font-medium">{step.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-16">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Reviews that are worth reading</h2>
            <div className="mt-8 grid gap-x-8 gap-y-8 sm:grid-cols-2">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <feature.icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-medium">{feature.title}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-14 border-t border-border bg-muted/30">
          <div className="mx-auto w-full max-w-6xl px-4 py-16">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Pricing</h2>
            <p className="mt-2 text-sm text-muted-foreground">Start free. Upgrade from Settings when you need more.</p>
            <div className="mt-8 grid max-w-3xl gap-4 md:grid-cols-2">
              {(["free", "pro"] as const).map((plan) => (
                <div
                  key={plan}
                  className={
                    plan === "pro"
                      ? "rounded-lg bg-card p-6 ring-2 ring-primary"
                      : "rounded-lg bg-card p-6 ring-1 ring-foreground/10"
                  }
                >
                  <h3 className="text-sm font-semibold">{PLAN_DETAILS[plan].label}</h3>
                  <ul className="mt-4 space-y-2">
                    {PLAN_DETAILS[plan].features.map((item) => (
                      <li key={item} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-primary">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="border-t border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center">
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Ready for your next pull request?</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Connect GitHub and your next PR gets reviewed automatically.
            </p>
            <PrimaryCta signedIn={signedIn} />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Chai AI Code Reviewer</span>
          <span>Reviews powered by AI. Always double-check before merging.</span>
        </div>
      </footer>
    </div>
  );
}
