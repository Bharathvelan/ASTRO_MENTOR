'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Code2, Database, Globe, Layers, Cpu, BarChart2, Braces, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

const TOPICS = [
  {
    id: 'dsa',
    title: 'Data Structures & Algorithms',
    description: 'Arrays, linked lists, trees, graphs, sorting, searching, dynamic programming, and more.',
    icon: Layers,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    level: 'Intermediate',
    progress: 68,
    challengeCount: 42,
    href: '/dashboard/challenges?topic=dsa',
  },
  {
    id: 'python',
    title: 'Python Mastery',
    description: 'From core syntax to advanced features: decorators, generators, async/await, metaclasses.',
    icon: Code2,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    level: 'Beginner',
    progress: 85,
    challengeCount: 36,
    href: '/dashboard/challenges?language=python',
  },
  {
    id: 'javascript',
    title: 'JavaScript & TypeScript',
    description: 'ES6+, closures, prototypes, event loop, Promises, async/await, and the TypeScript type system.',
    icon: Braces,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    level: 'Intermediate',
    progress: 52,
    challengeCount: 30,
    href: '/dashboard/challenges?language=javascript',
  },
  {
    id: 'system-design',
    title: 'System Design',
    description: 'Scalability, load balancing, caching, databases, microservices, and distributed systems principles.',
    icon: Globe,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    level: 'Advanced',
    progress: 30,
    challengeCount: 18,
    href: '/dashboard/challenges?topic=system-design',
  },
  {
    id: 'databases',
    title: 'Databases & SQL',
    description: 'Relational databases, query optimization, indexing, NoSQL patterns, and ACID properties.',
    icon: Database,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    level: 'Intermediate',
    progress: 44,
    challengeCount: 24,
    href: '/dashboard/challenges?topic=databases',
  },
  {
    id: 'ml',
    title: 'Machine Learning',
    description: 'Supervised/unsupervised learning, neural networks, model evaluation, and practical ML pipelines.',
    icon: Cpu,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    level: 'Advanced',
    progress: 15,
    challengeCount: 20,
    href: '/dashboard/challenges?topic=ml',
  },
  {
    id: 'react',
    title: 'React & Frontend',
    description: 'Components, hooks, state management, performance optimization, and Next.js fundamentals.',
    icon: Zap,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    level: 'Intermediate',
    progress: 60,
    challengeCount: 28,
    href: '/dashboard/challenges?topic=react',
  },
  {
    id: 'data-analysis',
    title: 'Data Analysis',
    description: 'Statistics, pandas, numpy, data cleaning, visualization, and exploratory data analysis.',
    icon: BarChart2,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    level: 'Beginner',
    progress: 40,
    challengeCount: 22,
    href: '/dashboard/challenges?topic=data-analysis',
  },
];

const LEVEL_COLORS: Record<string, string> = {
  Beginner: 'bg-green-500/10 text-green-700 border-green-500/30',
  Intermediate: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
  Advanced: 'bg-red-500/10 text-red-700 border-red-500/30',
};

export default function LearnPage() {
  return (
    <div className="container mx-auto p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight flex items-center gap-2">
            <BookOpen className="h-8 w-8 text-primary" />
            Learning Hub
          </h1>
          <p className="text-muted-foreground mt-1 max-w-xl">
            AI-curated learning tracks powered by IRT adaptivity. Pick a topic and the system will calibrate challenges to your exact skill level.
          </p>
        </div>
        <Link href="/dashboard/challenges">
          <Button variant="outline" className="gap-2 shrink-0">
            Browse All Challenges <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Stats summary */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
          <Layers className="w-3.5 h-3.5" />
          {TOPICS.length} Topic Tracks
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
          <Code2 className="w-3.5 h-3.5" />
          {TOPICS.reduce((a, t) => a + t.challengeCount, 0)}+ Challenges
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          IRT Adaptive
        </Badge>
      </div>

      {/* Topic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {TOPICS.map((topic) => {
          const Icon = topic.icon;
          return (
            <Link key={topic.id} href={topic.href}>
              <Card className="group h-full cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-200 bg-card/60 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader className="pb-3 relative z-10">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`p-2.5 rounded-xl ${topic.bg} shrink-0`}>
                      <Icon className={`w-5 h-5 ${topic.color}`} />
                    </div>
                    <Badge className={`border text-xs shrink-0 ${LEVEL_COLORS[topic.level]}`}>
                      {topic.level}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-semibold mt-3 group-hover:text-primary transition-colors">
                    {topic.title}
                  </CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {topic.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{topic.progress}%</span>
                    </div>
                    <Progress value={topic.progress} className="h-1.5" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{topic.challengeCount} challenges</span>
                    <span className="text-xs text-primary font-medium group-hover:underline flex items-center gap-1">
                      Start Learning <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
