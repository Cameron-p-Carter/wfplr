"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getProjectById } from "@/lib/supabase/queries";
import { useProjectRequirements } from "@/lib/hooks/use-project-requirements";
import { RequirementForm } from "./components/requirement-form";
import { formatDate } from "@/lib/utils/date";
import type { Tables } from "@/types/supabase";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Tables<"projects"> | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const { requirements, loading: requirementsLoading, create, update, remove } = useProjectRequirements(projectId);
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRequirement, setEditingRequirement] = useState<Tables<"project_requirements_detailed"> | null>(null);
  const [deletingRequirement, setDeletingRequirement] = useState<Tables<"project_requirements_detailed"> | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      
      try {
        setProjectLoading(true);
        const data = await getProjectById(projectId);
        setProject(data);
      } catch (error) {
        console.error("Failed to fetch project:", error);
        router.push("/dashboard/projects");
      } finally {
        setProjectLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  const getProjectStatus = (project: Tables<"projects">) => {
    const now = new Date();
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);

    if (now < startDate) {
      return { label: "Not Started", variant: "secondary" as const };
    } else if (now > endDate) {
      return { label: "Completed", variant: "outline" as const };
    } else {
      return { label: "Active", variant: "default" as const };
    }
  };

  const handleCreateRequirement = async (data: { role_type_id: string; required_count: number; start_date: string; end_date: string }) => {
    try {
      await create({ ...data, project_id: projectId });
      setShowCreateDialog(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleUpdateRequirement = async (data: { role_type_id: string; required_count: number; start_date: string; end_date: string }) => {
    if (!editingRequirement) return;
    try {
      await update(editingRequirement.id!, { ...data, project_id: projectId });
      setEditingRequirement(null);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  const handleDeleteRequirement = async () => {
    if (!deletingRequirement) return;
    try {
      setIsDeleting(true);
      await remove(deletingRequirement.id!);
      setDeletingRequirement(null);
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsDeleting(false);
    }
  };

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-[300px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.push("/dashboard/projects")} className="mt-4">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const status = getProjectStatus(project);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/projects")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Projects
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
          <div className="flex items-center space-x-4 mt-2">
            <p className="text-muted-foreground">
              {formatDate(project.start_date)} - {formatDate(project.end_date)}
            </p>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="requirements">
              Resource Requirements
              {requirements.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {requirements.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-sm">{project.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                    <p className="text-sm">{formatDate(project.start_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">End Date</label>
                    <p className="text-sm">{formatDate(project.end_date)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="mt-1">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Resource Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {requirementsLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ) : requirements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No resource requirements defined yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">{requirements.length}</span> resource requirements
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">
                          {requirements.reduce((sum, req) => sum + (req.required_count || 0), 0)}
                        </span> total people needed
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">
                          {new Set(requirements.map(req => req.role_type_id)).size}
                        </span> different role types
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="requirements">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Resource Requirements</CardTitle>
                    <CardDescription>
                      Define the people and roles needed for this project
                    </CardDescription>
                  </div>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Requirement
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {requirementsLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-4 w-[150px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-[120px]" />
                        <Skeleton className="h-4 w-[100px]" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Role Type</TableHead>
                        <TableHead>Required Count</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {requirements.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No resource requirements defined. Add the first requirement to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        requirements.map((requirement) => (
                          <TableRow key={requirement.id}>
                            <TableCell className="font-medium">
                              {requirement.role_type_name}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {requirement.required_count} {requirement.required_count === 1 ? 'person' : 'people'}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatDate(requirement.start_date!)}</TableCell>
                            <TableCell>{formatDate(requirement.end_date!)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingRequirement(requirement)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingRequirement(requirement)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Requirement Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Resource Requirement</DialogTitle>
            <DialogDescription>
              Define a resource requirement for this project
            </DialogDescription>
          </DialogHeader>
          <RequirementForm 
            onSubmit={handleCreateRequirement} 
            onCancel={() => setShowCreateDialog(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Edit Requirement Dialog */}
      <Dialog open={!!editingRequirement} onOpenChange={() => setEditingRequirement(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Resource Requirement</DialogTitle>
            <DialogDescription>
              Update the resource requirement details
            </DialogDescription>
          </DialogHeader>
          {editingRequirement && (
            <RequirementForm
              initialData={{
                role_type_id: editingRequirement.role_type_id!,
                required_count: editingRequirement.required_count!,
                start_date: editingRequirement.start_date!,
                end_date: editingRequirement.end_date!,
              }}
              onSubmit={handleUpdateRequirement}
              onCancel={() => setEditingRequirement(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingRequirement} onOpenChange={() => setDeletingRequirement(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resource Requirement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resource requirement? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRequirement}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
