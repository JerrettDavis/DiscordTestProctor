export type ExamStatus = 0 | 1 | 2

export type ExamSessionDto = {
  id: string
  discordGuildId: string
  guildName: string
  certificationName: string
  discordUserId: string
  discordUserName: string
  questionCount: number
  correctCount: number
  passingScorePercent: number
  scorePercent?: number | null
  passed?: boolean | null
  status: ExamStatus
  startedAt: string
  lastAnswerAt?: string | null
  completedAt?: string | null
  expiresAt: string
}
