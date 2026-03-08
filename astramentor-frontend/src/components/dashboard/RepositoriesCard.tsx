'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FolderGit2, Upload, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Repository {
  id: string;
  name: string;
  status: 'indexed' | 'indexing' | 'failed';
  fileCount: number;
  lastUpdated: Date;
  size?: string;
}

interface RepositoriesCardProps {
  repositories?: Repository[];
  isLoading?: boolean;
}

const statusConfig = {
  indexed: {
    icon: CheckCircle2,
    label: 'Indexed',
    className: 'text-green-500',
  },
  indexing: {
    icon: Clock,
    label: 'Indexing',
    className: 'text-yellow-500',
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    className: 'text-red-500',
  },
};

export function RepositoriesCard({ repositories = [], isLoading = false }: RepositoriesCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>Your uploaded code repositories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (repositories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>Your uploaded code repositories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FolderGit2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No repositories yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first repository to start analyzing code
            </p>
            <Link href="/workspace">
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Upload Repository
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Repositories</CardTitle>
          <CardDescription>Your uploaded code repositories</CardDescription>
        </div>
        <Link href="/workspace">
          <Button size="sm" variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload New
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {repositories.map((repo) => {
            const StatusIcon = statusConfig[repo.status].icon;
            return (
              <div
                key={repo.id}
                className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
              >
                <FolderGit2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold truncate">{repo.name}</h4>
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <StatusIcon className={`h-4 w-4 ${statusConfig[repo.status].className}`} />
                    <span>{statusConfig[repo.status].label}</span>
                    <span>•</span>
                    <span>{repo.fileCount} files</span>
                    {repo.size && (
                      <>
                        <span>•</span>
                        <span>{repo.size}</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Updated {formatDistanceToNow(repo.lastUpdated, { addSuffix: true })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
