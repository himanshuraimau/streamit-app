import { Home, Plus, User, Heart, Bookmark, TrendingUp } from 'lucide-react';
import { useSession } from '@/lib/auth-client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function ContentSidebar() {
  const { data: session } = useSession();

  const mainItems = [
    {
      title: 'Home Feed',
      icon: Home,
      url: '#',
      active: true,
    },
    {
      title: 'Trending',
      icon: TrendingUp,
      url: '#',
    },
  ];

  const userItems = session?.user ? [
    {
      title: 'My Posts',
      icon: User,
      url: '#',
    },
    {
      title: 'Create Post',
      icon: Plus,
      url: '#',
    },
    {
      title: 'Liked Posts',
      icon: Heart,
      url: '#',
    },
    {
      title: 'Saved Posts',
      icon: Bookmark,
      url: '#',
    },
  ] : [];

  return (
    <Sidebar className="border-r border-zinc-800 bg-black">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-400">Discover</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.active}
                    className="text-zinc-300 hover:text-white hover:bg-zinc-800"
                  >
                    <a href={item.url}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {session?.user && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-zinc-400">Your Content</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {userItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className="text-zinc-300 hover:text-white hover:bg-zinc-800"
                    >
                      <a href={item.url}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}