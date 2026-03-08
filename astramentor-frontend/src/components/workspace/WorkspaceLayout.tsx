'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import { Sidebar } from '@/components/layout/Sidebar';
import { CodeEditor } from '@/components/editor/CodeEditor';
import { EditorToolbar } from '@/components/editor/EditorToolbar';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MOBILE_BREAKPOINT = 1024;

export function WorkspaceLayout() {
  const { panelSizes, panelVisibility, setPanelSize } = useUIStore();
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState('editor');
  
  // Store previous panel sizes for restoration when expanding
  const previousSizesRef = useRef({
    sidebar: panelSizes.sidebar,
    chat: panelSizes.chat,
  });

  // Update previous sizes when panels are visible
  useEffect(() => {
    if (panelVisibility.sidebar) {
      previousSizesRef.current.sidebar = panelSizes.sidebar;
    }
    if (panelVisibility.chat) {
      previousSizesRef.current.chat = panelSizes.chat;
    }
  }, [panelSizes, panelVisibility]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle panel resize
  const handlePanelResize = (panelId: string, size: number) => {
    setPanelSize(panelId as 'sidebar' | 'editor' | 'chat', size);
  };

  // Mobile tabbed interface
  if (isMobile) {
    return (
      <div className="flex h-full flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="editor" className="flex-1">
              Editor
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex-1">
              Chat
            </TabsTrigger>
            <TabsTrigger value="files" className="flex-1">
              Files
            </TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="flex-1 flex flex-col m-0">
            <EditorToolbar />
            <div className="flex-1">
              <CodeEditor className="h-full" />
            </div>
          </TabsContent>

          <TabsContent value="chat" className="flex-1 m-0">
            <ChatPanel className="h-full" />
          </TabsContent>

          <TabsContent value="files" className="flex-1 m-0">
            <Sidebar className="h-full w-full border-r-0" />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Desktop 3-panel layout with resizable panels
  return (
    <ResizablePanelGroup
      orientation="horizontal"
      className="h-full"
      onLayoutChange={(sizes: { [panelId: string]: number }) => {
        // Save panel sizes when layout changes
        const sizeArray = Object.values(sizes);
        if (sizeArray.length >= 3) {
          if (panelVisibility.sidebar) {
            handlePanelResize('sidebar', sizeArray[0]);
          }
          const editorIndex = panelVisibility.sidebar ? 1 : 0;
          handlePanelResize('editor', sizeArray[editorIndex]);
          handlePanelResize('chat', sizeArray[sizeArray.length - 1]);
        }
      }}
    >
      {/* Sidebar Panel */}
      {panelVisibility.sidebar && (
        <>
          <ResizablePanel
            defaultSize={previousSizesRef.current.sidebar}
            minSize={15}
            maxSize={30}
            className="min-w-[200px]"
          >
            <Sidebar className="h-full" />
          </ResizablePanel>
          <ResizableHandle withHandle />
        </>
      )}

      {/* Editor Panel */}
      <ResizablePanel
        defaultSize={panelSizes.editor}
        minSize={30}
        className="min-w-[400px]"
      >
        <div className="flex h-full flex-col">
          <EditorToolbar />
          <div className="flex-1">
            <CodeEditor className="h-full" />
          </div>
        </div>
      </ResizablePanel>

      {/* Chat Panel */}
      {panelVisibility.chat && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel
            defaultSize={previousSizesRef.current.chat}
            minSize={20}
            maxSize={40}
            className="min-w-[300px]"
          >
            <ChatPanel className="h-full" />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
