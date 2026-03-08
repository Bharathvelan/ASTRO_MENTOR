'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Star, Zap, Award } from 'lucide-react';

export function StreakCalendar() {
  return (
    <Card className="h-full bg-gradient-to-br from-card to-primary/5 border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 border-l border-b bg-primary/10 rounded-bl-[100px] opacity-20 pointer-events-none">
        <Star className="w-32 h-32 text-primary" />
      </div>

      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
          Learning Streak
        </CardTitle>
        <CardDescription>Keep up the momentum to earn XP multipliers!</CardDescription>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 my-2">
              <span className="text-5xl font-black text-foreground drop-shadow-sm">12</span>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest text-orange-500">Day Streak</p>
            </div>
            <div className="flex gap-2 bg-background/40 p-2 rounded-xl border shadow-sm backdrop-blur-sm">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <span className="text-[10px] text-muted-foreground font-bold uppercase">{'SMTWTFS'[i]}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-inner ${i < 5 ? 'bg-gradient-to-tr from-orange-400 to-yellow-400 text-white' : 'bg-muted/50 text-muted-foreground border border-border/50'}`}>
                    {i < 5 ? <Flame className="w-4 h-4 fill-current drop-shadow-sm" /> : <div className="w-2 h-2 rounded-full bg-current opacity-30" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
            <div className="flex flex-col gap-1 bg-background/60 p-4 rounded-xl border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <Zap className="w-4 h-4 fill-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Total XP</span>
              </div>
              <p className="text-2xl font-bold">14,250</p>
            </div>
            <div className="flex flex-col gap-1 bg-background/60 p-4 rounded-xl border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-purple-500 mb-1">
                <Award className="w-4 h-4 fill-purple-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Next Rank</span>
              </div>
              <p className="text-2xl font-bold">15,000</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
