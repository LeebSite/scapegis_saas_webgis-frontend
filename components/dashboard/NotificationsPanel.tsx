import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function NotificationsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="text-muted-foreground">No new notifications</li>
        </ul>
      </CardContent>
    </Card>
  );
}
