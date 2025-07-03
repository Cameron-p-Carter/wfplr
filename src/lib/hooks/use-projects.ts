"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getProjects, createProject, updateProject, deleteProject } from "@/lib/supabase/queries";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export function useProjects() {
  const [projects, setProjects] = useState<Tables<"projects">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch projects";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const create = async (project: TablesInsert<"projects">) => {
    try {
      const newProject = await createProject(project);
      setProjects(prev => [...prev, newProject].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Project created successfully");
      return newProject;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
      throw err;
    }
  };

  const update = async (id: string, project: TablesUpdate<"projects">) => {
    try {
      const updatedProject = await updateProject(id, project);
      setProjects(prev => 
        prev.map(p => p.id === id ? updatedProject : p)
           .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Project updated successfully");
      return updatedProject;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update project";
      toast.error(message);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
      toast.success("Project deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete project";
      toast.error(message);
      throw err;
    }
  };

  return {
    projects,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchProjects,
  };
}
