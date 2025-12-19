import { Link, useLocation } from 'react-router-dom';
import {
  Video,
  MessageCircle,
  Users,
  Upload,
  CheckCircle,
  BarChart3,
  FileText,
  Gift,
} from "lucide-react";
import { useCreatorApplication } from '@/hooks/useCreatorApplication';
import { Card } from '@/components/ui/card';
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
} from "@/components/ui/sidebar";

const creatorNavItems = [
  { title: "Overview", icon: BarChart3, url: "/creator-dashboard/overview" },
  { title: "Go Live", icon: Video, url: "/creator-dashboard/streams" },
  { title: "Chat", icon: MessageCircle, url: "/creator-dashboard/chat" },
  { title: "Community", icon: Users, url: "/creator-dashboard/community" },
  { title: "Content Upload", icon: Upload, url: "/creator-dashboard/content-upload" },
  { title: "Posts", icon: FileText, url: "/creator-dashboard/posts" },
  { title: "Gifts Received", icon: Gift, url: "/gifts/received" },
];

export function CreatorSidebar() {
  const location = useLocation();
  const { application } = useCreatorApplication();

  return (
    <Sidebar collapsible="icon" className="border-r border-zinc-800 !top-20 !h-[calc(100vh-5rem)]">
      <SidebarContent className="bg-black">
        {/* Creator Status Card - Only visible when expanded */}
        <div className="p-4 group-data-[collapsible=icon]:hidden">
          <Card className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/20 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-green-300 font-medium text-sm">Verified Creator</p>
                <p className="text-green-400/70 text-xs truncate">
                  Active since {new Date(application?.createdAt || '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <SidebarSeparator className="bg-zinc-800 group-data-[collapsible=icon]:hidden" />

        {/* Creator Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-zinc-400 group-data-[collapsible=icon]:hidden">
            Creator Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {creatorNavItems.map((item) => {
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <Link 
                        to={item.url} 
                        className={`text-white hover:bg-zinc-900 ${
                          isActive ? 'bg-purple-500/20 text-purple-300 border-r-2 border-purple-500' : ''
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}