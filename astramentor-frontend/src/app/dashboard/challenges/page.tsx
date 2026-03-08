'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { challengesApi, leaderboardApi, type Challenge, type LeaderboardEntry, type ChallengeDifficulty } from '@/lib/api/services';
import { Trophy, Code2, Clock, Star, Search, Filter, ArrowRight, Zap, Target, Medal } from 'lucide-react';

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');

  useEffect(() => {
    async function loadData() {
      try {
        const [chals, board] = await Promise.all([
          challengesApi.list(),
          leaderboardApi.get(5)
        ]);
        setChallenges(chals);
        setLeaderboard(board);
      } catch (err) {
        console.error('Failed to load challenges:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Extract unique topics for filter
  const topics = Array.from(new Set(challenges.map(c => c.topic)));

  // Filter challenges
  const filteredChallenges = challenges.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || c.difficulty === difficultyFilter;
    const matchesTopic = topicFilter === 'all' || c.topic === topicFilter;
    return matchesSearch && matchesDifficulty && matchesTopic;
  });

  const getDifficultyColor = (diff: ChallengeDifficulty) => {
    switch(diff) {
      case 'beginner': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'intermediate': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'advanced': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getLanguageIcon = (lang: string) => {
    switch(lang.toLowerCase()) {
      case 'python': return '🐍';
      case 'javascript': return '🟨';
      case 'typescript': return '🔷';
      default: return '💻';
    }
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-2">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Smart Code Challenges
          </h1>
          <p className="text-muted-foreground mt-1">
            Test your skills with adaptive coding problems and climb the national leaderboard.
          </p>
        </div>
        <div className="bg-card border rounded-lg p-3 flex items-center gap-4 shadow-sm">
          <div className="flex flex-col items-center px-4 border-r">
            <span className="text-2xl font-bold text-yellow-500">1,250</span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Your XP</span>
          </div>
          <div className="flex flex-col items-center px-4">
            <span className="text-2xl font-bold text-blue-500 flex items-center gap-1">
              <Medal className="h-5 w-5" /> 4th
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Global Rank</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Main Content - Challenges List */}
        <div className="lg:col-span-3 space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search challenges..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background"
              />
            </div>
            <div className="flex gap-2">
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-[140px] bg-background">
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={topicFilter} onValueChange={setTopicFilter}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Topics</SelectItem>
                  {topics.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Challenges Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-[200px] rounded-xl border bg-card/50 animate-pulse"></div>
              ))}
            </div>
          ) : filteredChallenges.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-dashed">
              <Code2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <h3 className="text-lg font-medium">No challenges found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search query.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => { setSearchQuery(''); setDifficultyFilter('all'); setTopicFilter('all'); }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredChallenges.map(challenge => (
                <Card key={challenge.id} className="group hover:border-primary/50 transition-all hover:shadow-md flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                        {challenge.difficulty}
                      </Badge>
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <span title={challenge.language}>{getLanguageIcon(challenge.language)}</span>
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium">{challenge.xp_reward} XP</span>
                        </div>
                      </div>
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                      {challenge.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-1">
                      {challenge.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="mt-auto">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        {challenge.topic}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {challenge.time_limit_minutes}m
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <Link href={`/dashboard/challenges/${challenge.id}`} className="w-full">
                      <Button className="w-full group-hover:bg-primary" variant="secondary">
                        Solve Challenge
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar - Leaderboard & Stats */}
        <div className="space-y-6">
          <Card className="border-primary/20 shadow-lg shadow-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Global Top 5
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-4 items-center">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
                      <div className="h-4 w-full bg-muted animate-pulse rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry, i) => (
                    <div key={entry.rank} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm
                          ${i === 0 ? 'bg-yellow-500/20 text-yellow-600' : 
                            i === 1 ? 'bg-gray-300/20 text-gray-400' : 
                            i === 2 ? 'bg-amber-700/20 text-amber-600' : 
                            'bg-muted text-muted-foreground'}`
                        }>
                          {entry.rank}
                        </div>
                        <div className="flex flex-col">
                          <span className={`font-medium ${entry.username === 'You' ? 'text-primary' : ''}`}>
                            {entry.username}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-muted-foreground flex items-center gap-1">
                        {entry.score} <Zap className="h-3 w-3 text-yellow-500" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="pt-0">
              <Button variant="ghost" className="w-full text-xs text-muted-foreground">
                View Full Leaderboard
              </Button>
            </CardFooter>
          </Card>
          
          <Card className="bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">Weekly Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Solve 5 Challenges</span>
                  <span className="text-primary">2/5</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-[40%] rounded-full"></div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Solve 3 more challenges this week to maintain your streak and earn a bonus 100 XP!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
