export type GuildSyncStatus = {
  lastRun?: string | null
  lastSuccess?: string | null
  lastError?: string | null
  lastGuildCount: number
  lastRoleCount: number
  lastTemplateCount: number
  lastDurationMs?: number | null
  intervalSeconds: number
}
