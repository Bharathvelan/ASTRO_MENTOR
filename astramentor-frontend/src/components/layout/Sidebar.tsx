'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, LayoutDashboard, MessageSquare,
  BookOpen, Code2, GitGraph, Settings, Scissors, Clock,
  Play, Trophy, Shield, FolderGit2, Zap, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';
import { progressApi, type ProgressStats } from '@/lib/api/services';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  exact?: boolean;
  badge?: string;
  group?: string;
}

const NAV_ITEMS: NavItem[] = [
  // Core
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true, group: 'core' },
  { label: 'Workspace', href: '/dashboard/workspace', icon: MessageSquare, group: 'core' },

  // AI Tools
  { label: 'AI Playground', href: '/dashboard/playground', icon: Play, badge: 'AI', group: 'tools' },
  { label: 'Challenges', href: '/dashboard/challenges', icon: Trophy, badge: 'IRT', group: 'tools' },
  { label: 'Code Review', href: '/dashboard/review', icon: Shield, group: 'tools' },
  { label: 'Repository', href: '/dashboard/repository', icon: FolderGit2, group: 'tools' },
  { label: 'Code Graph', href: '/dashboard/graph', icon: GitGraph, group: 'tools' },

  // Learning
  { label: 'Learning Hub', href: '/dashboard/learn', icon: BookOpen, group: 'learn' },
  { label: 'Snippets', href: '/dashboard/snippets', icon: Scissors, group: 'learn' },
  { label: 'Sessions', href: '/dashboard/sessions', icon: Clock, group: 'learn' },

  // Config
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, group: 'config' },
];

const GROUP_LABELS: Record<string, string> = {
  core: '',
  tools: 'AI Tools',
  learn: 'Learning',
  config: '',
};

const OFFLINE_STATS: ProgressStats = {
  user_id: 'dev-user',
  total_xp: 1250,
  level: 3,
  level_name: 'Algorithm Apprentice',
  xp_for_next_level: 900,
  progress_percent: 62,
  challenges_solved: 14,
  streak_days: 5,
  accuracy_rate: 0.72,
  badges: ['First Challenge', '3-Day Streak'],
};

function useProgressStats() {
  const [stats, setStats] = React.useState<ProgressStats | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout

    progressApi.getStats()
      .then((data) => { if (!cancelled) setStats(data); })
      .catch(() => { if (!cancelled) setStats(OFFLINE_STATS); })
      .finally(() => clearTimeout(timeout));

    return () => { cancelled = true; clearTimeout(timeout); };
  }, []);

  return stats;
}

export function Sidebar({ className }: SidebarProps) {
  const { panelVisibility, togglePanel } = useUIStore();
  const pathname = usePathname();
  const isCollapsed = !panelVisibility.sidebar;
  const stats = useProgressStats();

  // Group items
  const groups = NAV_ITEMS.reduce((acc, item) => {
    const g = item.group ?? 'core';
    if (!acc[g]) acc[g] = [];
    acc[g].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  const xp = stats?.total_xp ?? null;
  const level = stats?.level ?? null;
  const levelName = stats?.level_name ?? 'Loading…';
  const progressPct = stats?.progress_percent ?? 0;

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r bg-background transition-all duration-300 flex-shrink-0',
        isCollapsed ? 'w-12' : 'w-56',
        className
      )}
    >
      {/* Collapse Button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute -right-3 top-4 z-10 h-6 w-6 rounded-full border bg-background p-0 shadow-sm"
        onClick={() => togglePanel('sidebar')}
      >
        {isCollapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col overflow-y-auto py-3 px-2 space-y-1">
        {Object.entries(groups).map(([groupKey, items], gi) => (
          <div key={groupKey}>
            {gi > 0 && !isCollapsed && GROUP_LABELS[groupKey] && (
              <div className="px-2 pt-3 pb-1">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {GROUP_LABELS[groupKey]}
                </p>
              </div>
            )}
            {gi > 0 && isCollapsed && <div className="my-1 border-t border-muted/50" />}
            {items.map((item) => {
              const isActive = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={cn(
                      'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1 py-0">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: Live XP widget */}
      {!isCollapsed && (
        <div className="border-t p-3">
          {stats === null ? (
            <div className="flex items-center gap-2 px-1 py-1 rounded-md bg-muted/50 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span className="text-xs">Loading XP…</span>
            </div>
          ) : (
            <div className="px-1 py-1 rounded-md bg-muted/50 space-y-1.5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{xp?.toLocaleString()} XP</span>
                    <span className="text-[10px] text-muted-foreground">Lv {level}</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">{levelName}</div>
                </div>
              </div>
              {/* XP progress bar */}
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="text-[9px] text-muted-foreground text-right">
                {progressPct}% to next level
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed: tiny XP indicator */}
      {isCollapsed && xp !== null && (
        <div className="border-t p-2 flex justify-center">
          <span title={`${xp} XP — Level ${level}`}>
            <Zap className="h-4 w-4 text-yellow-500" />
          </span>
        </div>
      )}

    </aside>
  );
}
