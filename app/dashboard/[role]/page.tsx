"use client";

import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, MessageSquare, Users, BarChart3, TrendingUp, Activity } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const adminStats = [
    { title: "Total Users", value: "1,234", icon: Users, change: "+12%" },
    { title: "Active Maps", value: "456", icon: Map, change: "+8%" },
    { title: "AI Queries", value: "8,901", icon: MessageSquare, change: "+23%" },
    { title: "Revenue", value: "$45.6K", icon: TrendingUp, change: "+15%" },
  ];

  const developerStats = [
    { title: "My Projects", value: "12", icon: Map, change: "+2" },
    { title: "AI Insights", value: "89", icon: MessageSquare, change: "+15" },
    { title: "Active Subscriptions", value: "1", icon: Activity, change: "Active" },
  ];

  const stats = isAdmin ? adminStats : developerStats;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}. Here's an overview of your {isAdmin ? "platform" : "projects"}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">New user registered</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Map created</p>
                    <p className="text-xs text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Platform performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>API Response Time</span>
                    <span>120ms</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Uptime</span>
                    <span>99.9%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "99%" }} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <Map className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Create New Map</h3>
                <p className="text-sm text-muted-foreground">Start a new GIS project</p>
              </div>
              <div className="p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors">
                <MessageSquare className="h-8 w-8 mb-2 text-primary" />
                <h3 className="font-semibold">Ask AI Assistant</h3>
                <p className="text-sm text-muted-foreground">Get insights from AI</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

