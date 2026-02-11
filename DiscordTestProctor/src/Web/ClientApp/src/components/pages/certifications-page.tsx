import { CheckCircle2, PlusCircle, RefreshCw, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  CertificationsClient,
  CertificationDetailDto,
  CertificationSummaryDto,
  CreateCertificationRequest,
  CreateQuestionRequest,
  CreateAnswerRequest,
  GuildDto,
  RankDto,
} from "@/web-api-client"

type CertificationsPageProps = {
  client: CertificationsClient
  guilds: GuildDto[]
  activeGuildId?: string | null
  onGuildChange: (guildId: string) => void
  refreshGuilds: () => void
  initialCertificationId?: string | null
  onSelectCertification: (certificationId: string) => void
}

type AnswerDraft = { text: string; isCorrect: boolean }

export function CertificationsPage({
  client,
  guilds,
  activeGuildId,
  onGuildChange,
  refreshGuilds,
  initialCertificationId,
  onSelectCertification,
}: CertificationsPageProps) {
  const [certifications, setCertifications] = useState<CertificationSummaryDto[]>([])
  const [selectedCertificationId, setSelectedCertificationId] = useState<string | null>(
    initialCertificationId ?? null
  )
  const [detail, setDetail] = useState<CertificationDetailDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [guildError, setGuildError] = useState<string | null>(null)
  const [certError, setCertError] = useState<string | null>(null)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [templateError, setTemplateError] = useState<string | null>(null)

  const [guildIdInput, setGuildIdInput] = useState(activeGuildId ?? "")
  const [guildNameInput, setGuildNameInput] = useState("")

  const [certName, setCertName] = useState("")
  const [certDescription, setCertDescription] = useState("")
  const [certPassingScore, setCertPassingScore] = useState(80)
  const [certRoleId, setCertRoleId] = useState("")
  const [certRoleName, setCertRoleName] = useState("")
  const [roleMode, setRoleMode] = useState<"select" | "manual">("select")
  const [roles, setRoles] = useState<RankDto[]>([])
  const [templateToClone, setTemplateToClone] = useState<CertificationDetailDto | null>(null)

  const [questionText, setQuestionText] = useState("")
  const [answers, setAnswers] = useState<AnswerDraft[]>([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ])

  const activeGuild = useMemo(
    () => guilds.find((guild) => guild.discordGuildId === activeGuildId),
    [guilds, activeGuildId]
  )

  const liveCertifications = useMemo(
    () => certifications.filter((cert) => !cert.isTemplate),
    [certifications]
  )

  const templateCertifications = useMemo(
    () => certifications.filter((cert) => cert.isTemplate),
    [certifications]
  )

  const loadCertifications = () => {
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
  }

  useEffect(() => {
    if (activeGuildId) {
      setGuildIdInput(activeGuildId)
    }
  }, [activeGuildId])

  useEffect(() => {
    setSelectedCertificationId(null)
    setDetail(null)
    setTemplateToClone(null)
    setRoles([])
    setCertRoleId("")
    setCertRoleName("")
  }, [activeGuildId])

  useEffect(() => {
    loadCertifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGuildId])

  useEffect(() => {
    if (!activeGuildId) {
      setRoles([])
      return
    }
    client
      .getApiCertificationsGuildsRanks(activeGuildId)
      .then((data) => {
        const list = data ?? []
        setRoles(list)
        if (list.length > 0) {
          setRoleMode("select")
        }
      })
      .catch(() => setRoles([]))
  }, [activeGuildId, client])

  useEffect(() => {
    if (initialCertificationId) {
      setSelectedCertificationId(initialCertificationId)
    }
  }, [initialCertificationId])

  useEffect(() => {
    if (!selectedCertificationId && certifications.length > 0) {
      const fallback =
        liveCertifications[0]?.id ?? templateCertifications[0]?.id ?? null
      if (fallback) {
        setSelectedCertificationId(fallback)
        onSelectCertification(fallback)
      }
    }
  }, [
    certifications,
    liveCertifications,
    templateCertifications,
    selectedCertificationId,
    onSelectCertification,
  ])

  useEffect(() => {
    if (!selectedCertificationId) {
      setDetail(null)
      return
    }
    client
      .getApiCertificationsCertifications(selectedCertificationId)
      .then((data) => setDetail(data))
      .catch(() => setDetail(null))
  }, [client, selectedCertificationId])

  const handleCreateGuild = async () => {
    setGuildError(null)
    if (!guildIdInput || !guildNameInput) {
      setGuildError("Add both a Discord guild ID and a name.")
      return
    }

    try {
      await client.putApiCertificationsGuilds(guildIdInput, { name: guildNameInput })
      refreshGuilds()
      onGuildChange(guildIdInput)
      setGuildNameInput("")
    } catch {
      setGuildError("Unable to save the guild. Check the ID and try again.")
    }
  }

  const cloneTemplateQuestions = async (
    certificationId: string,
    template: CertificationDetailDto
  ) => {
    if (!template.questions || template.questions.length === 0) return

    for (const question of template.questions) {
      const request = new CreateQuestionRequest({
        text: question.text ?? "",
        answers: (question.answers ?? []).map(
          (answer) =>
            new CreateAnswerRequest({
              text: answer.text ?? "",
              isCorrect: answer.isCorrect ?? false,
            })
        ),
      })
      await client.postApiCertificationsCertificationsQuestions(certificationId, request)
    }
  }

  const handleUseTemplate = async (templateId: string) => {
    setTemplateError(null)
    try {
      const templateDetail = await client.getApiCertificationsCertifications(templateId)
      setTemplateToClone(templateDetail)
      setSelectedCertificationId(templateId)
      onSelectCertification(templateId)
      setCertName(`${templateDetail.name ?? "Template"} (Custom)`)
      setCertDescription(templateDetail.description ?? "")
      setCertPassingScore(templateDetail.passingScorePercent ?? 80)
    } catch {
      setTemplateError("Unable to load the template details. Try again.")
    }
  }

  const handleCreateCertification = async () => {
    setCertError(null)
    setTemplateError(null)
    if (!activeGuildId) {
      setCertError("Select or create a guild first.")
      return
    }
    if (!certName || !certDescription || !certRoleId) {
      setCertError("Name, description, and Discord role ID are required.")
      return
    }
    setIsSaving(true)
    try {
      const request = new CreateCertificationRequest({
        name: certName,
        description: certDescription,
        passingScorePercent: certPassingScore,
        discordRoleId: certRoleId,
        rankName: certRoleName || undefined,
        guildName: activeGuild?.name ?? (guildNameInput || undefined),
      })
      const created = await client.postApiCertificationsGuildsCertifications(activeGuildId, request)
      if (created?.id) {
        if (templateToClone) {
          try {
            await cloneTemplateQuestions(created.id, templateToClone)
          } catch {
            setCertError(
              "Certification created, but template questions failed to copy. You can add them manually."
            )
          }
        }
        setSelectedCertificationId(created.id)
        onSelectCertification(created.id)
      }
      setTemplateToClone(null)
      setCertName("")
      setCertDescription("")
      setCertPassingScore(80)
      setCertRoleId("")
      setCertRoleName("")
      loadCertifications()
    } catch {
      setCertError("Unable to create certification. Ensure the name is unique.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddQuestion = async () => {
    setQuestionError(null)
    if (!selectedCertificationId) {
      setQuestionError("Select a certification first.")
      return
    }

    if (!questionText.trim()) {
      setQuestionError("Question text is required.")
      return
    }

    const cleanedAnswers = answers
      .map((answer) => ({ ...answer, text: answer.text.trim() }))
      .filter((answer) => answer.text.length > 0)

    if (cleanedAnswers.length < 2 || cleanedAnswers.length > 5) {
      setQuestionError("Provide between 2 and 5 answers.")
      return
    }

    if (cleanedAnswers.filter((answer) => answer.isCorrect).length !== 1) {
      setQuestionError("Mark exactly one answer as correct.")
      return
    }

    try {
      const request = new CreateQuestionRequest({
        text: questionText,
        answers: cleanedAnswers.map(
          (answer) =>
            new CreateAnswerRequest({
              text: answer.text,
              isCorrect: answer.isCorrect,
            })
        ),
      })
      await client.postApiCertificationsCertificationsQuestions(selectedCertificationId, request)
      setQuestionText("")
      setAnswers([
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ])
      const updated = await client.getApiCertificationsCertifications(selectedCertificationId)
      setDetail(updated)
    } catch {
      setQuestionError("Unable to add question. Double-check your answers.")
    }
  }

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) =>
      prev.map((answer, idx) => (idx === index ? { ...answer, text: value } : answer))
    )
  }

  const handleCorrectChange = (index: number) => {
    setAnswers((prev) =>
      prev.map((answer, idx) => ({ ...answer, isCorrect: idx === index }))
    )
  }

  const addAnswer = () => {
    if (answers.length >= 5) return
    setAnswers((prev) => [...prev, { text: "", isCorrect: false }])
  }

  const removeAnswer = (index: number) => {
    if (answers.length <= 2) return
    setAnswers((prev) => prev.filter((_, idx) => idx !== index))
  }

  const scrollToTemplates = () => {
    const target = document.getElementById("template-library")
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Certifications
          </p>
          <h1 className="text-3xl font-semibold font-[var(--font-display)]">
            Design certification pathways
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage exams for {activeGuild?.name ?? "your guilds"} and publish them in Discord.
          </p>
        </div>
        <Button variant="outline" onClick={loadCertifications}>
          <RefreshCw />
          Refresh
        </Button>
      </div>

      <section className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Wizard</p>
            <h2 className="text-lg font-semibold">Launch your first certification</h2>
          </div>
          <Sparkles className="size-5 text-primary" />
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            "Select a guild and verify the bot is onboarded.",
            "Pick a template or enter a new certification name.",
            "Attach the Discord role to award on passing.",
            "Add questions (2–5 answers each).",
          ].map((step) => (
            <div
              key={step}
              className="flex items-start gap-2 rounded-xl border border-border/60 bg-background/70 p-3 text-sm text-muted-foreground"
            >
              <CheckCircle2 className="mt-0.5 size-4 text-primary" />
              <span>{step}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={scrollToTemplates}>
            Use a template
          </Button>
          <Button variant="outline" onClick={() => setCertName("")}>
            Start from scratch
          </Button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_1.45fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Guild selection</h2>
            <p className="text-xs text-muted-foreground">
              Choose a guild, or register a new one by ID.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <select
                className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                value={activeGuildId ?? ""}
                onChange={(event) => onGuildChange(event.target.value)}
              >
                <option value="" disabled>
                  Select a guild
                </option>
                {guilds.map((guild) => (
                  <option key={guild.discordGuildId ?? guild.id} value={guild.discordGuildId ?? ""}>
                    {guild.name}
                  </option>
                ))}
              </select>
              <div className="grid gap-2">
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
                <Button variant="secondary" onClick={handleCreateGuild}>
                  Save guild
                </Button>
              </div>
              {guildError && <p className="text-xs text-destructive">{guildError}</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Create certification</h2>
            <p className="text-xs text-muted-foreground">
              Tie a Discord role to an exam. The role will be granted on passing.
            </p>
            <div className="mt-4 space-y-3">
              {templateToClone && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      Using template: <strong>{templateToClone.name ?? "Template"}</strong>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTemplateToClone(null)}
                    >
                      Clear template
                    </Button>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-700/80">
                    {templateToClone.questions?.length ?? 0} questions will be cloned after
                    creation.
                  </p>
                </div>
              )}
              <Input
                placeholder="Certification name"
                value={certName}
                onChange={(event) => setCertName(event.target.value)}
              />
              <Textarea
                placeholder="Describe the skills this cert validates"
                value={certDescription}
                onChange={(event) => setCertDescription(event.target.value)}
              />
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  placeholder="Passing score %"
                  type="number"
                  value={certPassingScore}
                  onChange={(event) => setCertPassingScore(Number(event.target.value))}
                />
                {roles.length > 0 && roleMode === "select" ? (
                  <select
                    className="w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
                    value={certRoleId}
                    onChange={(event) => {
                      const selected = roles.find(
                        (role) => role.discordRoleId === event.target.value
                      )
                      setCertRoleId(event.target.value)
                      setCertRoleName(selected?.name ?? "")
                    }}
                  >
                    <option value="">Select a Discord role</option>
                    {roles.map((role) => (
                      <option key={role.discordRoleId ?? role.id} value={role.discordRoleId ?? ""}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    placeholder="Discord role ID"
                    value={certRoleId}
                    onChange={(event) => setCertRoleId(event.target.value)}
                  />
                )}
              </div>
              {roles.length > 0 && roleMode === "select" ? (
                <div className="rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                  Selected role: {certRoleName || "Choose a role above."}
                </div>
              ) : (
                <Input
                  placeholder="Role name (optional, for your records)"
                  value={certRoleName}
                  onChange={(event) => setCertRoleName(event.target.value)}
                />
              )}
              {roles.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRoleMode(roleMode === "select" ? "manual" : "select")}
                >
                  {roleMode === "select"
                    ? "Can't find a role? Enter manually"
                    : "Use synced roles instead"}
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                Leave role name blank if the role is already synced from Discord.
              </p>
              <Button onClick={handleCreateCertification} disabled={isSaving}>
                <PlusCircle />
                {isSaving ? "Creating..." : "Create certification"}
              </Button>
              {certError && <p className="text-xs text-destructive">{certError}</p>}
              {templateError && <p className="text-xs text-destructive">{templateError}</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Certification library</h2>
              <p className="text-xs text-muted-foreground">
                {isLoading
                  ? "Loading…"
                  : `${liveCertifications.length} live · ${templateCertifications.length} templates`}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {liveCertifications.map((cert) => (
              <button
                key={cert.id}
                type="button"
                onClick={() => {
                  if (cert.id) {
                    setSelectedCertificationId(cert.id)
                    onSelectCertification(cert.id)
                  }
                }}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  cert.id === selectedCertificationId
                    ? "border-primary/70 bg-primary/10"
                    : "border-border/60 bg-background/70 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{cert.name}</p>
                <p className="text-xs text-muted-foreground">{cert.description}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-secondary px-2 py-1">
                    {cert.passingScorePercent}% pass
                  </span>
                  {cert.rankId && <span>Rank ID {cert.rankId.slice(0, 8)}</span>}
                </div>
              </button>
            ))}
          </div>

          {!isLoading && liveCertifications.length === 0 && (
            <div className="mt-6 rounded-xl border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
              No certifications yet. Create one on the left to begin.
            </div>
          )}

          {templateCertifications.length > 0 && (
            <div id="template-library" className="mt-6 border-t border-border/60 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Template library
                </h3>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {templateCertifications.map((template) => (
                  <div
                    key={template.id}
                    className={`rounded-xl border px-4 py-3 text-left transition ${
                      template.id === selectedCertificationId
                        ? "border-primary/70 bg-primary/10"
                        : "border-border/60 bg-background/70 hover:border-primary/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (template.id) {
                          setSelectedCertificationId(template.id)
                          onSelectCertification(template.id)
                        }
                      }}
                      className="w-full text-left"
                    >
                      <p className="text-sm font-semibold">{template.name}</p>
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    </button>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-1">Template</span>
                      <span>{template.passingScorePercent}% default pass</span>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => template.id && handleUseTemplate(template.id)}
                    >
                      Use template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {detail && (
            <div className="mt-6 border-t border-border/60 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{detail.name}</h3>
                  <p className="text-xs text-muted-foreground">{detail.description}</p>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {detail.passingScorePercent}% required
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                <p className="text-sm font-medium">Questions</p>
                {(detail.questions?.length ?? 0) === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {detail.isTemplate
                      ? "No questions included in this template."
                      : "No questions yet. Add one below."}
                  </p>
                )}
                {(detail.questions ?? []).map((question) => (
                  <div
                    key={question.id}
                    className="rounded-xl border border-border/60 bg-background/80 p-4"
                  >
                    <p className="text-sm font-medium">{question.text}</p>
                    <div className="mt-2 grid gap-2 text-xs text-muted-foreground">
                      {question.answers.map((answer) => (
                        <div
                          key={answer.id}
                          className={`rounded-md px-2 py-1 ${
                            answer.isCorrect ? "bg-emerald-500/10 text-emerald-700" : "bg-muted/60"
                          }`}
                        >
                          {answer.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {detail.isTemplate ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border/70 bg-card/70 p-5 text-sm text-muted-foreground">
                  Templates are read-only. Clone this template to add your own questions and
                  customize the exam.
                  <div className="mt-3">
                    <Button
                      variant="secondary"
                      onClick={() => detail.id && handleUseTemplate(detail.id)}
                    >
                      Use this template
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-border/60 bg-card/70 p-5">
                  <h4 className="text-sm font-semibold">Add a question</h4>
                  <div className="mt-3 space-y-3">
                    <Textarea
                      placeholder="Question prompt"
                      value={questionText}
                      onChange={(event) => setQuestionText(event.target.value)}
                    />
                    <div className="space-y-2">
                      {answers.map((answer, index) => (
                        <div
                          key={`answer-${index}`}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input
                            type="radio"
                            name="correct-answer"
                            checked={answer.isCorrect}
                            onChange={() => handleCorrectChange(index)}
                          />
                          <Input
                            placeholder={`Answer ${index + 1}`}
                            value={answer.text}
                            onChange={(event) => handleAnswerChange(index, event.target.value)}
                          />
                          {answers.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAnswer(index)}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="outline" onClick={addAnswer}>
                        Add answer
                      </Button>
                      <Button onClick={handleAddQuestion}>Save question</Button>
                    </div>
                    {questionError && <p className="text-xs text-destructive">{questionError}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
