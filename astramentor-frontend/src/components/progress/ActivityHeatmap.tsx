'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export function ActivityHeatmap() {
  const weeks = 52;
  const days = 7;
  
  // Generate mock data for demonstration
  const data = useMemo(() => {
    const grid = [];
    for (let w = 0; w < weeks; w++) {
      const week = [];
      for (let d = 0; d < days; d++) {
        // More activity towards recent weeks (right side)
        const activityLvl = Math.random() > (0.8 - (w / weeks) * 0.4) ? Math.floor(Math.random() * 4) + 1 : 0;
        week.push(activityLvl);
      }
      grid.push(week);
    }
    return grid;
  }, []);

  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-muted/30';
      case 1: return 'bg-teal-500/30';
      case 2: return 'bg-teal-500/60';
      case 3: return 'bg-teal-500/80';
      case 4: return 'bg-teal-500';
      default: return 'bg-muted/30';
    }
  };

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
        <CardDescription>Your coding activity over the past year</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-4 scrollbar-thin">
          {data.map((week, i) => (
            <div key={i} className="flex flex-col gap-1">
              {week.map((level, j) => (
                <div
                  key={`${i}-${j}`}
                  className={cn("w-3 h-3 rounded-sm transition-colors duration-300 hover:ring-2 ring-primary/50", getColor(level))}
                  title={`Activity level: ${level}`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mt-2">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-muted/30" />
            <div className="w-3 h-3 rounded-sm bg-teal-500/30" />
            <div className="w-3 h-3 rounded-sm bg-teal-500/60" />
            <div className="w-3 h-3 rounded-sm bg-teal-500/80" />
            <div className="w-3 h-3 rounded-sm bg-teal-500" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
