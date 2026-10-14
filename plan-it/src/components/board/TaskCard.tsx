'use client';

import React from 'react';
import { DraggableProvided } from '@hello-pangea/dnd';
import { MessageSquare, Calendar, AlertCircle } from 'lucide-react';
import { TaskItem } from '@/types';

interface TaskCardProps {
  task: TaskItem;
  provided: DraggableProvided;
  onClick: () => void;
}

export function TaskCard({ task, provided, onClick }: TaskCardProps) {
  const isOverdue = task.dueDate && new Date(task.dueDate).getTime() < Date.now();

  const priorityColors: Record<string, string> = {
    LOW: 'text-zinc-400 bg-zinc-800 border-zinc-700',
    MEDIUM: 'text-blue-400 bg-blue-950/40 border-blue-800/40',
    HIGH: 'text-amber-400 bg-amber-950/40 border-amber-800/40',
    URGENT: 'text-red-400 bg-red-950/40 border-red-800/40',
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      onClick={onClick}
      className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3.5 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all select-none space-y-2.5"
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-xs font-medium text-zinc-100 line-clamp-2 leading-snug">
          {task.title}
        </h4>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${
            priorityColors[task.priority] || priorityColors.MEDIUM
          }`}
        >
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          {task.dueDate && (
            <div
              className={`flex items-center gap-1 font-mono text-[10px] ${
                isOverdue ? 'text-red-400 font-semibold' : 'text-zinc-400'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </div>
          )}

          {typeof task.commentsCount === 'number' && task.commentsCount > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-zinc-400">
              <MessageSquare className="w-3 h-3" />
              <span>{task.commentsCount}</span>
            </div>
          )}
        </div>

        {task.assignee ? (
          <div
            title={`Assigned to ${task.assignee.name}`}
            className="w-5 h-5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 flex items-center justify-center text-[9px] font-bold uppercase"
          >
            {task.assignee.name.slice(0, 2)}
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-[9px] text-zinc-500">
            -
          </div>
        )}
      </div>
    </div>
  );
}
