import { BookOpenCheck, Bot, ClipboardList, LifeBuoy, ShieldCheck, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"

type HelpPageProps = {
  onNavigate: (path: string) => void
}

export function HelpPage({ onNavigate }: HelpPageProps) {
  const scrollToSection = (id: string) => {
    const target = document.getElementById(id)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Help & Docs</p>
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">
            Run proctored exams with confidence
          </h1>
          <p className="text-sm text-muted-foreground">
            A quick guide to inviting the bot, building certifications, and running exams inside
            your Discord server.
          </p>
        </div>
        <Button variant="outline" onClick={() => onNavigate("setup")}>
          Open setup wizard
        </Button>
      </div>

      <section className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Quick links
          </h2>
          <div className="mt-4 grid gap-2 text-sm">
            <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => scrollToSection("getting-started")}
            >
              Getting started
            </button>
            <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => scrollToSection("certifications")}
            >
              Build certifications
            </button>
            <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => scrollToSection("exams")}
            >
              Run exams in Discord
            </button>
            <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => scrollToSection("roles")}
            >
              Role & permissions
            </button>
            <button
              type="button"
              className="text-left text-primary hover:underline"
              onClick={() => scrollToSection("troubleshooting")}
            >
              Troubleshooting
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div
            id="getting-started"
            className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Bot className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Getting started</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Invite the bot to your server with the administrator permission scope.</li>
              <li>Sign in to the dashboard with Discord to manage certifications.</li>
              <li>Wait for auto onboarding (runs every minute) or run sync manually.</li>
            </ul>
            <Button variant="secondary" className="mt-4" onClick={() => onNavigate("overview")}>
              Go to overview
            </Button>
          </div>

          <div
            id="certifications"
            className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Build certifications</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Choose a template to speed up creation or build from scratch.</li>
              <li>Set a passing score and link the certification to a Discord role.</li>
              <li>Add 2–5 answers per question and mark a single correct option.</li>
            </ul>
            <Button className="mt-4" onClick={() => onNavigate("certifications")}>
              Open certifications
            </Button>
          </div>

          <div id="exams" className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <BookOpenCheck className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Run exams in Discord</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Members run <strong>/get-certificates</strong> inside your server.</li>
              <li>The bot presents available certifications and starts the exam.</li>
              <li>On passing, the assigned role is automatically granted.</li>
            </ul>
          </div>

          <div id="roles" className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Role & permissions</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Ensure the bot has the <strong>Manage Roles</strong> permission.</li>
              <li>The role to award must sit below the bot’s highest role.</li>
              <li>Admins are whitelisted in <code>Discord:AdminIds</code>.</li>
            </ul>
          </div>

          <div
            id="troubleshooting"
            className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm"
          >
            <div className="flex items-center gap-2">
              <LifeBuoy className="size-5 text-primary" />
              <h2 className="text-lg font-semibold">Troubleshooting</h2>
            </div>
            <ul className="mt-4 list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>If a guild isn’t showing, run sync in the Overview page.</li>
              <li>If roles don’t appear, confirm the bot role permissions in Discord.</li>
              <li>Use the setup wizard for OAuth + admin configuration checks.</li>
            </ul>
            <Button variant="outline" className="mt-4" onClick={() => onNavigate("setup")}>
              Open setup wizard
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          <h2 className="text-lg font-semibold">Need more help?</h2>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Share logs from the Overview sync panel and we can diagnose onboarding, role, or
          certification issues quickly.
        </p>
      </section>
    </div>
  )
}
