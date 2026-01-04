'use client';

import { useChat } from '@/context';
import { useResizablePanel } from '@/hooks/useResizablePanel';
import { PANEL_CONSTRAINTS } from '@/lib/chat/types';
import { Header } from './Header';
import { HistorySidebar } from './HistorySidebar';
import { ChatInterface } from './ChatInterface';
import { ArtifactPanel } from './ArtifactPanel';
import { ResizeHandle } from './ResizeHandle';

export function ChatLayout() {
  const {
    isHistorySidebarOpen,
    setHistorySidebarOpen,
    isArtifactPanelOpen,
    sidebarWidth,
    setSidebarWidth,
    artifactPanelWidth,
    setArtifactPanelWidth,
    currentConversation,
  } = useChat();

  // Resizable sidebar
  const {
    width: currentSidebarWidth,
    isDragging: isSidebarDragging,
    handleMouseDown: handleSidebarMouseDown,
  } = useResizablePanel({
    initialWidth: sidebarWidth,
    minWidth: PANEL_CONSTRAINTS.sidebar.min,
    maxWidth: PANEL_CONSTRAINTS.sidebar.max,
    side: 'left',
    onWidthChange: setSidebarWidth,
  });

  // Resizable artifact panel
  const {
    width: currentArtifactWidth,
    isDragging: isArtifactDragging,
    handleMouseDown: handleArtifactMouseDown,
  } = useResizablePanel({
    initialWidth: artifactPanelWidth,
    minWidth: PANEL_CONSTRAINTS.artifact.min,
    maxWidth: PANEL_CONSTRAINTS.artifact.max,
    side: 'right',
    onWidthChange: setArtifactPanelWidth,
  });

  const hasArtifacts = currentConversation && currentConversation.artifacts.length > 0;
  const showArtifactPanel = isArtifactPanelOpen || Boolean(hasArtifacts);

  return (
    <div className="chat-layout">
      <Header onMenuClick={() => setHistorySidebarOpen(!isHistorySidebarOpen)} />

      {/* Backdrop for mobile sidebar */}
      <div
        className={`sidebar-backdrop ${isHistorySidebarOpen ? 'sidebar-backdrop--visible' : ''}`}
        onClick={() => setHistorySidebarOpen(false)}
        aria-hidden="true"
      />

      <div className="chat-layout__body">
        {/* History Sidebar */}
        <HistorySidebar isOpen={isHistorySidebarOpen} width={currentSidebarWidth} />

        {/* Resize handle for sidebar (desktop only) */}
        {isHistorySidebarOpen && (
          <ResizeHandle
            onMouseDown={handleSidebarMouseDown}
            isDragging={isSidebarDragging}
            className="resize-handle--sidebar"
          />
        )}

        {/* Main Chat Interface */}
        <ChatInterface />

        {/* Resize handle for artifact panel (desktop only) */}
        {showArtifactPanel && (
          <ResizeHandle
            onMouseDown={handleArtifactMouseDown}
            isDragging={isArtifactDragging}
            className="resize-handle--artifact"
          />
        )}

        {/* Artifact Panel */}
        <ArtifactPanel isOpen={showArtifactPanel} width={currentArtifactWidth} />
      </div>
    </div>
  );
}

export default ChatLayout;
