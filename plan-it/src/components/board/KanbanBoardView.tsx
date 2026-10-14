'use client';

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Plus, Search, Filter, ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { CreateTaskModal } from './CreateTaskModal';
import { useSocket } from '@/hooks/useSocket';

interface KanbanBoardViewProps {
  projectId: string;
}

export function KanbanBoardView({ projectId }: KanbanBoardViewProps) {
  const [project, setProject] = useState<any>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createColId, setCreateColId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  const socket = useSocket(projectId);

  const fetchProject = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProject(data.project);
        setColumns(data.project.columns || []);
      }
    } catch (err) {
      toast.error('Failed to load project board');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket) return;

    socket.on('task:created', (newTask) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === newTask.columnId ? { ...col, tasks: [...col.tasks, newTask] } : col
        )
      );
    });

    socket.on('task:reordered', () => {
      fetchProject();
    });

    socket.on('task:updated', (updatedTask) => {
      setColumns((prev) =>
        prev.map((col) => ({
          ...col,
          tasks: col.tasks.map((t: any) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t)),
        }))
      );
    });

    socket.on('task:deleted', ({ taskId, columnId }) => {
      setColumns((prev) =>
        prev.map((col) =>
          col.id === columnId ? { ...col, tasks: col.tasks.filter((t: any) => t.id !== taskId) } : col
        )
      );
    });

    return () => {
      socket.off('task:created');
      socket.off('task:reordered');
      socket.off('task:updated');
      socket.off('task:deleted');
    };
  }, [socket]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceCol = columns.find((c) => c.id === source.droppableId);
    const destCol = columns.find((c) => c.id === destination.droppableId);
    if (!sourceCol || !destCol) return;

    const sourceTasks = Array.from(sourceCol.tasks);
    const [movedTask] = sourceTasks.splice(source.index, 1);
    const updatedMovedTask = { ...movedTask, columnId: destCol.id };

    let destTasks = source.droppableId === destination.droppableId ? sourceTasks : Array.from(destCol.tasks);
    destTasks.splice(destination.index, 0, updatedMovedTask);

    const prevColumns = [...columns];

    // Optimistic Update
    setColumns((prev) =>
      prev.map((col) => {
        if (col.id === sourceCol.id && sourceCol.id === destCol.id) {
          return { ...col, tasks: destTasks };
        }
        if (col.id === sourceCol.id) return { ...col, tasks: sourceTasks };
        if (col.id === destCol.id) return { ...col, tasks: destTasks };
        return col;
      })
    );

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/tasks/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          taskId: draggableId,
          targetColumnId: destCol.id,
          newIndex: destination.index,
          projectId,
        }),
      });

      if (!res.ok) throw new Error('Failed to save order');
    } catch (err) {
      toast.error('Reorder sync error. Reverting...');
      setColumns(prevColumns);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email: inviteEmail, role: 'MEMBER' }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to invite');
      }

      toast.success('Member invited successfully!');
      setInviteEmail('');
      setShowInviteModal(false);
      fetchProject();
    } catch (err: any) {
      toast.error(err.message || 'Invitation failed');
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-zinc-500">Loading Kanban board...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-xs text-red-400">Workspace not found</div>;
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-zinc-100">{project.title}</h1>
            <p className="text-[11px] text-zinc-400">
              {project.members?.length || 0} team members active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-200 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Invite</span>
          </button>
        </div>
      </div>

      {/* Kanban Drag and Drop Columns */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 flex-1 items-start min-h-[500px]">
          {columns.map((column) => (
            <div
              key={column.id}
              className="w-72 shrink-0 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-3.5 flex flex-col max-h-[calc(100vh-180px)] shadow-lg shadow-black/20"
            >
              <div className="flex items-center justify-between pb-3 mb-2 border-b border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                    {column.title}
                  </h3>
                  <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full font-mono">
                    {column.tasks.length}
                  </span>
                </div>
                <button
                  onClick={() => setCreateColId(column.id)}
                  title="Add card"
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 space-y-2.5 overflow-y-auto pr-1 min-h-[120px] rounded-xl transition-colors ${
                      snapshot.isDraggingOver ? 'bg-zinc-800/30' : ''
                    }`}
                  >
                    {column.tasks
                      .filter((t: any) =>
                        priorityFilter === 'ALL' ? true : t.priority === priorityFilter
                      )
                      .filter((t: any) =>
                        t.title.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((task: any, index: number) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided) => (
                            <TaskCard
                              task={task}
                              provided={dragProvided}
                              onClick={() => setSelectedTaskId(task.id)}
                            />
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <button
                onClick={() => setCreateColId(column.id)}
                className="mt-3 w-full py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800/60 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add card</span>
              </button>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Task Drawer Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          projectId={projectId}
          members={project.members || []}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={fetchProject}
        />
      )}

      {/* Create Card Modal */}
      {createColId && (
        <CreateTaskModal
          columnId={createColId}
          projectId={projectId}
          members={project.members || []}
          onClose={() => setCreateColId(null)}
          onCreated={fetchProject}
        />
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-sm font-bold text-zinc-100">Invite Team Member</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Enter registered user email to grant access to this workspace.
            </p>

            <form onSubmit={handleInvite} className="mt-4 space-y-4">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50"
                >
                  {inviting ? 'Inviting...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
