'use client';

/**
 * ProgressDashboard Component
 * 
 * Displays a visual dashboard showing learning milestones and achievements
 * Features:
 * - Milestone and achievement display
 * - Time range selector (week/month/all)
 * - Dark/light theme support
 * - Responsive layout
 * 
 * Requirements: 1.2, 9.3, 9.6
 */

import { useState } from 'react';
import { useProgressStore } from '@/lib/stores/progress-store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Clock, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkillRadarChart } from './SkillRadarChart';
import { ActivityHeatmap } from './ActivityHeatmap';
import { StreakCalendar } from './StreakCalendar';

// Inline Badge component to avoid import issues
const Badge = ({ 
  children, 
  variant = 'default',
  className 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  className?: string;
}) => {
  const variants = {
    default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
    secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
    destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
    outline: 'text-foreground',
  };
  
  return (
    <div className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
      variants[variant],
      className
    )}>
      {children}
    </div>
  );
};

type TimeRange = 'week' | 'month' | 'all';

export function ProgressDashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('week');
  const {
    currentProgress,
    milestones,
    masteryLevels,
    generateReport,
    isLoading,
    error,
  } = useProgressStore();

  const report = generateReport(timeRange);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading progress...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  if (!currentProgress) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">No progress data available</div>
      </div>
    );
  }

  const completedCount = currentProgress.completedTopics.length;
  const inProgressCount = currentProgress.inProgressTopics.length;
  const achievementCount = currentProgress.achievements.length;
  const totalTimeHours = Math.floor(currentProgress.totalTimeSpent / 60);
  const totalTimeMinutes = currentProgress.totalTimeSpent % 60;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="week">This Week</TabsTrigger>
          <TabsTrigger value="month">This Month</TabsTrigger>
          <TabsTrigger value="all">All Time</TabsTrigger>
        </TabsList>

        <TabsContent value={timeRange} className="space-y-6 mt-6">
          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Topics</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{completedCount}</div>
                <p className="text-xs text-muted-foreground">
                  {inProgressCount} in progress
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalTimeHours}h {totalTimeMinutes}m
                </div>
                <p className="text-xs text-muted-foreground">
                  {report ? `${Math.floor(report.totalTimeSpent / 60)}h this ${timeRange}` : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{achievementCount}</div>
                <p className="text-xs text-muted-foreground">
                  {report ? `${report.achievements.length} this ${timeRange}` : ''}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Mastery</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {masteryLevels.size > 0
                    ? Math.round(
                        Array.from(masteryLevels.values()).reduce((a, b) => a + b, 0) /
                          masteryLevels.size
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  Across {masteryLevels.size} languages
                </p>
              </CardContent>
            </Card>
          </div>

          {/* New Advanced Visualizations Row */}
          <div className="grid gap-6 md:grid-cols-7">
            <div className="md:col-span-4 space-y-6">
              <ActivityHeatmap />
              <SkillRadarChart />
            </div>
            <div className="md:col-span-3 space-y-6">
              <StreakCalendar />
              
              {/* Milestones Card Moved Here */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Milestones</CardTitle>
                  <CardDescription>
                    Your learning achievements and milestones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {milestones.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No milestones yet. Keep learning to unlock achievements!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {milestones.slice(0, 5).map((milestone) => (
                        <div
                          key={milestone.id}
                          className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-none">
                              {milestone.title}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {milestone.description}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(milestone.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="secondary">{milestone.category}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Achievements</CardTitle>
              <CardDescription>
                Badges and awards you've earned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {currentProgress.achievements.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No achievements yet. Complete challenges to earn badges!
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {currentProgress.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={cn(
                        'flex flex-col items-center space-y-2 rounded-lg border p-4',
                        'hover:bg-accent hover:scale-105 transition-all duration-300 hover:shadow-lg cursor-default group'
                      )}
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary/20 group-hover:rotate-12 transition-transform duration-300 shadow-inner">
                        <Trophy className="h-6 w-6 text-primary group-hover:scale-110 group-hover:drop-shadow-md transition-all duration-300" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">{achievement.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {achievement.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {achievement.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
