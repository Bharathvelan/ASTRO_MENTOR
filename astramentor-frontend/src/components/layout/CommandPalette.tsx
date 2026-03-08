'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Plus,
  FileText,
  Settings,
  Moon,
  Sun,
  PanelLeftClose,
  PanelRightClose,
  Code,
} from 'lucide-react';
import { useUIStore } from '@/lib/stores/ui-store';
import { useTheme } from 'next-themes';

interface CommandItemType {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, closeCommandPalette, togglePanel } = useUIStore();
  const { setTheme, theme } = useTheme();
  const [search, setSearch] = React.useState('');

  // Keyboard shortcut listener
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        useUIStore.getState().openCommandPalette();
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const commands: CommandItemType[] = [
    {
      id: 'new-session',
      label: 'New Session',
      description: 'Start a new conversation session',
      icon: <Plus className="h-4 w-4" />,
      shortcut: '⌘N',
      action: () => {
        router.push('/dashboard/workspace?new=true');
        closeCommandPalette();
      },
    },
    {
      id: 'open-file',
      label: 'Open File',
      description: 'Open a file from repository',
      icon: <FileText className="h-4 w-4" />,
      shortcut: '⌘O',
      action: () => {
        // TODO: Implement file picker
        closeCommandPalette();
      },
    },
    {
      id: 'toggle-sidebar',
      label: 'Toggle Sidebar',
      description: 'Show or hide the sidebar',
      icon: <PanelLeftClose className="h-4 w-4" />,
      shortcut: '⌘B',
      action: () => {
        togglePanel('sidebar');
        closeCommandPalette();
      },
    },
    {
      id: 'toggle-chat',
      label: 'Toggle Chat Panel',
      description: 'Show or hide the chat panel',
      icon: <PanelRightClose className="h-4 w-4" />,
      shortcut: '⌘J',
      action: () => {
        togglePanel('chat');
        closeCommandPalette();
      },
    },
    {
      id: 'change-theme',
      label: 'Change Theme',
      description: `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`,
      icon: theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />,
      shortcut: '⌘T',
      action: () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
        closeCommandPalette();
      },
    },
    {
      id: 'verify-code',
      label: 'Verify Code',
      description: 'Run tests and verify code',
      icon: <Code className="h-4 w-4" />,
      shortcut: '⌘⇧V',
      action: () => {
        // TODO: Implement code verification
        closeCommandPalette();
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Open settings page',
      icon: <Settings className="h-4 w-4" />,
      shortcut: '⌘,',
      action: () => {
        router.push('/dashboard/settings');
        closeCommandPalette();
      },
    },
  ];

  // Filter commands based on search
  const filteredCommands = React.useMemo(() => {
    if (!search) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(searchLower) ||
        cmd.description.toLowerCase().includes(searchLower)
    );
  }, [search, commands]);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={closeCommandPalette}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Commands">
          {filteredCommands.map((cmd) => (
            <CommandItem
              key={cmd.id}
              onSelect={cmd.action}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                {cmd.icon}
                <div className="flex flex-col">
                  <span>{cmd.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {cmd.description}
                  </span>
                </div>
              </div>
              {cmd.shortcut && (
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  {cmd.shortcut}
                </kbd>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
