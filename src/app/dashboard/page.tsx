"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Briefcase, UserCheck, TrendingUp } from "lucide-react";
import { useRoleTypes } from "@/lib/hooks/use-role-types";
import { usePeople } from "@/lib/hooks/use-people";
import { useProjects } from "@/lib/hooks/use-projects";

export default function DashboardPage() {
  const { roleTypes, loading: roleTypesLoading } = useRoleTypes();
  const { people, loading: peopleLoading } = usePeople();
  const { projects, loading: projectsLoading } = useProjects();

  const activeProjects = projects.filter(project => {
    const now = new Date();
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    return now >= startDate && now <= endDate;
  });

  const stats = [
    {
      title: "Active Projects",
      value: projectsLoading ? "..." : activeProjects.length.toString(),
      description: "Currently running projects",
      icon: Briefcase,
      loading: projectsLoading,
    },
    {
      title: "Total People",
      value: peopleLoading ? "..." : people.length.toString(),
      description: "People in organization",
      icon: Users,
      loading: peopleLoading,
    },
    {
      title: "Role Types",
      value: roleTypesLoading ? "..." : roleTypes.length.toString(),
      description: "Available role types",
      icon: UserCheck,
      loading: roleTypesLoading,
    },
    {
      title: "Utilization",
      value: "0%",
      description: "Overall resource utilization",
      icon: TrendingUp,
      loading: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your workforce planning
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.loading ? <Skeleton className="h-8 w-12" /> : stat.value}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
            <CardDescription>Latest project activity</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No projects yet. Create your first project to get started.</p>
            ) : (
              <div className="space-y-2">
                {projects.slice(0, 5).map((project) => (
                  <div key={project.id} className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{project.name}</span>
                    <Badge variant="outline" className="ml-auto">
                      {activeProjects.some(p => p.id === project.id) ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
            <CardDescription>People by role type</CardDescription>
          </CardHeader>
          <CardContent>
            {peopleLoading || roleTypesLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-[150px]" />
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </div>
                ))}
              </div>
            ) : roleTypes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No role types yet. Create role types and add people to get started.</p>
            ) : (
              <div className="space-y-2">
                {roleTypes.map((roleType) => {
                  const count = people.filter(person => person.role_type_id === roleType.id).length;
                  return (
                    <div key={roleType.id} className="flex items-center space-x-2">
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{roleType.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {count}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
