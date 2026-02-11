"use client"

import { ChevronsUpDown, LogOut, User } from "lucide-react"
import { useMemo, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { MeVm } from "@/web-api-client.ts"

export function NavUser({ user }: { user?: MeVm | null }) {
    const { isMobile } = useSidebar()
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const identityBaseUrl = useMemo(() => {
        const base =
            import.meta.env.VITE_API_URL ||
            import.meta.env.VITE_BASE_URL ||
            window.location.origin
        return base.endsWith("/") ? base.slice(0, -1) : base
    }, [])

    const returnUrl = useMemo(
        () =>
            encodeURIComponent(
                `${window.location.pathname}${window.location.search}${window.location.hash}`
            ),
        []
    )

    const handleLogout = async () => {
        setIsLoggingOut(true)
        try {
            await fetch("/api/Auth/logout", { method: "POST" })
        } finally {
            window.location.href = `${identityBaseUrl}/Identity/Account/Login?ReturnUrl=${returnUrl}`
        }
    }

    if (!user) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild size="lg">
                        <a href={`${identityBaseUrl}/Identity/Account/Login?ReturnUrl=${returnUrl}`}>
                            <User className="size-4" />
                            <span>Sign in</span>
                        </a>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    const displayName = user.name ?? "User"

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-lg">
                                {user.avatarUrl && (
                                    <AvatarImage src={user.avatarUrl} alt={displayName} />
                                )}
                                <AvatarFallback className="rounded-lg">
                                    {displayName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{displayName}</span>
                                {displayName !== user.email && (
                                    <span className="truncate text-xs">{user.email}</span>
                                )}
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-lg">
                                    {user.avatarUrl && (
                                        <AvatarImage src={user.avatarUrl} alt={displayName} />
                                    )}
                                    <AvatarFallback className="rounded-lg">
                                        {displayName.slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">{displayName}</span>
                                    {displayName !== user.email && (
                                        <span className="truncate text-xs">{user.email}</span>
                                    )}
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <a href={`${identityBaseUrl}/Identity/Account/Manage/Index`}>
                                    <User />
                                    Account
                                </a>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} disabled={isLoggingOut}>
                            <LogOut />
                            {isLoggingOut ? "Signing out..." : "Log out"}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    )
}
