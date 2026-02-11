import * as React from "react"
import { useMemo } from "react"
import {
    BookOpen,
    Bot,
    Frame,
    Map,
    PieChart,
    Settings2,
    SquareTerminal
} from "lucide-react"

import {NavMain} from "@/components/nav-main"
import {NavServer} from "@/components/nav-server.tsx"
import {NavUser} from "@/components/nav-user"
import {GuildSwitcher, GuildSwitcherItem} from "@/components/guild-switcher.tsx"
import {Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail} from "@/components/ui/sidebar"
import { GuildDto } from "@/web-api-client.ts"
import { useUserData } from "@/hooks/use-user-data"

const navMain = [
    {
        title: "Console",
        url: "#/overview",
        icon: SquareTerminal,
        isActive: true,
        items: [
            {
                title: "Overview",
                url: "#/overview",
            },
            {
                title: "Certifications",
                url: "#/certifications",
            },
            {
                title: "Question Bank",
                url: "#/questions",
            },
        ],
    },
    {
        title: "Operations",
        url: "#/guilds",
        icon: Settings2,
        items: [
            {
                title: "Guilds & Roles",
                url: "#/guilds",
            },
            {
                title: "Bot Setup",
                url: "#/setup",
            },
            {
                title: "Help & Docs",
                url: "#/help",
            },
        ],
    },
    {
        title: "Examinations",
        url: "#/exams",
        icon: BookOpen,
        items: [
            {
                title: "Live Sessions",
                url: "#/exams",
            },
            {
                title: "Results",
                url: "#/results",
            },
        ],
    },
]

const shortcuts = [
    {
        name: "Invite Bot",
        url: "https://discord.com/oauth2/authorize?client_id=1359732245958496276&scope=bot%20applications.commands&permissions=8",
        icon: Bot,
    },
    {
        name: "Discord App",
        url: "https://discord.com/developers/applications/1359732245958496276",
        icon: Frame,
    },
    {
        name: "API Docs",
        url: "/api",
        icon: PieChart,
    },
    {
        name: "Health",
        url: "/health",
        icon: Map,
    },
]


export function AppSidebar({
                               guilds,
                               activeGuildId,
                               onGuildChange,
                               onNavigate,
                               ...props
                           }: React.ComponentProps<typeof Sidebar> & {
    guilds: GuildDto[]
    activeGuildId?: string | null
    onGuildChange?: (guildId: string) => void
    onNavigate?: (path: string) => void
}) {
    const userData = useUserData();
    const guildItems = useMemo<GuildSwitcherItem[]>(
        () => guilds.map((guild) => ({
            id: guild.discordGuildId ?? guild.id ?? "",
            name: guild.name ?? "Untitled",
            subtitle: `Discord ID ${guild.discordGuildId}`,
        })),
        [guilds]
    );

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Janus Proctor
                </div>
                <GuildSwitcher
                    guilds={guildItems}
                    activeGuildId={activeGuildId ?? undefined}
                    onGuildChange={onGuildChange}
                    onNavigateToGuilds={() => onNavigate?.("guilds")}
                />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navMain}/>
                <NavServer projects={shortcuts}/>
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
            <SidebarRail/>
        </Sidebar>
    )
}
