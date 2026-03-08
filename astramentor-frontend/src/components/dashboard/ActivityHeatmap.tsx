import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function ActivityHeatmap() {
  const weeks = 52;
  const days = 7;
  // Generate deterministic-looking random data for visual mock
  const data = Array.from({ length: weeks * days }, (_, i) => {
    // Make weekends generally less active, and some random spikes
    const isWeekend = (i % 7) === 0 || (i % 7) === 6;
    const base = isWeekend ? 0 : 1;
    const random = Math.floor(Math.random() * 10);
    if (random > 8) return 4;
    if (random > 6) return 3;
    if (random > 4) return 2;
    if (random > 2) return 1;
    return base;
  });

  const getColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-muted/30';
      case 1: return 'bg-primary/20';
      case 2: return 'bg-primary/40';
      case 3: return 'bg-primary/70';
      case 4: return 'bg-primary';
      default: return 'bg-muted/30';
    }
  };

  return (
    <Card className="col-span-1 border-0 shadow-none bg-transparent">
      <CardHeader>
        <CardTitle>Daily Activity Heatmap</CardTitle>
        <CardDescription>Your coding activity over the past year.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-primary/10">
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {Array.from({ length: days }).map((_, dayIndex) => {
                const dayData = data[weekIndex * days + dayIndex];
                return (
                  <div
                    key={dayIndex}
                    className={`w-3.5 h-3.5 rounded-[2px] ${getColor(dayData)} transition-colors hover:ring-2 hover:ring-primary/50 cursor-pointer`}
                    title={`Activity level: ${dayData}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground mr-4">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div key={level} className={`w-3 h-3 rounded-[2px] ${getColor(level)}`} />
            ))}
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
