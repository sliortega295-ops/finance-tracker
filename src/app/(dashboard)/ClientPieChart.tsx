"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { PieLabelRenderProps } from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function ClientPieChart({ data }: { data: { name: string, value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
          label={(props: PieLabelRenderProps) => {
            const name = String(props.name ?? "");
            const percent = Number(props.percent ?? 0);
            return percent > 0 ? `${name} ${(percent * 100).toFixed(0)}%` : name;
          }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number | undefined) => value !== undefined ? `¥${value.toFixed(2)}` : '¥0.00'} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}