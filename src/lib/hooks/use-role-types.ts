"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getRoleTypes, createRoleType, updateRoleType, deleteRoleType } from "@/lib/supabase/queries";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export function useRoleTypes() {
  const [roleTypes, setRoleTypes] = useState<Tables<"role_types">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoleTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRoleTypes();
      setRoleTypes(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch role types";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoleTypes();
  }, []);

  const create = async (roleType: TablesInsert<"role_types">) => {
    try {
      const newRoleType = await createRoleType(roleType);
      setRoleTypes(prev => [...prev, newRoleType].sort((a, b) => a.name.localeCompare(b.name)));
      toast.success("Role type created successfully");
      return newRoleType;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create role type";
      toast.error(message);
      throw err;
    }
  };

  const update = async (id: string, roleType: TablesUpdate<"role_types">) => {
    try {
      const updatedRoleType = await updateRoleType(id, roleType);
      setRoleTypes(prev => 
        prev.map(rt => rt.id === id ? updatedRoleType : rt)
           .sort((a, b) => a.name.localeCompare(b.name))
      );
      toast.success("Role type updated successfully");
      return updatedRoleType;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update role type";
      toast.error(message);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteRoleType(id);
      setRoleTypes(prev => prev.filter(rt => rt.id !== id));
      toast.success("Role type deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete role type";
      toast.error(message);
      throw err;
    }
  };

  return {
    roleTypes,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchRoleTypes,
  };
}
