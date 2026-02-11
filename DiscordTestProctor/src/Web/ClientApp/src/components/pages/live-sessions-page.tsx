import { Activity, Clock3, RefreshCw, ShieldCheck, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import followIfLoginRedirect from "@/components/api-authorization/followIfLoginRedirect"
import { Button } from "@/components/ui/button"
import { GuildDto } from "@/web-api-client"
import { ExamSessionDto } from "@/types/exams"

type LiveSessionsPageProps = {
  guilds: GuildDto[]
  activeGuildId?: string | null
  onGuildChange: (guildId: string) => void
}

const formatTime = (value?: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

const formatTimeLeft = (value: string) => {
  const expiresAt = new Date(value)
  const now = new Date()
  const delta = Math.max(0, expiresAt.getTime() - now.getTime())
  const minutes = Math.floor(delta / 60000)
  const seconds = Math.floor((delta % 60000) / 1000)
  return `${minutes}m ${seconds}s`
}

export function LiveSessionsPage({
  guilds,
  activeGuildId,
  onGuildChange,
}: LiveSessionsPageProps) {
  const [sessions, setSessions] = useState<ExamSessionDto[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const loadSessions = () => {
    setIsLoading(true)
    const query = activeGuildId ? `?discordGuildId=${encodeURIComponent(activeGuildId)}` : ""
    fetch(`/api/Exams/sessions${query}`)
      .then((response) => {
        followIfLoginRedirect(response)
        if (!response.ok) throw new Error("Failed to load sessions.")
        return response.json() as Promise<ExamSessionDto[]>
      })
      .then((data) => setSessions(data ?? []))
      .catch(() => setSessions([]))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadSessions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGuildId])

  useEffect(() => {
    const interval = window.setInterval(() => loadSessions(), 15000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGuildId])

  const stats = useMemo(() => {
    const active = sessions.length
    const avgProgress =
      active === 0
        ? 0
        : Math.round(
            (sessions.reduce(
              (sum, session) => sum + session.correctCount / session.questionCount,
              0
            ) /
              active) *
              100
          )

    return [
      { label: "Live sessions", value: active },
      { label: "Avg progress", value: active === 0 ? "—" : `${avgProgress}%` },
    ]
  }, [sessions])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Live Sessions
          </p>
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">
            Monitor active exams in real time
          </h1>
          <p className="text-sm text-muted-foreground">
            Track who is testing, progress, and how much time remains before sessions expire.
          </p>
        </div>
        <Button variant="outline" onClick={loadSessions}>
          <RefreshCw />
          Refresh
        </Button>
      </div>

      <section className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Guild filter</h2>
          <p className="text-xs text-muted-foreground">Scope sessions to a specific server.</p>
          <select
            className="mt-4 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
            value={activeGuildId ?? ""}
            onChange={(event) => onGuildChange(event.target.value)}
          >
            <option value="">All guilds</option>
            {guilds.map((guild) => (
              <option key={guild.discordGuildId ?? guild.id} value={guild.discordGuildId ?? ""}>
                {guild.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm"
            >
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {stat.label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Active exam sessions</h2>
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${sessions.length} active`}
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl border border-border/60 bg-background/70 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{session.certificationName}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.discordUserName} · {session.guildName}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="size-4 text-primary" />
                  {formatTimeLeft(session.expiresAt)} left
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-primary" />
                  {session.correctCount}/{session.questionCount} correct
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" />
                  {session.passingScorePercent}% required
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="size-4 text-primary" />
                  Started {formatTime(session.startedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isLoading && sessions.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
            No active sessions right now.
          </div>
        )}
      </section>
    </div>
  )
}
