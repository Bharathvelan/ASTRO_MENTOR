'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const data = [
  { name: 'Mastered', value: 45 },
  { name: 'In Progress', value: 25 },
  { name: 'Not Started', value: 30 },
];

const COLORS = ['#10b981', '#f59e0b', '#64748b'];

export function TopicsDoughnut() {
  return (
    <Card className="col-span-1 border-0 shadow-none bg-transparent">
      <CardHeader>
        <CardTitle>Topic Mastery</CardTitle>
        <CardDescription>Your progress across all available topics.</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={90}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={4}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))', 
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }} 
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
