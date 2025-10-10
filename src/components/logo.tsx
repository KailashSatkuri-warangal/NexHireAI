import { cn } from "@/lib/utils";
import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
      className={cn("text-primary", props.className)}
    >
      <path d="m7 11 2-2-2-2" />
      <path d="m17 11-2 2 2 2" />
      <path d="M14 20v-4.5a2.5 2.5 0 0 0-2.5-2.5h-3A2.5 2.5 0 0 0 6 15.5V20" />
      <path d="M18 20v-8.5a2.5 2.5 0 0 0-2.5-2.5h-3A2.5 2.5 0 0 0 10 11.5V20" />
      <path d="M10 4v4.5A2.5 2.5 0 0 0 12.5 11h3A2.5 2.5 0 0 0 18 8.5V4" />
      <path d="M6 4v8.5A2.5 2.5 0 0 0 8.5 15h3a2.5 2.5 0 0 0 2.5-2.5V4" />
    </svg>
  );
}
