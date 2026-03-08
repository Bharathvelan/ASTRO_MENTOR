'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEditorStore } from '@/lib/stores/editor-store';
import { Save, Code2, CheckCircle, X, ChevronDown, Type } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  onSave?: () => void;
  onFormat?: () => void;
  onVerify?: () => void;
  className?: string;
}

interface OpenFile {
  id: string;
  name: string;
  path: string;
  isDirty: boolean;
}

export function EditorToolbar({
  onSave,
  onFormat,
  onVerify,
  className,
}: EditorToolbarProps) {
  const { isDirty } = useEditorStore();
  const [fontSize, setFontSize] = useState(14);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([
    { id: '1', name: 'example.ts', path: '/example.ts', isDirty: false },
  ]);
  const [activeFileId, setActiveFileId] = useState('1');

  const fontSizes = [12, 13, 14, 15, 16, 17, 18, 19, 20];

  const handleCloseFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenFiles((files) => files.filter((f) => f.id !== fileId));
    if (activeFileId === fileId && openFiles.length > 1) {
      const index = openFiles.findIndex((f) => f.id === fileId);
      const nextFile = openFiles[index + 1] || openFiles[index - 1];
      if (nextFile) {
        setActiveFileId(nextFile.id);
      }
    }
  };

  return (
    <div className={cn('flex items-center justify-between border-b bg-background', className)}>
      {/* File Tabs */}
      <div className="flex items-center overflow-x-auto">
        {openFiles.map((file) => (
          <button
            key={file.id}
            onClick={() => setActiveFileId(file.id)}
            className={cn(
              'group flex items-center gap-2 border-r px-4 py-2 text-sm transition-colors',
              activeFileId === file.id
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/50'
            )}
          >
            <span className="max-w-[150px] truncate md:max-w-[200px]">
              {file.name}
            </span>
            {file.isDirty && (
              <span className="h-2 w-2 rounded-full bg-primary" title="Unsaved changes" />
            )}
            <button
              onClick={(e) => handleCloseFile(file.id, e)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Close file"
            >
              <X className="h-3 w-3" />
            </button>
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 px-2">
        {/* Save Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onSave}
          disabled={!isDirty}
          className="gap-2"
          title="Save (Ctrl+S)"
        >
          <Save className="h-4 w-4" />
          <span className="hidden md:inline">Save</span>
        </Button>

        {/* Format Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onFormat}
          className="gap-2"
          title="Format Code (Shift+Alt+F)"
        >
          <Code2 className="h-4 w-4" />
          <span className="hidden md:inline">Format</span>
        </Button>

        {/* Verify Button */}
        <Button
          size="sm"
          variant="ghost"
          onClick={onVerify}
          className="gap-2"
          title="Verify Code"
        >
          <CheckCircle className="h-4 w-4" />
          <span className="hidden md:inline">Verify</span>
        </Button>

        {/* Font Size Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="ghost" className="gap-1" title="Font Size">
              <Type className="h-4 w-4" />
              <span className="hidden text-xs md:inline">{fontSize}px</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {fontSizes.map((size) => (
              <DropdownMenuItem
                key={size}
                onClick={() => setFontSize(size)}
                className={cn(
                  'cursor-pointer',
                  fontSize === size && 'bg-accent'
                )}
              >
                {size}px
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
