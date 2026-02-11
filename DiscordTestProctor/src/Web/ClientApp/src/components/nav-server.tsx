import { type LucideIcon } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavServer({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Shortcuts</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => {
          const isExternal = item.url.startsWith("http")
          return (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )})}
      </SidebarMenu>
    </SidebarGroup>
  )
}
