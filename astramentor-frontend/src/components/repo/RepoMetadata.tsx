'use client';

import { FileCode, HardDrive, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { components } from '@/types/api.generated';

type Repository = components['schemas']['Repository'];

interface RepoMetadataProps {
  repository: Repository;
}

/**
 * RepoMetadata - Displays repository metadata
 * 
 * Shows file count, total size, and last indexed timestamp.
 * 
 * Requirements: 2.7
 */
export function RepoMetadata({ repository }: RepoMetadataProps) {
  const formatSize = (bytes?: number) => {
    if (!bytes) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <h3 className="font-semibold">{repository.name}</h3>
        
        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-2">
            <FileCode className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Files:</span>
            <span className="font-medium">{repository.fileCount || 0}</span>
          </div>

          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Size:</span>
            <span className="font-medium">{formatSize(repository.totalSize)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Last indexed:</span>
            <span className="font-medium">{formatDate(repository.lastIndexed)}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
