import * as React from "react"
import { ChevronsUpDown, Plus, WandSparkles } from "lucide-react"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"

export type GuildSwitcherItem = {
  id: string
  name: string
  subtitle?: string
}

export function GuildSwitcher({
  guilds,
  activeGuildId,
  onGuildChange,
  onNavigateToGuilds,
}: {
  guilds: GuildSwitcherItem[]
  activeGuildId?: string | null
  onGuildChange?: (guildId: string) => void
  onNavigateToGuilds?: () => void
}) {
    const { isMobile } = useSidebar()
    const activeGuild = guilds.find((guild) => guild.id === activeGuildId) ?? guilds[0]

    if (!activeGuild) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" className="justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-8 items-center justify-center rounded-lg border border-dashed text-muted-foreground">
                                <WandSparkles className="size-4" />
                            </div>
                            <div className="grid text-left text-sm leading-tight">
                                <span className="truncate font-medium">No guilds yet</span>
                                <span className="truncate text-xs text-muted-foreground">Add one to start</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="text-xs text-primary hover:underline"
                            onClick={onNavigateToGuilds}
                        >
                            Setup
                        </button>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                <span className="text-sm font-semibold">
                                    {activeGuild.name.slice(0, 2).toUpperCase()}
                                </span>
                            </div>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{activeGuild.name}</span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {activeGuild.subtitle ?? "Discord guild"}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto"/>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="start"
                        side={isMobile ? "bottom" : "right"}
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="text-muted-foreground text-xs">
                            Guilds
                        </DropdownMenuLabel>
                        {guilds.map((guild, index) => (
                            <DropdownMenuItem
                                key={guild.id}
                                onClick={() => onGuildChange?.(guild.id)}
                                className="gap-2 p-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-md border">
                                    <span className="text-xs font-semibold">
                                        {guild.name.slice(0, 2).toUpperCase()}
                                    </span>
                                </div>
                                {guild.name}
                                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem className="gap-2 p-2">
                            <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                                <Plus className="size-4"/>
                            </div>
                            <div className="text-muted-foreground font-medium">
                                <a
                                    target="_blank"
                                    rel="noreferrer"
                                    href="https://discord.com/oauth2/authorize?client_id=1359732245958496276&scope=bot%20applications.commands&permissions=8"
                                >
                                    Add server
                                </a>
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
