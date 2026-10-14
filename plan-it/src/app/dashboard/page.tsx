'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderKanban, Users, Clock, ArrowRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [memberEmails, setMemberEmails] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/projects', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (err) {
      toast.error('Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setCreating(true);

    try {
      const emails = memberEmails
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean);

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ title, description, memberEmails: emails }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create workspace');
      }

      toast.success('Workspace created successfully!');
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setMemberEmails('');
      fetchProjects();
    } catch (err: any) {
      toast.error(err.message || 'Creation error');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this workspace and all associated boards/tasks?')) {
      return;
    }

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete workspace');
      }

      toast.success('Workspace deleted');
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err: any) {
      toast.error(err.message || 'Delete failed');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-100">Workspaces & Projects</h1>
          <p className="text-xs text-zinc-400">Manage all your ongoing team sprints and Kanban boards</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Workspace</span>
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-zinc-900/60 rounded-xl border border-zinc-800/80 animate-pulse" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-2xl">
          <FolderKanban className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-zinc-300">No projects yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Create your first workspace to start collaborating on tasks, organizing sprints, and tracking deliverables.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Create Workspace
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((project) => {
            const totalTasks = project.columns?.reduce(
              (acc: number, col: any) => acc + (col._count?.tasks || 0),
              0
            );

            return (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="group relative bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-zinc-700/80 rounded-xl p-5 flex flex-col justify-between transition-all hover:shadow-xl hover:shadow-indigo-950/20"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-indigo-400 transition-colors">
                      {project.title}
                    </h3>
                    <button
                      onClick={(e) => handleDeleteProject(project.id, e)}
                      title="Delete Workspace"
                      className="text-zinc-500 hover:text-red-400 p-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <FolderKanban className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{project.columns?.length || 0} lists</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{totalTasks} tasks</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-400 group-hover:translate-x-0.5 transition-transform">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-zinc-100">Create New Workspace</h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Workspaces hold your boards, sprint lists, and team members.
            </p>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Q4 Mobile App Sprint"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of goals or sprint scope..."
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Invite Members (comma separated emails)
                </label>
                <input
                  type="text"
                  value={memberEmails}
                  onChange={(e) => setMemberEmails(e.target.value)}
                  placeholder="alex@taskpulse.io, maya@taskpulse.io"
                  className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
