import { ArrowUpRight, Bot, ClipboardList, ShieldCheck, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { GuildSyncStatus } from "@/types/guild-sync"
import { CertificationsClient, CertificationSummaryDto, GuildDto } from "@/web-api-client"

type OverviewPageProps = {
  client: CertificationsClient
  guilds: GuildDto[]
  activeGuildId?: string | null
  guildSyncStatus?: GuildSyncStatus | null
  guildSyncLoaded?: boolean
  guildSyncBusy?: boolean
  onRunGuildSync?: () => void
  onNavigate: (path: string) => void
}

export function OverviewPage({
  client,
  guilds,
  activeGuildId,
  guildSyncStatus,
  guildSyncLoaded = false,
  guildSyncBusy = false,
  onRunGuildSync,
  onNavigate,
}: OverviewPageProps) {
  const [certifications, setCertifications] = useState<CertificationSummaryDto[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const activeGuild = useMemo(
    () => guilds.find((guild) => guild.discordGuildId === activeGuildId),
    [guilds, activeGuildId]
  )

  useEffect(() => {
    if (!activeGuildId) {
      setCertifications([])
      return
    }
    setIsLoading(true)
    client
      .getApiCertificationsGuildsCertifications(activeGuildId)
      .then((data) => setCertifications(data ?? []))
      .catch(() => setCertifications([]))
      .finally(() => setIsLoading(false))
  }, [activeGuildId, client])

  const liveCertifications = useMemo(
    () => certifications.filter((cert) => !cert.isTemplate),
    [certifications]
  )

  const stats = [
    {
      label: "Guilds connected",
      value: guilds.length,
      helper: guilds.length === 1 ? "1 active workspace" : "Across your servers",
    },
    {
      label: "Certifications",
      value: liveCertifications.length,
      helper: activeGuild ? `In ${activeGuild.name}` : "Select a guild to view",
    },
    {
      label: "Passing score",
      value:
        liveCertifications.length > 0
          ? `${Math.round(
              liveCertifications.reduce((sum, cert) => sum + (cert.passingScorePercent ?? 0), 0) /
                liveCertifications.length
            )}%`
          : "—",
      helper: "Average threshold",
    },
  ]

  const formatTimestamp = (value?: string | null) => {
    if (!value) return "—"
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    return date.toLocaleString()
  }

  const formatDuration = (value?: number | null) => {
    if (value == null) return "—"
    if (value < 1000) return `${Math.round(value)} ms`
    return `${(value / 1000).toFixed(1)} s`
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/70 p-8 shadow-sm">
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(44,122,123,0.18),transparent_70%)] blur-2xl" />
        <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(234,179,8,0.18),transparent_70%)] blur-2xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Janus Proctor Console
            </p>
            <h1 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl lg:text-5xl font-[var(--font-display)]">
              Shape certification journeys with clarity, speed, and accountability.
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Build certifications, launch Discord exams, and award roles in a single flow. Every
              action below is wired to your live API.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onNavigate("certifications")} className="h-11 px-5">
              Create certification
              <ArrowUpRight />
            </Button>
            <Button
              variant="outline"
              className="h-11 px-5"
              onClick={() => onNavigate("guilds")}
            >
              Manage guilds
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent certifications</h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onNavigate("certifications")}
            >
              View all
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!isLoading && liveCertifications.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No certifications yet. Create one to start building exams.
              </div>
            )}
            {liveCertifications.slice(0, 3).map((cert) => (
              <div
                key={cert.id}
                className="flex items-start justify-between rounded-xl border border-border/60 bg-background/70 p-4"
              >
                <div>
                  <p className="font-medium">{cert.name}</p>
                  <p className="text-xs text-muted-foreground">{cert.description}</p>
                </div>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-xs">
                  {cert.passingScorePercent}% pass
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Launch checklist</h2>
            <div className="mt-4 space-y-4 text-sm text-muted-foreground">
              <div className="flex items-start gap-3">
                <Bot className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Invite the bot</p>
                  <p>Ensure the bot is in the guild and has Manage Roles permissions.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ClipboardList className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Create certifications</p>
                  <p>Assign the role to award and the passing score threshold.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Add questions</p>
                  <p>Draft questions with 2–5 answers and pick one correct answer.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Run /get-certificates</p>
                  <p>Members can start exams and earn roles immediately.</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button variant="outline" className="w-full" onClick={() => onNavigate("setup")}>
                View setup guide
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Auto onboarding</h2>
              <span className="text-xs text-muted-foreground">
                Every {guildSyncStatus?.intervalSeconds ?? "—"}s
              </span>
            </div>
            {!guildSyncLoaded && (
              <p className="mt-4 text-sm text-muted-foreground">Loading sync status…</p>
            )}
            {guildSyncLoaded && !guildSyncStatus && (
              <p className="mt-4 text-sm text-muted-foreground">
                Status unavailable. Refresh or check the worker logs.
              </p>
            )}
            {guildSyncStatus && (
              <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Last run</span>
                  <span className="text-foreground">{formatTimestamp(guildSyncStatus.lastRun)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last success</span>
                  <span className="text-foreground">
                    {formatTimestamp(guildSyncStatus.lastSuccess)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Guilds synced</span>
                  <span className="text-foreground">{guildSyncStatus.lastGuildCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Roles synced</span>
                  <span className="text-foreground">{guildSyncStatus.lastRoleCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Templates ready</span>
                  <span className="text-foreground">{guildSyncStatus.lastTemplateCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last duration</span>
                  <span className="text-foreground">
                    {formatDuration(guildSyncStatus.lastDurationMs)}
                  </span>
                </div>
                {guildSyncStatus.lastError && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {guildSyncStatus.lastError}
                  </div>
                )}
              </div>
            )}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                onClick={onRunGuildSync}
                disabled={guildSyncBusy || !onRunGuildSync}
              >
                {guildSyncBusy ? "Syncing..." : "Run sync now"}
              </Button>
              <p className="text-xs text-muted-foreground">
                Use this after inviting the bot to a new server.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
