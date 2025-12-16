"use client";

import { useState } from "react";
import { useAuthStore } from "@/lib/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, Crown, Building2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanType = "free" | "basic" | "professional" | "enterprise";

interface Plan {
  id: PlanType;
  name: string;
  price: string;
  description: string;
  features: string[];
  icon: React.ComponentType<{ className?: string }>;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Perfect for getting started",
    features: [
      "Up to 5 maps",
      "Basic GIS tools",
      "Community support",
      "Limited AI queries (10/month)",
    ],
    icon: Zap,
  },
  {
    id: "basic",
    name: "Basic",
    price: "$29",
    description: "For small projects",
    features: [
      "Up to 20 maps",
      "Advanced GIS tools",
      "Email support",
      "AI queries (100/month)",
      "Export capabilities",
    ],
    icon: CreditCard,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$99",
    description: "For growing businesses",
    features: [
      "Unlimited maps",
      "All GIS tools",
      "Priority support",
      "Unlimited AI queries",
      "Advanced exports",
      "Custom integrations",
      "Team collaboration",
    ],
    icon: Crown,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    description: "For large organizations",
    features: [
      "Everything in Professional",
      "Dedicated support",
      "Custom AI training",
      "SLA guarantee",
      "On-premise deployment",
      "Custom features",
    ],
    icon: Building2,
  },
];

export default function SubscriptionPage() {
  const { user } = useAuthStore();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const currentPlan = user?.subscription?.plan || "free";

  const handleUpgrade = async (planId: PlanType) => {
    if (planId === currentPlan) return;
    
    setIsUpgrading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsUpgrading(false);
    
    // In production, this would update the subscription via API
    console.log(`Upgrading to ${planId} plan`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subscription</h2>
        <p className="text-muted-foreground">
          Manage your subscription and choose the plan that fits your needs
        </p>
      </div>

      {/* Current Plan Status */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Your active subscription details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold capitalize">{currentPlan} Plan</h3>
              <p className="text-sm text-muted-foreground">
                Status: <span className="text-green-600 font-medium">Active</span>
              </p>
              {user?.subscription?.expiresAt && (
                <p className="text-sm text-muted-foreground mt-1">
                  Renews on {new Date(user.subscription.expiresAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button variant="outline">Manage Billing</Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Available Plans</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === currentPlan;
            const isUpgrade = plans.findIndex((p) => p.id === currentPlan) < plans.findIndex((p) => p.id === plan.id);

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative",
                  plan.popular && "border-primary shadow-lg"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                  </div>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.price !== "Custom" && (
                      <span className="text-muted-foreground">/month</span>
                    )}
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={isCurrentPlan ? "outline" : "default"}
                    disabled={isCurrentPlan || isUpgrading}
                    onClick={() => handleUpgrade(plan.id)}
                  >
                    {isCurrentPlan
                      ? "Current Plan"
                      : isUpgrade
                      ? "Upgrade"
                      : "Downgrade"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

