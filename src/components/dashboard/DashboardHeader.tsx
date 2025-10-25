
'use client';

import { SidebarTrigger } from "@/components/ui/sidebar";
import { PanelLeft, User, LayoutDashboard, NotebookPen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from "next/link";
import { ThemeToggle } from "../theme-toggle";

export function DashboardHeader() {
  const { user, isLoading, logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <SidebarTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden">
              <PanelLeft />
            </Button>
        </SidebarTrigger>
        <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
             {isLoading ? (
                <Skeleton className="h-10 w-10 rounded-full" />
            ) : user ? (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                        <AvatarFallback>{user.name ? user.name.charAt(0).toUpperCase() : <User className="h-5 w-5" />}</AvatarFallback>
                    </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                        </p>
                    </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                    <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                    <Link href="/skill-assessment"><NotebookPen className="mr-2 h-4 w-4" />Skill Assessment</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                    <Link href="/profile"><User className="mr-2 h-4 w-4" />Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                    Log out
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            ) : null}
        </div>
    </header>
  );
}
