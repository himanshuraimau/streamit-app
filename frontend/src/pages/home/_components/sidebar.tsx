import {
  Home,
  PlaySquare,
  Radio,
  History,
  Clock,
  ThumbsUp,
  ListVideo,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"

// Mock subscription data
const subscriptions = [
  { id: 1, name: "Tech Channel", avatar: "TC" },
  { id: 2, name: "Gaming Hub", avatar: "GH" },
  { id: 3, name: "Music World", avatar: "MW" },
  { id: 4, name: "Cooking Master", avatar: "CM" },
  { id: 5, name: "Travel Vlog", avatar: "TV" },
  { id: 6, name: "Science Today", avatar: "ST" },
  { id: 7, name: "Art Studio", avatar: "AS" },
]

const primaryNav = [
  { title: "Home", icon: Home, url: "#" },
  { title: "Shorts", icon: PlaySquare, url: "#" },
  { title: "Subscriptions", icon: Radio, url: "#" },
]

const secondaryNav = [
  { title: "History", icon: History, url: "#" },
  { title: "Watch Later", icon: Clock, url: "#" },
  { title: "Liked Videos", icon: ThumbsUp, url: "#" },
  { title: "Playlists", icon: ListVideo, url: "#" },
]

export function HomeSidebar() {
  const [showAllSubscriptions, setShowAllSubscriptions] = useState(false)

  const displayedSubscriptions = showAllSubscriptions
    ? subscriptions
    : subscriptions.slice(0, 4)

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-800 !top-20 !h-[calc(100vh-4rem)]">
      <SidebarContent className="bg-black">
        {/* Primary Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="text-white hover:bg-zinc-900">
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-zinc-800" />

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <a href={item.url} className="text-white hover:bg-zinc-900">
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="bg-zinc-800 group-data-[collapsible=icon]:hidden" />

        {/* Subscriptions - Only visible when expanded */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel className="text-zinc-400">Subscriptions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayedSubscriptions.map((sub) => (
                <SidebarMenuItem key={sub.id}>
                  <SidebarMenuButton asChild>
                    <a href="#" className="flex items-center gap-3 text-white hover:bg-zinc-900">
                      <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-semibold text-white">
                        {sub.avatar}
                      </div>
                      <span>{sub.name}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {subscriptions.length > 4 && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setShowAllSubscriptions(!showAllSubscriptions)}
                    className="text-white hover:bg-zinc-900"
                  >
                    {showAllSubscriptions ? (
                      <>
                        <ChevronUp />
                        <span>Show less</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown />
                        <span>Show {subscriptions.length - 4} more</span>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
