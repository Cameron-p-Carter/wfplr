"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { projectAllocationFormSchema, type ProjectAllocationFormFormData } from "@/lib/utils/validation";
import { formatDateForInput } from "@/lib/utils/date";
import { usePeople } from "@/lib/hooks/use-people";
import { useRoleTypes } from "@/lib/hooks/use-role-types";

interface AllocationFormProps {
  initialData?: {
    person_id: string;
    role_type_id: string;
    allocation_percentage: number;
    start_date: string;
    end_date: string;
  };
  onSubmit: (data: { person_id: string; role_type_id: string; allocation_percentage: number; start_date: string; end_date: string }) => Promise<void>;
  onCancel: () => void;
}

export function AllocationForm({ initialData, onSubmit, onCancel }: AllocationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { people, loading: peopleLoading } = usePeople();
  const { roleTypes, loading: roleTypesLoading } = useRoleTypes();

  const form = useForm<ProjectAllocationFormFormData>({
    resolver: zodResolver(projectAllocationFormSchema),
    defaultValues: {
      person_id: initialData?.person_id || "",
      role_type_id: initialData?.role_type_id || "",
      allocation_percentage: initialData?.allocation_percentage || 100,
      start_date: initialData ? formatDateForInput(initialData.start_date) : "",
      end_date: initialData ? formatDateForInput(initialData.end_date) : "",
    },
  });

  const handleSubmit = async (data: ProjectAllocationFormFormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="person_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Person</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={peopleLoading || people.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        peopleLoading 
                          ? "Loading people..." 
                          : people.length === 0 
                            ? "No people available" 
                            : "Select a person"
                      } 
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {people.map((person) => (
                    <SelectItem key={person.id} value={person.id!}>
                      {person.name} ({person.role_type_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {people.length === 0 && !peopleLoading && (
                <p className="text-sm text-muted-foreground">
                  No people available. Add people first in the People section.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role_type_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role Type</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                defaultValue={field.value}
                disabled={roleTypesLoading || roleTypes.length === 0}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        roleTypesLoading 
                          ? "Loading role types..." 
                          : roleTypes.length === 0 
                            ? "No role types available" 
                            : "Select a role type"
                      } 
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {roleTypes.map((roleType) => (
                    <SelectItem key={roleType.id} value={roleType.id}>
                      {roleType.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {roleTypes.length === 0 && !roleTypesLoading && (
                <p className="text-sm text-muted-foreground">
                  No role types available. Create role types first in the Role Types section.
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="allocation_percentage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Allocation Percentage</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  min="1" 
                  max="100"
                  placeholder="e.g. 50"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <p className="text-sm text-muted-foreground">
                Percentage of this person's time allocated to this project (1-100%)
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || people.length === 0 || roleTypes.length === 0}>
            {isSubmitting ? "Saving..." : initialData ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
