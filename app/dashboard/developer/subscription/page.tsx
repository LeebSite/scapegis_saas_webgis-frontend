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
    price: "0",
    description: "Akses dasar untuk mencoba layanan",
    features: [
      "Akses: Pekanbaru (Demo)",
      "Prompt AI: 10x / bulan",
      "Tidak bisa request kota baru",
    ],
    icon: Zap,
  },
  {
    id: "basic",
    name: "Basic",
    price: "$29",
    description: "Individual / Small Developer — eksplorasi awal",
    features: [
      "Target: Developer kecil / eksplorasi awal",
      "Prompt AI: 50x / bulan",
      "Akses 1 kota / kabupaten",
      "Layer GIS dasar: jalan utama, batas administrasi, penggunaan lahan",
      "Mode prompt: deskriptif, rekomendasi sederhana",
      "Batasan: tidak bisa perbandingan antar wilayah, tidak bisa export data",
      "Response AI: ringkas, non-simulatif",
    ],
    icon: CreditCard,
  },
  {
    id: "professional",
    name: "Professional",
    price: "$99",
    description: "Developer Aktif — analisis & scoring",
    features: [
      "Target: Developer properti skala menengah",
      "Prompt AI: 100x / bulan",
      "Akses hingga 1 kota / kabupaten",
      "Layer GIS lanjutan: kepadatan penduduk, fasilitas umum, aksesibilitas",
      "Analisis: perbandingan wilayah, scoring kelayakan",
      "Export: ringkasan PDF (non-spasial)",
      "Batasan: tidak ada custom layer request, tidak ada SLA cepat",
      "Response AI: lebih mendalam, tetap profesional",
    ],
    icon: Crown,
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "299.000",
    description: "Corporate / Institutional — full features & SLA",
    features: [
      "Target: Developer besar / BUMN / Konsultan",
      "Prompt AI: 200x / bulan",
      "Akses 3 kota / kabupaten",
      "Layer GIS premium: risiko banjir, zonasi RTRW, nilai tanah (estimasi)",
      "Analisis: multi-criteria, simulasi skenario",
      "Export: PDF + GeoJSON",
      "SLA: prioritas GIS processing",
      "Support: admin support langsung",
    ],
    icon: Building2,
  },
];

export default function SubscriptionPage() {
  const { user, setUser } = useAuthStore();
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formPlan, setFormPlan] = useState<PlanType | null>(null);

  // form fields
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [projectTypes, setProjectTypes] = useState<{ perumahan?: boolean; komersial?: boolean; mixed?: boolean }>({});
  const [analysisGoals, setAnalysisGoals] = useState<{ kelayakan?: boolean; risiko?: boolean; aksesibilitas?: boolean; perbandingan?: boolean }>({});
  const [scale, setScale] = useState<"Kecil" | "Menengah" | "Besar" | "">("");
  const [notes, setNotes] = useState("");
  const currentPlan = user?.subscription?.plan || "free";

  const handleUpgrade = async (planId: PlanType) => {
    if (planId === currentPlan) return;
    // open the subscription detail form for this plan
    setFormPlan(planId);
    setShowForm(true);
  };

  const submitSubscription = async () => {
    if (!formPlan) return;
    setIsUpgrading(true);
    // Simulate API call to backend to create subscription
    await new Promise((r) => setTimeout(r, 1200));

    // update auth store so UI reflects new subscription (demo only)
    const newSub = {
      plan: formPlan,
      status: "active",
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    } as any;

    setUser && setUser({ ...user, subscription: newSub });

    setIsUpgrading(false);
    setShowForm(false);
    setFormPlan(null);
    // reset form
    setProvince("");
    setCity("");
    setDistrict("");
    setProjectTypes({});
    setAnalysisGoals({});
    setScale("");
    setNotes("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Subscription</h2>
        <p className="text-muted-foreground mt-1">
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

            {/* Subscription Form Modal */}
            {showForm && formPlan && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowForm(false)} />
                <div className="relative z-10 w-full max-w-2xl rounded bg-white p-6 shadow-lg">
                  <h3 className="text-xl font-semibold mb-3">Upgrade to {formPlan} plan</h3>
                  <p className="text-sm text-muted-foreground mb-4">Isi detail singkat agar kami dapat menyiapkan akses dan estimasi.</p>

                  <div className="grid gap-3">
                    <div>
                      <div className="font-medium">Subscription Plan</div>
                      <div className="flex gap-4 mt-2">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="plan" checked={formPlan === 'basic'} onChange={() => setFormPlan('basic')} /> Basic
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="plan" checked={formPlan === 'professional'} onChange={() => setFormPlan('professional')} /> Professional
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="plan" checked={formPlan === 'enterprise'} onChange={() => setFormPlan('enterprise')} /> Enterprise
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium">Wilayah GIS</div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input className="border p-2 rounded" placeholder="Provinsi" value={province} onChange={(e) => setProvince(e.target.value)} />
                        <input className="border p-2 rounded" placeholder="Kota/Kabupaten" value={city} onChange={(e) => setCity(e.target.value)} />
                        <input className="border p-2 rounded" placeholder="Kecamatan (opsional)" value={district} onChange={(e) => setDistrict(e.target.value)} />
                      </div>
                    </div>

                    <div>
                      <div className="font-medium">Kebutuhan Proyek</div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                        <div>
                          <div className="text-sm font-medium">Jenis Pengembangan</div>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={!!projectTypes.perumahan} onChange={(e) => setProjectTypes((s) => ({ ...s, perumahan: e.target.checked }))} /> Perumahan</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={!!projectTypes.komersial} onChange={(e) => setProjectTypes((s) => ({ ...s, komersial: e.target.checked }))} /> Komersial</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={!!projectTypes.mixed} onChange={(e) => setProjectTypes((s) => ({ ...s, mixed: e.target.checked }))} /> Mixed-use</label>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Tujuan Analisis</div>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={!!analysisGoals.kelayakan} onChange={(e) => setAnalysisGoals((s) => ({ ...s, kelayakan: e.target.checked }))} /> Kelayakan lokasi</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={!!analysisGoals.risiko} onChange={(e) => setAnalysisGoals((s) => ({ ...s, risiko: e.target.checked }))} /> Risiko</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={!!analysisGoals.aksesibilitas} onChange={(e) => setAnalysisGoals((s) => ({ ...s, aksesibilitas: e.target.checked }))} /> Aksesibilitas</label>
                          <label className="flex items-center gap-2"><input type="checkbox" checked={!!analysisGoals.perbandingan} onChange={(e) => setAnalysisGoals((s) => ({ ...s, perbandingan: e.target.checked }))} /> Perbandingan</label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="font-medium">Detail Tambahan</div>
                      <div className="mt-2 flex items-center gap-4">
                        <label className="flex items-center gap-2"><input type="radio" name="scale" checked={scale === 'Kecil'} onChange={() => setScale('Kecil')} /> Kecil</label>
                        <label className="flex items-center gap-2"><input type="radio" name="scale" checked={scale === 'Menengah'} onChange={() => setScale('Menengah')} /> Menengah</label>
                        <label className="flex items-center gap-2"><input type="radio" name="scale" checked={scale === 'Besar'} onChange={() => setScale('Besar')} /> Besar</label>
                      </div>
                      <textarea className="w-full border rounded p-2 mt-2" placeholder="Catatan (opsional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={() => { setShowForm(false); setFormPlan(null); }}>Cancel</Button>
                      <Button onClick={submitSubscription} disabled={isUpgrading}>{isUpgrading ? 'Applying...' : 'Submit'}</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
    </div>
  );
}

