"use client";

import Image from "next/image";
import {
  Home,
  Plus,
  Building2,
  Hotel,
  CalendarCheck,
  LayoutDashboard,
  DollarSign,
  ChevronUp,
  User2,
  Users,
  Tag,
  Sparkles,
} from "lucide-react";
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
  SidebarSeparator,
} from "./ui/sidebar";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import useAuthStore from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { Badge } from "./ui/badge";
import { HostSwitcher } from "./HostSwitcher";

const AppSidebar = () => {
  const { user, isAdmin, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const hostNavItems = [
    { title: "Dashboard", url: "/host", icon: LayoutDashboard },
    { title: "My Venues", url: "/host/venues", icon: Hotel },
    { title: "My Spaces", url: "/host/spaces", icon: Building2 },
    { title: "My Bookings", url: "/host/bookings", icon: CalendarCheck },
    { title: "Earnings", url: "/host/earnings", icon: DollarSign },
  ];

  const adminNavItems = [
    { title: "Platform Dashboard", url: "/admin", icon: Home },
    { title: "Users", url: "/admin/users", icon: Users },
    { title: "All Spaces", url: "/admin/spaces", icon: Building2 },
    { title: "All Bookings", url: "/admin/bookings", icon: CalendarCheck },
    { title: "Categories", url: "/admin/categories", icon: Tag },
    { title: "Amenities", url: "/admin/amenities", icon: Sparkles },
    { title: "Exchange Rates", url: "/admin/exchange-rates", icon: DollarSign },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" tooltip="Spacefly.ai Dashboard">
              <Link href="/">
                <Image
                  src="/brand/symbol_transparent.png"
                  alt=""
                  width={24}
                  height={33}
                  className="hidden size-5 shrink-0 object-contain group-data-[collapsible=icon]:block"
                />
                <Image
                  src="/brand/wordmark_transparent.png"
                  alt="Spacefly.ai Dashboard"
                  width={154}
                  height={50}
                  priority
                  className="h-8 w-auto object-contain group-data-[collapsible=icon]:hidden"
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        {/* Host Section — visible to HOST and ADMIN */}
        <SidebarGroup>
          <SidebarGroupLabel>
            {isAdmin ? "Host View" : "Host Dashboard"}
          </SidebarGroupLabel>
          <HostSwitcher />
          <SidebarGroupContent>
            <SidebarMenu>
              {hostNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/host/spaces/new">
                    <Plus />
                    <span>Add New Space</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section — visible to ADMIN only */}
        {isAdmin && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Administration</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <Link href={item.url}>
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
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton>
                  <User2 />
                  <span className="flex items-center gap-2">
                    {user?.name || user?.username || "User"}
                    <Badge
                      variant={isAdmin ? "default" : "secondary"}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {user?.role}
                    </Badge>
                  </span>
                  <ChevronUp className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Account</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
