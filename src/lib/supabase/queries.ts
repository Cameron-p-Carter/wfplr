import { createClient } from "./client";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

const supabase = createClient();

// Role Types
export async function getRoleTypes() {
  const { data, error } = await supabase
    .from("role_types")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data;
}

export async function getRoleTypeById(id: string) {
  const { data, error } = await supabase
    .from("role_types")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createRoleType(roleType: TablesInsert<"role_types">) {
  const { data, error } = await supabase
    .from("role_types")
    .insert(roleType)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateRoleType(id: string, roleType: TablesUpdate<"role_types">) {
  const { data, error } = await supabase
    .from("role_types")
    .update(roleType)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteRoleType(id: string) {
  // Check if role type is in use
  const { data: peopleCount } = await supabase
    .from("people")
    .select("id", { count: "exact" })
    .eq("role_type_id", id);

  const { data: requirementsCount } = await supabase
    .from("project_resource_requirements")
    .select("id", { count: "exact" })
    .eq("role_type_id", id);

  if ((peopleCount?.length || 0) > 0 || (requirementsCount?.length || 0) > 0) {
    throw new Error("Cannot delete role type that is currently in use");
  }

  const { error } = await supabase
    .from("role_types")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

// People
export async function getPeople() {
  const { data, error } = await supabase
    .from("people_with_roles")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data;
}

export async function getPersonById(id: string) {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createPerson(person: TablesInsert<"people">) {
  const { data, error } = await supabase
    .from("people")
    .insert(person)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updatePerson(id: string, person: TablesUpdate<"people">) {
  const { data, error } = await supabase
    .from("people")
    .update(person)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deletePerson(id: string) {
  // Check if person has active allocations
  const { data: allocations } = await supabase
    .from("project_allocations")
    .select("id", { count: "exact" })
    .eq("person_id", id);

  if ((allocations?.length || 0) > 0) {
    throw new Error("Cannot delete person with active project allocations");
  }

  const { error } = await supabase
    .from("people")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

// Projects
export async function getProjects() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("name");
  
  if (error) throw error;
  return data;
}

export async function getProjectById(id: string) {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createProject(project: TablesInsert<"projects">) {
  const { data, error } = await supabase
    .from("projects")
    .insert(project)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProject(id: string, project: TablesUpdate<"projects">) {
  const { data, error } = await supabase
    .from("projects")
    .update(project)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteProject(id: string) {
  // Check if project has active allocations or requirements
  const { data: allocations } = await supabase
    .from("project_allocations")
    .select("id", { count: "exact" })
    .eq("project_id", id);

  const { data: requirements } = await supabase
    .from("project_resource_requirements")
    .select("id", { count: "exact" })
    .eq("project_id", id);

  if ((allocations?.length || 0) > 0 || (requirements?.length || 0) > 0) {
    throw new Error("Cannot delete project with active allocations or resource requirements");
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}
