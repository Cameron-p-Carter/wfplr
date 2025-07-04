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

// Project Allocations
export async function getProjectAllocations(projectId: string) {
  const { data, error } = await supabase
    .from("project_allocations_detailed")
    .select("*")
    .eq("project_id", projectId)
    .order("start_date");
  
  if (error) throw error;
  return data;
}

export async function getPersonAllocations(personId: string) {
  const { data, error } = await supabase
    .from("project_allocations_detailed")
    .select("*")
    .eq("person_id", personId)
    .order("start_date");
  
  if (error) throw error;
  return data;
}

export async function getAllAllocations() {
  const { data, error } = await supabase
    .from("project_allocations_detailed")
    .select("*")
    .order("start_date");
  
  if (error) throw error;
  return data;
}

export async function createProjectAllocation(allocation: TablesInsert<"project_allocations">) {
  const { data, error } = await supabase
    .from("project_allocations")
    .insert(allocation)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProjectAllocation(id: string, allocation: TablesUpdate<"project_allocations">) {
  const { data, error } = await supabase
    .from("project_allocations")
    .update(allocation)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteProjectAllocation(id: string) {
  const { error } = await supabase
    .from("project_allocations")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

// Utility functions for calculations
export async function getPersonUtilization(personId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from("project_allocations")
    .select("allocation_percentage, start_date, end_date")
    .eq("person_id", personId)
    .gte("end_date", startDate)
    .lte("start_date", endDate);
  
  if (error) throw error;
  
  // Calculate overlapping utilization
  let totalUtilization = 0;
  if (data) {
    for (const allocation of data) {
      const allocStart = new Date(allocation.start_date);
      const allocEnd = new Date(allocation.end_date);
      const queryStart = new Date(startDate);
      const queryEnd = new Date(endDate);
      
      // Check if there's overlap
      if (allocStart <= queryEnd && allocEnd >= queryStart) {
        totalUtilization += allocation.allocation_percentage;
      }
    }
  }
  
  return Math.min(totalUtilization, 100); // Cap at 100%
}

export async function getProjectGaps(projectId: string) {
  // Get requirements
  const requirements = await getProjectRequirements(projectId);
  
  // Get allocations
  const allocations = await getProjectAllocations(projectId);
  
  // Calculate gaps
  const gaps = [];
  
  for (const requirement of requirements) {
    if (!requirement.start_date || !requirement.end_date || !requirement.role_type_id) continue;
    
    // Find allocations that are directly linked to this requirement
    const directAllocations = allocations.filter(allocation => 
      allocation.requirement_id === requirement.id
    );
    
    // Also find legacy allocations (without requirement_id) that overlap with this requirement
    // This ensures backward compatibility with existing data
    const legacyAllocations = allocations.filter(allocation => 
      !allocation.requirement_id && // No requirement_id set (legacy allocation)
      allocation.role_type_id === requirement.role_type_id &&
      allocation.start_date && allocation.end_date &&
      new Date(allocation.start_date) <= new Date(requirement.end_date) &&
      new Date(allocation.end_date) >= new Date(requirement.start_date)
    );
    
    // Combine direct and legacy allocations
    const matchingAllocations = [...directAllocations, ...legacyAllocations];
    
    // Calculate allocated count (sum of allocation percentages / 100)
    const allocatedCount = matchingAllocations.reduce((sum, allocation) => 
      sum + (allocation.allocation_percentage || 0) / 100, 0
    );
    
    const gap = (requirement.required_count || 0) - allocatedCount;
    
    if (gap > 0) {
      gaps.push({
        requirement_id: requirement.id,
        role_type_id: requirement.role_type_id,
        role_type_name: requirement.role_type_name,
        required_count: requirement.required_count,
        allocated_count: allocatedCount,
        gap_count: gap,
        start_date: requirement.start_date,
        end_date: requirement.end_date,
      });
    }
  }
  
  return gaps;
}

export async function getOverAllocatedPeople() {
  const { data: allocations, error } = await supabase
    .from("project_allocations_detailed")
    .select("*");
  
  if (error) throw error;
  
  const overAllocated = [];
  const peopleMap = new Map();
  
  // Group allocations by person and date ranges
  for (const allocation of allocations) {
    if (!allocation.person_id || !allocation.start_date || !allocation.end_date) continue;
    
    const personId = allocation.person_id;
    if (!peopleMap.has(personId)) {
      peopleMap.set(personId, {
        person_id: personId,
        person_name: allocation.person_name,
        allocations: []
      });
    }
    
    peopleMap.get(personId).allocations.push(allocation);
  }
  
  // Check for over-allocation
  for (const [personId, personData] of peopleMap) {
    const allocations = personData.allocations;
    
    // Find overlapping periods
    for (let i = 0; i < allocations.length; i++) {
      for (let j = i + 1; j < allocations.length; j++) {
        const alloc1 = allocations[i];
        const alloc2 = allocations[j];
        
        // Check if periods overlap
        if (new Date(alloc1.start_date!) <= new Date(alloc2.end_date!) &&
            new Date(alloc1.end_date!) >= new Date(alloc2.start_date!)) {
          
          const totalAllocation = (alloc1.allocation_percentage || 0) + (alloc2.allocation_percentage || 0);
          
          if (totalAllocation > 100) {
            overAllocated.push({
              person_id: personId,
              person_name: personData.person_name,
              total_allocation: totalAllocation,
              conflicting_allocations: [alloc1, alloc2]
            });
          }
        }
      }
    }
  }
  
  return overAllocated;
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

// Project Resource Requirements
export async function getProjectRequirements(projectId: string) {
  const { data, error } = await supabase
    .from("project_requirements_detailed")
    .select("*")
    .eq("project_id", projectId)
    .order("start_date");
  
  if (error) throw error;
  return data;
}

export async function getProjectRequirementById(id: string) {
  const { data, error } = await supabase
    .from("project_resource_requirements")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createProjectRequirement(requirement: TablesInsert<"project_resource_requirements">) {
  const { data, error } = await supabase
    .from("project_resource_requirements")
    .insert(requirement)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateProjectRequirement(id: string, requirement: TablesUpdate<"project_resource_requirements">) {
  const { data, error } = await supabase
    .from("project_resource_requirements")
    .update(requirement)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteProjectRequirement(id: string) {
  const { error } = await supabase
    .from("project_resource_requirements")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

// Leave Periods
export async function getPersonLeave(personId: string) {
  const { data, error } = await supabase
    .from("leave_periods")
    .select("*")
    .eq("person_id", personId)
    .order("start_date");
  
  if (error) throw error;
  return data;
}

export async function getAllLeave() {
  const { data, error } = await supabase
    .from("leave_periods")
    .select(`
      *,
      people!inner(
        id,
        name,
        role_types(name)
      )
    `)
    .order("start_date");
  
  if (error) throw error;
  return data;
}

export async function getLeavePeriodById(id: string) {
  const { data, error } = await supabase
    .from("leave_periods")
    .select("*")
    .eq("id", id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createLeavePeriod(leave: TablesInsert<"leave_periods">) {
  const { data, error } = await supabase
    .from("leave_periods")
    .insert(leave)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateLeavePeriod(id: string, leave: TablesUpdate<"leave_periods">) {
  const { data, error } = await supabase
    .from("leave_periods")
    .update(leave)
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function updateLeaveStatus(id: string, status: "pending" | "approved" | "unapproved") {
  const { data, error } = await supabase
    .from("leave_periods")
    .update({ status })
    .eq("id", id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

export async function deleteLeavePeriod(id: string) {
  const { error } = await supabase
    .from("leave_periods")
    .delete()
    .eq("id", id);
  
  if (error) throw error;
}

export async function getPendingLeave() {
  const { data, error } = await supabase
    .from("leave_periods")
    .select(`
      *,
      people!inner(
        id,
        name,
        role_types(name)
      )
    `)
    .eq("status", "pending")
    .order("start_date");
  
  if (error) throw error;
  return data;
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
