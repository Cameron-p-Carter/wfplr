"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getPeople, createPerson, updatePerson, deletePerson } from "@/lib/supabase/queries";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

export function usePeople() {
  const [people, setPeople] = useState<Tables<"people_with_roles">[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeople = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPeople();
      setPeople(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch people";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  const create = async (person: TablesInsert<"people">) => {
    try {
      await createPerson(person);
      await fetchPeople(); // Refetch to get the updated view with role info
      toast.success("Person created successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create person";
      toast.error(message);
      throw err;
    }
  };

  const update = async (id: string, person: TablesUpdate<"people">) => {
    try {
      await updatePerson(id, person);
      await fetchPeople(); // Refetch to get the updated view with role info
      toast.success("Person updated successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update person";
      toast.error(message);
      throw err;
    }
  };

  const remove = async (id: string) => {
    try {
      await deletePerson(id);
      setPeople(prev => prev.filter(p => p.id !== id));
      toast.success("Person deleted successfully");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete person";
      toast.error(message);
      throw err;
    }
  };

  return {
    people,
    loading,
    error,
    create,
    update,
    remove,
    refetch: fetchPeople,
  };
}
