import { z } from "zod";

export const roleTypeSchema = z.object({
  name: z.string().min(1, "Role type name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
});

export const personSchema = z.object({
  name: z.string().min(1, "Person name is required").max(100, "Name must be less than 100 characters"),
  role_type_id: z.string().min(1, "Role type is required"),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200, "Name must be less than 200 characters"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate > startDate;
}, {
  message: "End date must be after start date",
  path: ["end_date"],
});

export type RoleTypeFormData = z.infer<typeof roleTypeSchema>;
export type PersonFormData = z.infer<typeof personSchema>;
export type ProjectFormData = z.infer<typeof projectSchema>;
