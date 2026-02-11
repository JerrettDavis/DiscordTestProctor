import { ArrowRight, Bot, ClipboardCheck, KeyRound, Link, ShieldCheck, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GuildSyncStatus } from "@/types/guild-sync"
import { GuildDto } from "@/web-api-client"

type SetupPageProps = {
  onNavigate: (path: string) => void
  guilds: GuildDto[]
  guildSyncStatus?: GuildSyncStatus | null
  guildSyncLoaded?: boolean
  guildSyncBusy?: boolean
  onRunGuildSync?: () => void
}

export function SetupPage({
  onNavigate,
  guilds,
  guildSyncStatus,
  guildSyncLoaded = false,
  guildSyncBusy = false,
  onRunGuildSync,
}: SetupPageProps) {
  const hasGuilds = guilds.length > 0 || (guildSyncStatus?.lastGuildCount ?? 0) > 0

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Bot Setup</p>
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">
          Wire the Discord bot and OAuth flow
        </h1>
        <p className="text-sm text-muted-foreground">
          Confirm credentials, invite the bot, and ensure your admin account is whitelisted.
        </p>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Guided wizard</p>
            <h2 className="text-lg font-semibold">Launch checklist</h2>
          </div>
          <Sparkles className="size-5 text-primary" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-start gap-3">
              <Bot className="mt-1 size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">1. Invite the bot</p>
                <p className="text-xs text-muted-foreground">
                  Add the bot to the server and grant Manage Roles.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <a
                    href="https://discord.com/oauth2/authorize?client_id=1359732245958496276&scope=bot%20applications.commands&permissions=8"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open invite <ArrowRight className="ml-1 size-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-1 size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">2. Run onboarding sync</p>
                <p className="text-xs text-muted-foreground">
                  Pull guilds and roles into the dashboard.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={onRunGuildSync}
                    disabled={guildSyncBusy || !onRunGuildSync}
                  >
                    {guildSyncBusy ? "Syncing..." : "Run sync"}
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {guildSyncLoaded
                      ? `${guildSyncStatus?.lastGuildCount ?? 0} guilds detected`
                      : "Sync status pending"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">3. Confirm admin access</p>
                <p className="text-xs text-muted-foreground">
                  Ensure your Discord ID is whitelisted in <code>Discord:AdminIds</code>.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => onNavigate("guilds")}
                >
                  Review guilds
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-background/70 p-4">
            <div className="flex items-start gap-3">
              <ClipboardCheck className="mt-1 size-4 text-primary" />
              <div>
                <p className="text-sm font-semibold">4. Create certifications</p>
                <p className="text-xs text-muted-foreground">
                  Build exams and link the role to award on passing.
                </p>
                <Button size="sm" className="mt-3" onClick={() => onNavigate("certifications")}>
                  Build certifications
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          {hasGuilds
            ? "Guilds detected. Continue with certifications and questions."
            : "No guilds detected yet. Invite the bot and rerun sync."}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
          <Bot className="size-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Invite the bot</h2>
          <p className="text-sm text-muted-foreground">
            Use the bot invite link to add it to your guild with the proper permissions.
          </p>
          <Button asChild className="mt-4">
            <a
              href="https://discord.com/oauth2/authorize?client_id=1359732245958496276&scope=bot%20applications.commands&permissions=8"
              target="_blank"
              rel="noreferrer"
            >
              Open invite
            </a>
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
          <KeyRound className="size-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Verify OAuth settings</h2>
          <p className="text-sm text-muted-foreground">
            Confirm your redirect URLs include the app host and Vite host (for local dev).
          </p>
          <div className="mt-4 rounded-xl border border-border/60 bg-background/70 p-4 text-xs text-muted-foreground">
            https://localhost:5001/signin-discord<br />
            https://localhost:44447/signin-discord
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
          <ShieldCheck className="size-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Admin access</h2>
          <p className="text-sm text-muted-foreground">
            Ensure your Discord ID is listed in <code>Discord:AdminIds</code>. This unlocks
            certification management endpoints.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => onNavigate("guilds")}
          >
            Manage guilds
          </Button>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
          <Link className="size-5 text-primary" />
          <h2 className="mt-3 text-lg font-semibold">Next steps</h2>
          <p className="text-sm text-muted-foreground">
            After setup, create certifications and questions, then run <strong>/get-certificates</strong>
            inside Discord.
          </p>
          <Button variant="secondary" className="mt-4" onClick={() => onNavigate("certifications")}>
            Build certifications
          </Button>
        </div>
      </section>
    </div>
  )
}
