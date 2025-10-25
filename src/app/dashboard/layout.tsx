
'use client';

import { Sidebar, SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { LayoutDashboard, History, Trophy, Bot, Star, BookOpen, User } from "lucide-react";
import { SidebarButton } from "@/components/dashboard/SidebarButton";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const navItems = [
    { href: "/dashboard", icon: <LayoutDashboard />, label: "Overview" },
    { href: "/dashboard/assessments", icon: <History />, label: "Assessments" },
    { href: "/dashboard/gamification", icon: <Trophy />, label: "Gamification" },
    { href: "/dashboard/job-recommender", icon: <Bot />, label: "AI Job Recommender" },
    { href: "/dashboard/skill-master", icon: <Star />, label: "AI Skill Master" },
    { href: "/dashboard/learning", icon: <BookOpen />, label: "AI Learning" },
  ]

  return (
    <SidebarProvider>
        <Sidebar>
            <div className="flex h-full flex-col">
                <div className="flex items-center justify-between p-2">
                    <div className="flex-1 group-data-[collapsible=icon]:hidden">
                       {/* Placeholder for header content */}
                    </div>
                    <SidebarTrigger />
                </div>
                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col gap-2 p-2">
                        {navItems.map((item) => (
                           <SidebarButton
                                key={item.href}
                                href={item.href}
                                icon={item.icon}
                                label={item.label}
                                isActive={pathname === item.href}
                                tooltip={item.label}
                            />
                        ))}
                    </div>
                </div>
                <div className="p-2">
                    <SidebarButton
                        href="/profile"
                        icon={<User />}
                        label="Profile"
                        isActive={pathname === '/profile'}
                        tooltip="Profile"
                    />
                </div>
            </div>
        </Sidebar>
        <SidebarInset>
            {children}
        </SidebarInset>
    </SidebarProvider>
  );
}
