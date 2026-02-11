import { ShieldPlus, UsersRound } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CertificationsClient, GuildDto, RankDto } from "@/web-api-client"

type GuildsPageProps = {
  client: CertificationsClient
  guilds: GuildDto[]
  activeGuildId?: string | null
  onGuildChange: (guildId: string) => void
  refreshGuilds: () => void
}

export function GuildsPage({
  client,
  guilds,
  activeGuildId,
  onGuildChange,
  refreshGuilds,
}: GuildsPageProps) {
  const [guildIdInput, setGuildIdInput] = useState(activeGuildId ?? "")
  const [guildNameInput, setGuildNameInput] = useState("")
  const [roleIdInput, setRoleIdInput] = useState("")
  const [roleNameInput, setRoleNameInput] = useState("")
  const [roles, setRoles] = useState<RankDto[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const activeGuild = useMemo(
    () => guilds.find((guild) => guild.discordGuildId === activeGuildId),
    [guilds, activeGuildId]
  )

  useEffect(() => {
    if (activeGuildId) {
      setGuildIdInput(activeGuildId)
    }
  }, [activeGuildId])

  useEffect(() => {
    if (!activeGuildId) {
      setRoles([])
      return
    }
    client
      .getApiCertificationsGuildsRanks(activeGuildId)
      .then((data) => setRoles(data ?? []))
      .catch(() => setRoles([]))
  }, [activeGuildId, client])

  const handleSaveGuild = async () => {
    setError(null)
    setSuccess(null)
    if (!guildIdInput || !guildNameInput) {
      setError("Guild ID and name are required.")
      return
    }
    try {
      await client.putApiCertificationsGuilds(guildIdInput, { name: guildNameInput })
      refreshGuilds()
      onGuildChange(guildIdInput)
      setGuildNameInput("")
      setSuccess("Guild saved successfully.")
    } catch {
      setError("Unable to save guild. Double-check the ID.")
    }
  }

  const handleSaveRole = async () => {
    setError(null)
    setSuccess(null)
    if (!guildIdInput || !roleIdInput || !roleNameInput) {
      setError("Guild ID, role ID, and role name are required.")
      return
    }
    try {
      await client.putApiCertificationsGuildsRanks(guildIdInput, roleIdInput, { name: roleNameInput })
      setRoleIdInput("")
      setRoleNameInput("")
      if (activeGuildId === guildIdInput) {
        const updated = await client.getApiCertificationsGuildsRanks(activeGuildId)
        setRoles(updated ?? [])
      }
      setSuccess("Role saved successfully.")
    } catch {
      setError("Unable to save role. Confirm the IDs and try again.")
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Guild Operations</p>
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">
          Connect guilds and role mappings
        </h1>
        <p className="text-sm text-muted-foreground">
          Save guild IDs, then register role IDs to link certifications to Discord permissions.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Guild registry</h2>
          </div>
          <div className="mt-4 grid gap-3">
            {guilds.map((guild) => (
              <button
                key={guild.discordGuildId ?? guild.id}
                type="button"
                onClick={() => {
                  if (guild.discordGuildId) {
                    onGuildChange(guild.discordGuildId)
                    setGuildIdInput(guild.discordGuildId)
                  }
                }}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  guild.discordGuildId === activeGuildId
                    ? "border-primary/70 bg-primary/10"
                    : "border-border/60 bg-background/70 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{guild.name}</p>
                <p className="text-xs text-muted-foreground">Discord ID {guild.discordGuildId}</p>
              </button>
            ))}
            {guilds.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/70 p-4 text-sm text-muted-foreground">
                No guilds saved yet. Add one using the form.
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-border/60 pt-5">
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Synced roles
            </h3>
            <p className="mt-2 text-xs text-muted-foreground">
              {activeGuild ? `Roles synced from ${activeGuild.name}.` : "Select a guild to view roles."}
            </p>
            <div className="mt-3 grid gap-2">
              {roles.map((role) => (
                <div
                  key={role.discordRoleId ?? role.id}
                  className="rounded-xl border border-border/60 bg-background/70 px-4 py-2 text-sm"
                >
                  <p className="font-medium">{role.name}</p>
                  <p className="text-xs text-muted-foreground">Discord ID {role.discordRoleId}</p>
                </div>
              ))}
              {activeGuild && roles.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/70 p-4 text-xs text-muted-foreground">
                  No roles synced yet. Run a guild sync or confirm bot permissions.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Save a guild</h2>
            <p className="text-xs text-muted-foreground">
              Copy the guild ID from Discord (Developer Mode → Copy ID).
            </p>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Discord guild ID"
                value={guildIdInput}
                onChange={(event) => setGuildIdInput(event.target.value)}
              />
              <Input
                placeholder="Guild display name"
                value={guildNameInput}
                onChange={(event) => setGuildNameInput(event.target.value)}
              />
              <Button onClick={handleSaveGuild}>Save guild</Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <ShieldPlus className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Register a role</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Roles are used when a candidate passes an exam.
            </p>
            <div className="mt-4 space-y-3">
              <Input
                placeholder="Discord role ID"
                value={roleIdInput}
                onChange={(event) => setRoleIdInput(event.target.value)}
              />
              <Input
                placeholder="Role name"
                value={roleNameInput}
                onChange={(event) => setRoleNameInput(event.target.value)}
              />
              <Button variant="secondary" onClick={handleSaveRole}>
                Save role
              </Button>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {success && <p className="text-xs text-emerald-600">{success}</p>}
        </div>
      </section>
    </div>
  )
}
