
'use client';

import Link from "next/link";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

interface SidebarButtonProps {
    href: string;
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    tooltip: string;
}

export const SidebarButton = ({ href, icon, label, isActive, tooltip }: SidebarButtonProps) => {
    const { isHovering, state } = useSidebar();
    const isExpanded = state === 'expanded' || isHovering;

    return (
        <SidebarMenuButton
            asChild
            isActive={isActive}
            tooltip={{
                children: tooltip,
                side: "right",
                className: "bg-card border-border/80 shadow-lg",
            }}
        >
            <Link href={href}>
                {icon}
                <span className={isExpanded ? 'opacity-100' : 'opacity-0'}>{label}</span>
            </Link>
        </SidebarMenuButton>
    );
};
