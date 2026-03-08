'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { ActivityHeatmap } from '@/components/dashboard/ActivityHeatmap';
import { SkillRadarChart } from '@/components/dashboard/SkillRadarChart';
import { TimeAllocationPie } from '@/components/dashboard/TimeAllocationPie';
import { TopicsDoughnut } from '@/components/dashboard/TopicsDoughnut';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Code2, Target, Zap, Clock, Trophy, Flame,
  ArrowRight, Bot, BookOpen, Shield, Play, Star, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { challengesApi, progressApi, type ProgressStats } from '@/lib/api/services';

// Animated count-up hook
function useCountUp(target: number, duration = 1200, enabled = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || target === 0) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, enabled]);
  return count;
}

const QUICK_ACTIONS = [
  { label: 'AI Playground', desc: 'Run code in any language', href: '/dashboard/playground', icon: Play, color: 'text-violet-500', bg: 'bg-violet-500/10' },
  { label: 'Challenges', desc: 'Solve adaptive problems', href: '/dashboard/challenges', icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  { label: 'AI Reviewer', desc: 'Get a code quality report', href: '/dashboard/review', icon: Shield, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'AI Tutor', desc: 'Ask anything, learn faster', href: '/dashboard/workspace', icon: Bot, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'Learning Hub', desc: 'Structured topic tracks', href: '/dashboard/learn', icon: BookOpen, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { label: 'Repository Intel', desc: 'Chat with your codebase', href: '/dashboard/repository', icon: Code2, color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

const RECENT_ACTIVITY = [
  { text: 'Completed "Two Sum" challenge', time: '2 hours ago', color: 'bg-violet-500' },
  { text: 'Reviewed React Hooks code', time: '5 hours ago', color: 'bg-emerald-500' },
  { text: 'Asked AI Tutor about Graph traversals', time: '1 day ago', color: 'bg-blue-500' },
  { text: 'Mastered Dynamic Programming topic', time: '2 days ago', color: 'bg-orange-500' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [loadingStats, setLoadingStats] = useState(true);
  const [liveStats, setLiveStats] = useState<ProgressStats | null>(null);
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const fetchStats = useCallback(async () => {
    try {
      const [challenges, stats] = await Promise.allSettled([
        challengesApi.list().catch(() => []),
        progressApi.getStats(),
      ]);
      if (challenges.status === 'fulfilled') setTotalChallenges(challenges.value.length);
      if (stats.status === 'fulfilled') setLiveStats(stats.value);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { if (mounted) fetchStats(); }, [mounted, fetchStats]);

  useEffect(() => {
    if (!mounted) return;
    
    // Connect to WebSocket for live stats updates
    const wsUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
      .replace('http', 'ws') + '/api/v1/progress/ws/stats';
      
    let ws: WebSocket;
    
    try {
      ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setWsConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'stats_update' && data.data) {
            setLiveStats(prev => ({ ...prev, ...data.data }));
          }
        } catch (e) {
          console.error('Error parsing WS message', e);
        }
      };
      
      ws.onclose = () => {
        setWsConnected(false);
      };
    } catch (e) {
      console.error('Failed to connect to stats websocket', e);
    }
    
    return () => {
      if (ws) ws.close();
    };
  }, [mounted]);

  // Use live data when available, fall back to demo values
  const streakTarget = liveStats?.streak_days ?? 12;
  const levelTarget = liveStats?.level ?? 3;
  const challengeTarget = liveStats?.challenges_solved ?? 14;
  const xpTarget = liveStats?.total_xp ?? 1250;

  const streakCount = useCountUp(streakTarget, 800, mounted);
  const levelCount = useCountUp(levelTarget, 1000, mounted);
  const challengeCount = useCountUp(challengeTarget, 900, mounted);
  const xpCount = useCountUp(xpTarget, 1200, mounted);

  const levelName = liveStats?.level_name ?? 'Algorithm Apprentice';
  const progressPct = liveStats?.progress_percent ?? 62;
  const xpForNext = liveStats?.xp_for_next_level ?? 900;
  const badges = liveStats?.badges ?? [];

  const stats = [
    { title: 'Challenges Solved', value: String(challengeCount), icon: Code2, color: 'text-violet-500', bg: 'bg-violet-500/10' },
    { title: 'Current Streak', value: `${streakCount} Days`, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Mastery Level', value: `Lv ${levelCount}`, icon: Trophy, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { title: 'Total XP', value: xpCount.toLocaleString(), icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
  ];

  if (!mounted) return null;

  return (
    <div className="container p-6 lg:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-700">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome back, {user?.name?.split(' ')[0] || 'Developer'}!
          </h1>
          <p className="text-muted-foreground text-lg mt-1">
            Your AI-powered adaptive learning dashboard.&nbsp;
            {!loadingStats && totalChallenges > 0 && (
              <span className="text-primary font-medium">{totalChallenges} challenges available.</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loadingStats && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          {wsConnected && (
            <span className="flex h-2 w-2 relative" title="Live updates active">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
          )}
          <Badge variant="secondary" className="flex items-center gap-1.5 px-3 py-1.5 text-sm shrink-0">
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            IRT Adaptive Engine Active
          </Badge>
        </div>
      </div>

      {/* Level & XP Progress Bar */}
      <Card className="border-primary/10 bg-gradient-to-br from-primary/5 to-transparent">
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-bold text-base">Level {levelCount} — {levelName}</span>
            </div>
            <span className="text-sm text-muted-foreground font-mono">{xpCount.toLocaleString()} / {xpForNext.toLocaleString()} XP</span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
          <p className="text-xs text-muted-foreground mt-1.5">{progressPct}% to Level {levelCount + 1}</p>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-primary/5 shadow-md shadow-primary/5 hover:shadow-lg transition-all duration-300 backdrop-blur-xl bg-card/60 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-3xl font-extrabold tabular-nums">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">Powered by AI adaptive learning</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div>
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            Your Achievements
          </h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary" className="gap-1.5 text-xs px-3 py-1">
                🏅 {badge}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Card className="group h-full cursor-pointer hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-card/60 backdrop-blur-sm">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${action.bg} shrink-0`}>
                      <Icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors">{action.label}</div>
                      <div className="text-xs text-muted-foreground">{action.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 shadow-xl shadow-primary/5 rounded-2xl border border-primary/10 overflow-hidden bg-card/40 backdrop-blur-sm">
          <ActivityHeatmap />
        </div>
        <div className="lg:col-span-1 shadow-xl shadow-primary/5 rounded-2xl border border-primary/10 overflow-hidden bg-card/40 backdrop-blur-sm">
          <SkillRadarChart />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="shadow-xl shadow-primary/5 rounded-2xl border border-primary/10 overflow-hidden bg-card/40 backdrop-blur-sm">
          <TimeAllocationPie />
        </div>
        <div className="shadow-xl shadow-primary/5 rounded-2xl border border-primary/10 overflow-hidden bg-card/40 backdrop-blur-sm">
          <TopicsDoughnut />
        </div>
        {/* Recent Activity */}
        <Card className="border-primary/10 shadow-xl shadow-primary/5 backdrop-blur-xl bg-card/60 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-primary" asChild>
              <Link href="/dashboard/sessions">View all <ArrowRight className="w-3 h-3 ml-1 inline" /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-5">
              {RECENT_ACTIVITY.map((act, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full ${act.color} shadow-sm shrink-0`} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium leading-snug">{act.text}</span>
                    <span className="text-xs text-muted-foreground">{act.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
