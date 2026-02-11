import { CheckCircle2, Clock3, RefreshCw, Search, ShieldCheck, XCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import followIfLoginRedirect from "@/components/api-authorization/followIfLoginRedirect"
import { Button } from "@/components/ui/button"
import { GuildDto } from "@/web-api-client"
import { ExamSessionDto, ExamStatus } from "@/types/exams"

type ResultsPageProps = {
  guilds: GuildDto[]
  activeGuildId?: string | null
  onGuildChange: (guildId: string) => void
}

const statusMeta: Record<ExamStatus, { label: string; className: string; icon: typeof Clock3 }> = {
  0: {
    label: "Active",
    className: "border-amber-500/40 bg-amber-500/10 text-amber-600",
    icon: Clock3,
  },
  1: {
    label: "Completed",
    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
    icon: CheckCircle2,
  },
  2: {
    label: "Expired",
    className: "border-rose-500/40 bg-rose-500/10 text-rose-600",
    icon: XCircle,
  },
}

const formatTime = (value?: string | null) => {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return date.toLocaleString()
}

const formatPercent = (value?: number | null) => {
  if (value == null) return "—"
  return `${value}%`
}

export function ResultsPage({ guilds, activeGuildId, onGuildChange }: ResultsPageProps) {
  const [results, setResults] = useState<ExamSessionDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ExamStatus | "all">("all")
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const loadResults = () => {
    setIsLoading(true)
    const queryString = activeGuildId ? `?discordGuildId=${encodeURIComponent(activeGuildId)}` : ""

    fetch(`/api/Exams/results${queryString}`)
      .then((response) => {
        followIfLoginRedirect(response)
        if (!response.ok) throw new Error("Failed to load results.")
        return response.json() as Promise<ExamSessionDto[]>
      })
      .then((data) => {
        setResults(data ?? [])
        setLastUpdated(new Date())
      })
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadResults()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGuildId])

  useEffect(() => {
    const interval = window.setInterval(() => loadResults(), 45000)
    return () => window.clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGuildId])

  const filteredResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase()

    return results.filter((session) => {
      if (statusFilter !== "all" && session.status !== statusFilter) {
        return false
      }

      if (!trimmed) return true

      return (
        session.discordUserName.toLowerCase().includes(trimmed) ||
        session.certificationName.toLowerCase().includes(trimmed) ||
        session.guildName.toLowerCase().includes(trimmed)
      )
    })
  }, [query, results, statusFilter])

  const stats = useMemo(() => {
    const total = filteredResults.length
    const graded = filteredResults.filter((session) => session.scorePercent != null)
    const passed = filteredResults.filter((session) => session.passed === true)
    const expired = filteredResults.filter((session) => session.status === 2)

    const avgScore =
      graded.length === 0
        ? null
        : Math.round(
            graded.reduce((sum, session) => sum + (session.scorePercent ?? 0), 0) / graded.length
          )

    const passRate = graded.length === 0 ? null : Math.round((passed.length / graded.length) * 100)

    return [
      { label: "Results", value: total },
      { label: "Pass rate", value: passRate == null ? "—" : `${passRate}%` },
      { label: "Avg score", value: avgScore == null ? "—" : `${avgScore}%` },
      { label: "Expired", value: expired.length },
    ]
  }, [filteredResults])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Results</p>
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">
            Analyze exam outcomes and trends
          </h1>
          <p className="text-sm text-muted-foreground">
            Review pass rates, identify at-risk candidates, and track cert performance.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={loadResults}>
            <RefreshCw />
            Refresh
          </Button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Filters</h2>
          <p className="text-xs text-muted-foreground">Slice results by guild or status.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
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
            <select
              className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
              value={statusFilter === "all" ? "all" : statusFilter.toString()}
              onChange={(event) => {
                const value = event.target.value
                setStatusFilter(value === "all" ? "all" : (Number(value) as ExamStatus))
              }}
            >
              <option value="all">All statuses</option>
              <option value="1">Completed</option>
              <option value="2">Expired</option>
              <option value="0">Active</option>
            </select>
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-md border border-border/60 bg-background px-3 py-2 text-sm">
            <Search className="size-4 text-muted-foreground" />
            <input
              className="flex-1 bg-transparent text-sm outline-none"
              placeholder="Search by user, certification, or guild"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Recent attempts</h2>
            <p className="text-xs text-muted-foreground">
              {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString()}` : ""}
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {isLoading ? "Loading…" : `${filteredResults.length} results`}
          </span>
        </div>

        <div className="mt-4 grid gap-3">
          {filteredResults.map((session) => {
            const meta = statusMeta[session.status]
            const StatusIcon = meta.icon
            const outcome =
              session.passed === true
                ? {
                    label: "Passed",
                    className: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
                  }
                : session.passed === false
                  ? {
                      label: "Failed",
                      className: "border-rose-500/40 bg-rose-500/10 text-rose-600",
                    }
                  : {
                      label: "Ungraded",
                      className: "border-slate-500/40 bg-slate-500/10 text-slate-500",
                    }

            return (
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
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${meta.className}`}
                    >
                      <StatusIcon className="size-3.5" />
                      {meta.label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${outcome.className}`}
                    >
                      <ShieldCheck className="size-3.5" />
                      {outcome.label}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                  <div>
                    Score {formatPercent(session.scorePercent)} ({session.correctCount}/
                    {session.questionCount})
                  </div>
                  <div>Required {session.passingScorePercent}%</div>
                  <div>Started {formatTime(session.startedAt)}</div>
                  <div>
                    {session.completedAt
                      ? `Completed ${formatTime(session.completedAt)}`
                      : `Expires ${formatTime(session.expiresAt)}`}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {!isLoading && filteredResults.length === 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
            No results yet. Run an exam to see the first attempt recorded.
          </div>
        )}
      </section>
    </div>
  )
}
