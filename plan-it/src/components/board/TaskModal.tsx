'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Calendar, User, Tag, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface TaskModalProps {
  taskId: string;
  projectId: string;
  members: any[];
  onClose: () => void;
  onUpdate: () => void;
}

export function TaskModal({ taskId, projectId, members, onClose, onUpdate }: TaskModalProps) {
  const [task, setTask] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchTaskDetails = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setTask(data.task);
        setComments(data.task.comments || []);
      }
    } catch (err) {
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const handleUpdateField = async (field: string, value: any) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        toast.success('Task updated');
        fetchTaskDetails();
        onUpdate();
      }
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmittingComment(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/tasks/${taskId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setNewComment('');
        onUpdate();
      }
    } catch (err) {
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        toast.success('Task deleted');
        onUpdate();
        onClose();
      }
    } catch (err) {
      toast.error('Failed to delete task');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-2xl text-center text-xs text-zinc-400">
          Loading task details...
        </div>
      </div>
    );
  }

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8 max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90">
          <input
            type="text"
            defaultValue={task.title}
            onBlur={(e) => handleUpdateField('title', e.target.value)}
            className="text-base font-bold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none w-full mr-4 px-1 py-0.5"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteTask}
              title="Delete task"
              className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content body: Grid split */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {/* Main info */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <label className="text-xs font-semibold text-zinc-400 block mb-2">Description</label>
              <textarea
                rows={4}
                defaultValue={task.description || ''}
                onBlur={(e) => handleUpdateField('description', e.target.value)}
                placeholder="Add rich markdown details or task specifications..."
                className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Comments Thread */}
            <div className="space-y-4 pt-4 border-t border-zinc-800">
              <h4 className="text-xs font-semibold text-zinc-300">Activity & Comments</h4>

              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave a comment or update..."
                  className="flex-1 bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {comments.map((c) => (
                  <div key={c.id} className="p-3 bg-zinc-800/40 border border-zinc-800/80 rounded-xl space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-zinc-300">{c.author?.name}</span>
                      <span className="text-zinc-500 font-mono text-[10px]">
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">{c.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar Attributes */}
          <div className="space-y-4 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/70 h-fit">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Priority</label>
              <select
                value={task.priority}
                onChange={(e) => handleUpdateField('priority', e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Assignee</label>
              <select
                value={task.assigneeId || ''}
                onChange={(e) => handleUpdateField('assigneeId', e.target.value || null)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Due Date</label>
              <input
                type="date"
                defaultValue={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                onChange={(e) => handleUpdateField('dueDate', e.target.value || null)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none"
              />
            </div>

            <div className="pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 space-y-1">
              <div>Created by {task.creator?.name}</div>
              <div>Column: {task.column?.title}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
