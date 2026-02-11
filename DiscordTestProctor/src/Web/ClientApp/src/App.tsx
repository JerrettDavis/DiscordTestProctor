import "./App.css"
import { useCallback, useEffect, useMemo, useState } from "react"
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr"

import followIfLoginRedirect from "@/components/api-authorization/followIfLoginRedirect"
import { ThemeProvider } from "@/components/theme-provider.tsx"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx"
import { AppSidebar } from "@/components/app-sidebar.tsx"
import { AppFooter } from "@/components/app-footer"
import { Separator } from "@/components/ui/separator.tsx"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx"
import { useHashRoute } from "@/hooks/use-hash-route"
import { OverviewPage } from "@/components/pages/overview-page"
import { CertificationsPage } from "@/components/pages/certifications-page"
import { GuildsPage } from "@/components/pages/guilds-page"
import { HelpPage } from "@/components/pages/help-page"
import { QuestionsPage } from "@/components/pages/questions-page"
import { SetupPage } from "@/components/pages/setup-page"
import { LiveSessionsPage } from "@/components/pages/live-sessions-page"
import { ResultsPage } from "@/components/pages/results-page"
import { CertificationsClient, GuildDto } from "@/web-api-client"
import { GuildSyncStatus } from "@/types/guild-sync"

function App() {
    const certificationsClient = useMemo(() => new CertificationsClient(), [])
    const [guilds, setGuilds] = useState<GuildDto[]>([])
    const [activeGuildId, setActiveGuildId] = useState<string | null>(null)
    const [guildSyncStatus, setGuildSyncStatus] = useState<GuildSyncStatus | null>(null)
    const [guildSyncLoaded, setGuildSyncLoaded] = useState(false)
    const [guildSyncBusy, setGuildSyncBusy] = useState(false)
    const { route, params, navigate } = useHashRoute("overview")
    const knownRoutes = useMemo(
        () =>
            new Set([
                "overview",
                "certifications",
                "questions",
                "guilds",
                "setup",
                "help",
                "exams",
                "results",
            ]),
        []
    )

    const applyGuilds = useCallback((list: GuildDto[]) => {
        setGuilds(list)
        setActiveGuildId((prev) => {
            if (list.length === 0) return null
            if (prev && list.some((guild) => guild.discordGuildId === prev)) return prev
            return list[0].discordGuildId ?? null
        })
    }, [])

    const refreshGuilds = useCallback(() => {
        certificationsClient
            .getApiCertificationsGuilds()
            .then((data) => {
                applyGuilds(data ?? [])
            })
            .catch(() => applyGuilds([]))
    }, [applyGuilds, certificationsClient])

    const refreshGuildSyncStatus = useCallback(() => {
        fetch("/api/GuildSync/status", {
            headers: {
                Accept: "application/json",
            },
        })
            .then((response) => {
                followIfLoginRedirect(response)
                if (!response.ok) {
                    throw new Error("Unable to load guild sync status.")
                }
                return response.json() as Promise<GuildSyncStatus>
            })
            .then((data) => setGuildSyncStatus(data))
            .catch(() => setGuildSyncStatus(null))
            .finally(() => setGuildSyncLoaded(true))
    }, [])

    const runGuildSync = useCallback(() => {
        setGuildSyncBusy(true)
        return fetch("/api/GuildSync/run", {
            method: "POST",
            headers: {
                Accept: "application/json",
            },
        })
            .then((response) => {
                followIfLoginRedirect(response)
                if (!response.ok) {
                    throw new Error("Unable to run guild sync.")
                }
                return response.json() as Promise<GuildSyncStatus>
            })
            .then((data) => setGuildSyncStatus(data))
            .catch(() => setGuildSyncStatus(null))
            .finally(() => {
                setGuildSyncLoaded(true)
                setGuildSyncBusy(false)
            })
    }, [])

    useEffect(() => {
        refreshGuilds()
    }, [refreshGuilds])

    useEffect(() => {
        refreshGuildSyncStatus()
    }, [refreshGuildSyncStatus])

    useEffect(() => {
        const interval = window.setInterval(() => {
            refreshGuilds()
            refreshGuildSyncStatus()
        }, 30000)

        return () => window.clearInterval(interval)
    }, [refreshGuilds, refreshGuildSyncStatus])

    useEffect(() => {
        const connection = new HubConnectionBuilder()
            .withUrl("/hubs/guilds")
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Warning)
            .build()

        connection.on("guilds:updated", (updated: GuildDto[]) => {
            if (Array.isArray(updated)) {
                applyGuilds(updated)
            } else {
                refreshGuilds()
            }
        })

        connection.on("guilds:status", (status: GuildSyncStatus) => {
            if (status) {
                setGuildSyncStatus(status)
                setGuildSyncLoaded(true)
            }
        })

        connection.start().catch(() => {
            // Ignore initial connection errors; retries will kick in on reconnect.
        })

        return () => {
            connection.stop()
        }
    }, [applyGuilds, refreshGuilds])

    useEffect(() => {
        if (!knownRoutes.has(route.path)) {
            navigate("overview")
        }
    }, [knownRoutes, route.path, navigate])

    const breadcrumbLabel = useMemo(() => {
        switch (route.path) {
            case "overview":
                return { parent: "Console", current: "Overview" }
            case "certifications":
                return { parent: "Console", current: "Certifications" }
            case "questions":
                return { parent: "Console", current: "Question Bank" }
            case "guilds":
                return { parent: "Operations", current: "Guilds & Roles" }
            case "setup":
                return { parent: "Operations", current: "Bot Setup" }
            case "help":
                return { parent: "Resources", current: "Help & Docs" }
            case "exams":
                return { parent: "Examinations", current: "Live Sessions" }
            case "results":
                return { parent: "Examinations", current: "Results" }
            default:
                return { parent: "Console", current: "Overview" }
        }
    }, [route.path])

    useEffect(() => {
        const baseTitle = "Janus Proctor Console"
        const pageTitle = breadcrumbLabel.current || "Overview"
        document.title = `${pageTitle} · ${baseTitle}`
    }, [breadcrumbLabel])

    return (
        <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            <SidebarProvider>
                <AppSidebar
                    guilds={guilds}
                    activeGuildId={activeGuildId}
                    onGuildChange={(guildId) => setActiveGuildId(guildId)}
                    onNavigate={navigate}
                />
                <SidebarInset>
                    <header
                        className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1"/>
                            <Separator orientation="vertical" className="mr-2 h-4"/>
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="#/overview">
                                            {breadcrumbLabel.parent}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block"/>
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>{breadcrumbLabel.current}</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="app-shell flex flex-1 flex-col gap-6 p-6 pt-2">
                        {route.path === "overview" && (
                            <OverviewPage
                                client={certificationsClient}
                                guilds={guilds}
                                activeGuildId={activeGuildId}
                                guildSyncStatus={guildSyncStatus}
                                guildSyncLoaded={guildSyncLoaded}
                                guildSyncBusy={guildSyncBusy}
                                onRunGuildSync={runGuildSync}
                                onNavigate={navigate}
                            />
                        )}
                        {route.path === "certifications" && (
                            <CertificationsPage
                                client={certificationsClient}
                                guilds={guilds}
                                activeGuildId={activeGuildId}
                                onGuildChange={(guildId) => setActiveGuildId(guildId)}
                                refreshGuilds={refreshGuilds}
                                initialCertificationId={params[0] ?? null}
                                onSelectCertification={(id) => navigate(`certifications/${id}`)}
                            />
                        )}
                        {route.path === "questions" && (
                            <QuestionsPage
                                client={certificationsClient}
                                guilds={guilds}
                                activeGuildId={activeGuildId}
                                onGuildChange={(guildId) => setActiveGuildId(guildId)}
                            />
                        )}
                        {route.path === "guilds" && (
                            <GuildsPage
                                client={certificationsClient}
                                guilds={guilds}
                                activeGuildId={activeGuildId}
                                onGuildChange={(guildId) => setActiveGuildId(guildId)}
                                refreshGuilds={refreshGuilds}
                            />
                        )}
                        {route.path === "setup" && (
                            <SetupPage
                                onNavigate={navigate}
                                guilds={guilds}
                                guildSyncStatus={guildSyncStatus}
                                guildSyncLoaded={guildSyncLoaded}
                                guildSyncBusy={guildSyncBusy}
                                onRunGuildSync={runGuildSync}
                            />
                        )}
                        {route.path === "help" && <HelpPage onNavigate={navigate} />}
                        {route.path === "exams" && (
                            <LiveSessionsPage
                                guilds={guilds}
                                activeGuildId={activeGuildId}
                                onGuildChange={(guildId) => setActiveGuildId(guildId)}
                            />
                        )}
                        {route.path === "results" && (
                            <ResultsPage
                                guilds={guilds}
                                activeGuildId={activeGuildId}
                                onGuildChange={(guildId) => setActiveGuildId(guildId)}
                            />
                        )}
                        <AppFooter />
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </ThemeProvider>
    )
}

export default App
