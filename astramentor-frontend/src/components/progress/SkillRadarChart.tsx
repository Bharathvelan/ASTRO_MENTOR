'use client';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { subject: 'Algorithms', A: 80, fullMark: 100 },
  { subject: 'System Design', A: 50, fullMark: 100 },
  { subject: 'Clean Code', A: 90, fullMark: 100 },
  { subject: 'DevOps', A: 40, fullMark: 100 },
  { subject: 'Testing', A: 70, fullMark: 100 },
  { subject: 'Database', A: 65, fullMark: 100 },
];

export function SkillRadarChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Skill Breakdown</CardTitle>
        <CardDescription>Your mastery across different software engineering domains</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid className="stroke-muted" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'currentColor', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
              itemStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Radar
              name="Mastery"
              dataKey="A"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.4}
            />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
