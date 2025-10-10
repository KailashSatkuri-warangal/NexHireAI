"use client"

import { Bar, BarChart, CartesianGrid, XAxis, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart"
import type { Skill } from "@/lib/types";

const chartConfig: ChartConfig = {
  score: {
    label: "Score",
    color: "hsl(var(--primary))",
  },
  count: {
    label: "Count",
    color: "hsl(var(--primary))",
  }
} satisfies ChartConfig

export function SkillProficiencyChart({ data }: { data: Skill[] }) {
  return (
    <div className="w-full h-64">
      <ChartContainer config={chartConfig} className="w-full h-full">
        <RadarChart data={data}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
          <PolarGrid />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar dataKey="score" fill="hsl(var(--primary))" fillOpacity={0.6} stroke="hsl(var(--primary))" />
        </RadarChart>
      </ChartContainer>
    </div>
  )
}

export function SkillDistributionChart({ data }: { data: { name: string; count: number }[] }) {
    return (
      <div className="w-full h-64">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart data={data} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={4} />
          </BarChart>
        </ChartContainer>
      </div>
    )
  }
