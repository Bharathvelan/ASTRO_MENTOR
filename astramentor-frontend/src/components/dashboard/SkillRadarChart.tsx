'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const data = [
  { subject: 'Algorithms', A: 120, fullMark: 150 },
  { subject: 'Data Structures', A: 98, fullMark: 150 },
  { subject: 'System Design', A: 86, fullMark: 150 },
  { subject: 'Clean Code', A: 99, fullMark: 150 },
  { subject: 'Debugging', A: 85, fullMark: 150 },
  { subject: 'Security', A: 65, fullMark: 150 },
];

export function SkillRadarChart() {
  return (
    <Card className="col-span-1 border-0 shadow-none bg-transparent">
      <CardHeader>
        <CardTitle>Skill Dimensions</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
            <PolarGrid stroke="hsl(var(--muted-foreground))" strokeOpacity={0.2} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }} />
            <PolarRadiusAxis angle={30} domain={[0, 150]} tick={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                borderColor: 'hsl(var(--border))', 
                borderRadius: '8px',
                color: 'hsl(var(--foreground))'
              }} 
            />
            <Radar name="Student" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
