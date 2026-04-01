import { Link, useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useAdminAuthStore } from '@/stores/adminAuthStore';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { NAV_ITEMS } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronRight } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function AppSidebar() {
  const location = useLocation();
  const { user } = useAdminAuthStore();
  const { signOut } = useAdminAuth();

  // Filter navigation items based on user role
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!user) return false;
    return item.allowedRoles.includes(user.role);
  }).map((item) => {
    // Filter children if they exist
    if (item.children && user) {
      return {
        ...item,
        children: item.children.filter((child) => child.allowedRoles.includes(user.role)),
      };
    }
    return item;
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground" role="img" aria-label="StreamIt Admin Logo">
            <span className="text-sm font-bold">SA</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">StreamIt Admin</span>
            <span className="text-xs text-muted-foreground">Management Panel</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <nav aria-label="Main navigation">
                {filteredNavItems.map((item) => {
                  const Icon = item.icon;
                  const hasChildren = item.children && item.children.length > 0;

                  if (hasChildren) {
                    return (
                      <Collapsible key={item.href} defaultOpen={isActive(item.href)}>
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton tooltip={item.label} aria-label={`${item.label} menu`}>
                              <Icon className="h-4 w-4" aria-hidden="true" />
                              <span>{item.label}</span>
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" aria-hidden="true" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {item.children?.map((child) => {
                                const ChildIcon = child.icon;
                                return (
                                  <SidebarMenuSubItem key={child.href}>
                                    <SidebarMenuSubButton asChild isActive={isActive(child.href)}>
                                      <Link to={child.href} aria-label={child.label}>
                                        <ChildIcon className="h-4 w-4" aria-hidden="true" />
                                        <span>{child.label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive(item.href)} tooltip={item.label}>
                        <Link to={item.href} aria-label={item.label}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </nav>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-sm">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 flex-col overflow-hidden">
              <span className="truncate font-medium">{user?.name || 'User'}</span>
              <span className="truncate text-xs text-muted-foreground capitalize">
                {user?.role?.replace(/_/g, ' ') || 'Admin'}
              </span>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full min-h-[44px] sm:min-h-0" 
            onClick={signOut}
            aria-label="Sign out of admin panel"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
            Sign Out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
