import React, { createContext, useContext, useState } from 'react';
import { DndContext, type DragEndEvent, type DragOverEvent, type DragStartEvent, DragOverlay, closestCenter } from '@dnd-kit/core';
import type { Song } from '../types';

interface DragDropContextType {
  activeSong: Song | null;
  setActiveSong: (song: Song | null) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (!context) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}

interface DragDropProviderProps {
  children: React.ReactNode;
  songs: Song[];
}

export function DragDropProvider({ children, songs }: DragDropProviderProps) {
  const [activeSong, setActiveSong] = useState<Song | null>(null);

  return (
    <DragDropContext.Provider value={{ activeSong, setActiveSong }}>
      <DndContext
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
        <DragOverlay>
          {activeSong ? (
            <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-primary-500 opacity-90">
              <div className="font-medium text-gray-900">{activeSong.title}</div>
              <div className="text-sm text-gray-500">{activeSong.artist}</div>
              <div className="text-xs text-gray-400">
                {activeSong.primaryBpm || activeSong.bpms[0]} BPM, {activeSong.primaryKey || activeSong.keys[0]}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const song = songs.find(s => s.id === active.id);
    setActiveSong(song || null);
  }

  function handleDragOver(_event: DragOverEvent) {
    // Handle drag over logic if needed
  }

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event;
    
    if (!over) {
      setActiveSong(null);
      return;
    }

    // Handle different drop targets
    if (over.id === 'project-list') {
      // Handle dropping on project list
      console.log('Dropped on project list');
    } else if (over.id.toString().startsWith('project-')) {
      // Handle dropping on specific project
      const projectId = over.id.toString().replace('project-', '');
      console.log('Dropped on project:', projectId);
    } else if (over.id.toString().startsWith('section-')) {
      // Handle dropping on specific section
      const [projectId, sectionName] = over.id.toString().replace('section-', '').split('-');
      console.log('Dropped on section:', projectId, sectionName);
    }

    setActiveSong(null);
  }
}