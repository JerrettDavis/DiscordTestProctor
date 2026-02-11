import { useEffect, useState } from "react"
import { BookOpenCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  CertificationsClient,
  CertificationDetailDto,
  CertificationSummaryDto,
  CreateAnswerRequest,
  CreateQuestionRequest,
  GuildDto,
} from "@/web-api-client"

type QuestionsPageProps = {
  client: CertificationsClient
  guilds: GuildDto[]
  activeGuildId?: string | null
  onGuildChange: (guildId: string) => void
}

type AnswerDraft = { text: string; isCorrect: boolean }

export function QuestionsPage({
  client,
  guilds,
  activeGuildId,
  onGuildChange,
}: QuestionsPageProps) {
  const [certifications, setCertifications] = useState<CertificationSummaryDto[]>([])
  const [selectedCertificationId, setSelectedCertificationId] = useState<string | null>(null)
  const [detail, setDetail] = useState<CertificationDetailDto | null>(null)
  const [questionText, setQuestionText] = useState("")
  const [answers, setAnswers] = useState<AnswerDraft[]>([
    { text: "", isCorrect: true },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!activeGuildId) {
      setCertifications([])
      setSelectedCertificationId(null)
      return
    }
    client
      .getApiCertificationsGuildsCertifications(activeGuildId)
      .then((data) => {
        const liveCerts = (data ?? []).filter((cert) => !cert.isTemplate)
        setCertifications(liveCerts)
        if (liveCerts.length > 0) {
          setSelectedCertificationId(liveCerts[0].id ?? null)
        }
      })
      .catch(() => setCertifications([]))
  }, [activeGuildId, client])

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

  const handleSubmit = async () => {
    setError(null)
    if (!selectedCertificationId) {
      setError("Select a certification first.")
      return
    }
    if (!questionText.trim()) {
      setError("Question text is required.")
      return
    }

    const cleanedAnswers = answers
      .map((answer) => ({ ...answer, text: answer.text.trim() }))
      .filter((answer) => answer.text.length > 0)

    if (cleanedAnswers.length < 2 || cleanedAnswers.length > 5) {
      setError("Provide between 2 and 5 answers.")
      return
    }

    if (cleanedAnswers.filter((answer) => answer.isCorrect).length !== 1) {
      setError("Mark exactly one answer as correct.")
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
      setError("Unable to add question. Check the inputs and try again.")
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Question Bank</p>
        <h1 className="text-3xl font-semibold font-[var(--font-display)]">
          Build and refine question sets
        </h1>
          <p className="text-sm text-muted-foreground">
            Every saved question is immediately available to the Discord exam flow.
          </p>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Choose a certification</h2>
          <select
            className="mt-3 w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm"
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
          <div className="mt-4 space-y-2">
            {certifications.map((cert) => (
              <button
                key={cert.id}
                type="button"
                onClick={() => setSelectedCertificationId(cert.id ?? null)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  cert.id === selectedCertificationId
                    ? "border-primary/70 bg-primary/10"
                    : "border-border/60 bg-background/70 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{cert.name}</p>
                <p className="text-xs text-muted-foreground">{cert.description}</p>
              </button>
            ))}
            {certifications.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No certifications available for this guild yet.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/60 p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <BookOpenCheck className="size-4 text-primary" />
            <h2 className="text-lg font-semibold">Add a question</h2>
          </div>
          <div className="mt-4 space-y-3">
            <Textarea
              placeholder="Question prompt"
              value={questionText}
              onChange={(event) => setQuestionText(event.target.value)}
            />
            {answers.map((answer, index) => (
              <div key={`question-answer-${index}`} className="flex flex-wrap items-center gap-2">
                <input
                  type="radio"
                  name="question-correct"
                  checked={answer.isCorrect}
                  onChange={() => handleCorrectChange(index)}
                />
                <Input
                  placeholder={`Answer ${index + 1}`}
                  value={answer.text}
                  onChange={(event) => handleAnswerChange(index, event.target.value)}
                />
                {answers.length > 2 && (
                  <Button variant="ghost" size="sm" onClick={() => removeAnswer(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" onClick={addAnswer}>
                Add answer
              </Button>
              <Button onClick={handleSubmit}>Save question</Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium">Existing questions</p>
            {detail?.questions.map((question) => (
              <div
                key={question.id}
                className="rounded-xl border border-border/60 bg-background/70 p-4"
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
            {detail && detail.questions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No questions yet for this certification.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
