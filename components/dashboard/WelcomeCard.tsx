import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuthStore } from "@/lib/store";

export function WelcomeCard() {
  const { user } = useAuthStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back, {user?.name ?? "User"}</CardTitle>
        <CardDescription>Your account status: {user ? "Active" : "Guest"}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Use the dashboard to manage projects, maps and subscriptions.</p>
      </CardContent>
    </Card>
  );
}
