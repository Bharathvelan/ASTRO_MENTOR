'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, FolderGit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRepositories } from '@/lib/query/hooks';
import { cn } from '@/lib/utils';

interface RepoSelectorProps {
  currentRepoId?: string;
  onRepoChange?: (repoId: string) => void;
}

/**
 * RepoSelector - Repository selector dropdown for TopBar
 * 
 * Fetches user repositories and displays them in a searchable dropdown.
 * Shows current active repository and allows switching.
 * 
 * Requirements: 2.6
 */
export function RepoSelector({ currentRepoId, onRepoChange }: RepoSelectorProps) {
  const [open, setOpen] = useState(false);
  const { data: repositories, isLoading } = useRepositories();

  const currentRepo = repositories?.find((repo) => repo.id === currentRepoId);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <FolderGit2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {isLoading
                ? 'Loading...'
                : currentRepo
                ? currentRepo.name
                : 'Select repository'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 flex-shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search repositories..." />
          <CommandEmpty>No repository found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {repositories?.map((repo) => (
              <CommandItem
                key={repo.id}
                value={repo.name}
                onSelect={() => {
                  if (repo.id) {
                    onRepoChange?.(repo.id);
                  }
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    currentRepoId === repo.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                <div className="flex-1 truncate">
                  <div className="font-medium">{repo.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {repo.status === 'indexing' && 'Indexing...'}
                    {repo.status === 'completed' && `${repo.fileCount || 0} files`}
                    {repo.status === 'failed' && 'Failed'}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
