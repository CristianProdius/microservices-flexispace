"use client";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface ChartDataItem {
  month: string;
  total: number;
  successful: number;
}

const chartConfig = {
  total: {
    label: "Total",
    color: "var(--chart-1)",
  },
  successful: {
    label: "Successful",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const AppBarChart = ({
  data: chartData = [],
}: {
  data?: ChartDataItem[];
}) => {
  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Booking Revenue</h1>
      {chartData.length === 0 ? (
        <div className="min-h-[200px] flex items-center justify-center text-gray-400">
          No data available
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis tickLine={false} tickMargin={10} axisLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            <Bar dataKey="successful" fill="var(--color-successful)" radius={4} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
};

export default AppBarChart;
