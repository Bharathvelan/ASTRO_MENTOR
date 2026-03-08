'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { sessionsApi, type Session } from '@/lib/api/services';
import { MessageSquare, Clock, ArrowRight, Trash2, Plus, Bot } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

// ── Mock sessions shown when backend is unreachable ───────────────────────────
const MOCK_SESSIONS: Session[] = [
  {
    session_id: 'sess-demo-001',
    user_id: 'dev-user',
    title: 'Explaining Dynamic Programming concepts',
    message_count: 12,
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
  {
    session_id: 'sess-demo-002',
    user_id: 'dev-user',
    title: 'Debugging React hooks infinite loop',
    message_count: 8,
    updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  },
  {
    session_id: 'sess-demo-003',
    user_id: 'dev-user',
    title: 'Graph traversal BFS vs DFS',
    message_count: 15,
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    session_id: 'sess-demo-004',
    user_id: 'dev-user',
    title: 'Building a REST API with FastAPI',
    message_count: 21,
    updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    session_id: 'sess-demo-005',
    user_id: 'dev-user',
    title: 'SQL queries and JOIN optimization',
    message_count: 6,
    updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];


function SessionSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-border/50 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await sessionsApi.list();
      setSessions(data);
      setUsingMock(false);
    } catch {
      // Backend unavailable → show rich mock data so the page is always usable
      setSessions(MOCK_SESSIONS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (sessionId: string) => {
    try {
      if (!usingMock) await sessionsApi.delete(sessionId);
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    } catch {
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
    }
  };

  return (
    <div className="container mx-auto p-6 lg:p-10 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" />
            Chat Sessions
          </h1>
          <p className="text-muted-foreground mt-1">
            All your conversations with the AI Tutor, stored and searchable.
          </p>
        </div>
        <Link href="/dashboard/workspace">
          <Button className="gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Session
          </Button>
        </Link>
      </div>

      {/* Dev mode / offline notice */}
      {!loading && usingMock && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border/40 rounded-md px-3 py-2 bg-muted/30">
          <Bot className="w-4 h-4 shrink-0 text-primary" />
          <span>
            Backend offline — showing demo sessions. Start the backend to see your real history.
          </span>
        </div>
      )}

      {/* Sessions list */}
      <div className="space-y-3">
        {loading && Array.from({ length: 5 }).map((_, i) => <SessionSkeleton key={i} />)}

        {!loading && sessions.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="p-12 flex flex-col items-center gap-4 text-center">
              <div className="p-4 rounded-2xl bg-primary/10">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">No sessions yet</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start a conversation with your AI Tutor to see it here.
                </p>
              </div>
              <Link href="/dashboard/workspace">
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Start your first session
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!loading && sessions.map((session) => {
          let timeAgo = 'Unknown time';
          try {
            timeAgo = formatDistanceToNow(new Date(session.updated_at), { addSuffix: true });
          } catch { /* skip */ }

          return (
            <Card
              key={session.session_id}
              className="group hover:border-primary/30 hover:shadow-md transition-all duration-200 bg-card/60 backdrop-blur-sm"
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                    {session.title || `Session ${session.session_id.slice(0, 8)}`}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <MessageSquare className="w-3 h-3" />
                      {session.message_count} messages
                    </span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(session.session_id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Link href={`/dashboard/workspace?session=${session.session_id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      Continue <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary badge */}
      {!loading && sessions.length > 0 && (
        <div className="text-center">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Clock className="w-3 h-3" />
            {sessions.length} {usingMock ? 'demo' : 'total'} sessions
          </Badge>
        </div>
      )}
    </div>
  );
}
