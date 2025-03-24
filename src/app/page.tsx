"use client";

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Workspace from '@/components/Workspace';

export default function Home() {
  return (
    <DndProvider backend={HTML5Backend}>
      <main className="flex min-h-screen">
        <Workspace />
      </main>
    </DndProvider>
  );
}