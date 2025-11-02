import {
  Home,
  Radio,
  Users,
  Search,
  UserPlus,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
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
import { authClient } from "@/lib/auth-client"
import { useEffect, useState } from "react"
import { socialApi, type FollowingUser } from "@/lib/api/social"

interface FollowedCreator {
  id: string
  username: string
  name: string
  image: string | null
}

const primaryNav = [
  { title: "Home", icon: Home, url: "/" },
  { title: "Live Now", icon: Radio, url: "/live" },
  { title: "Search", icon: Search, url: "/search" },
]

export function HomeSidebar() {
  const location = useLocation()
  const { data: session } = authClient.useSession()
  const [followedCreators, setFollowedCreators] = useState<FollowedCreator[]>([])

  const authenticatedNav = [
    { title: "Following", icon: UserPlus, url: "/following" },
    { title: "Creators", icon: Users, url: "/creators" },
  ]

  useEffect(() => {
    // Fetch followed creators if authenticated
    const fetchFollowing = async () => {
      if (session?.user?.id) {
        try {
          const response = await socialApi.getFollowing(session.user.id)
          if (response.success && response.data) {
            setFollowedCreators(response.data.map((user: FollowingUser) => ({
              id: user.id,
              username: user.username,
              name: user.name || user.username,
              image: user.image,
            })))
          }
        } catch (error) {
          console.error('[Sidebar] Error fetching following:', error)
        }
      }
    }

    fetchFollowing()
  }, [session])

  const isActive = (url: string) => {
    if (url === "/") {
      return location.pathname === "/"
    }
    return location.pathname.startsWith(url)
  }

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
                    <Link 
                      to={item.url} 
                      className={`text-white hover:bg-zinc-900 ${
                        isActive(item.url) ? 'bg-zinc-900' : ''
                      }`}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Authenticated User Navigation */}
        {session?.user && (
          <>
            <SidebarSeparator className="bg-zinc-800" />
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {authenticatedNav.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <Link 
                          to={item.url} 
                          className={`text-white hover:bg-zinc-900 ${
                            isActive(item.url) ? 'bg-zinc-900' : ''
                          }`}
                        >
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}

        {/* Subscriptions - Show followed creators when authenticated */}
        {session?.user && followedCreators.length > 0 && (
          <>
            <SidebarSeparator className="bg-zinc-800 group-data-[collapsible=icon]:hidden" />
            <SidebarGroup className="group-data-[collapsible=icon]:hidden">
              <SidebarGroupLabel className="text-zinc-400">Following</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {followedCreators.slice(0, 5).map((creator) => (
                    <SidebarMenuItem key={creator.id}>
                      <SidebarMenuButton asChild>
                        <Link 
                          to={`/${creator.username}`} 
                          className="flex items-center gap-3 text-white hover:bg-zinc-900"
                        >
                          <div className="flex size-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-xs font-semibold text-white overflow-hidden">
                            {creator.image ? (
                              <img src={creator.image} alt={creator.name} className="w-full h-full object-cover" />
                            ) : (
                              creator.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="truncate">{creator.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  )
}
