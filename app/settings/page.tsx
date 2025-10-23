"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { getStorageMode, setStorageMode } from "@/lib/data";
import { ArrowLeft, Database, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const [storageAdapter, setStorageAdapter] = useState<"supabase" | "dexie">(getStorageMode());

  const handleStorageChange = (useDexie: boolean) => {
    const newMode = useDexie ? "dexie" : "supabase";
    setStorageMode(newMode);
    setStorageAdapter(newMode);
    toast.success(`Switched to ${newMode === "dexie" ? "Offline" : "Cloud"} mode`);
    window.location.reload();
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-lg font-bold text-slate-900">Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Storage Mode</CardTitle>
            <CardDescription>
              Choose how data is stored and synced
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="offline-mode">Offline Mode (IndexedDB)</Label>
                <p className="text-sm text-slate-500">
                  Store all data locally on this device
                </p>
              </div>
              <Switch
                id="offline-mode"
                checked={storageAdapter === "dexie"}
                onCheckedChange={handleStorageChange}
              />
            </div>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <Database className="h-4 w-4 inline mr-2" />
                Current: {storageAdapter === "dexie" ? "Offline (IndexedDB)" : "Cloud (Supabase)"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>
              Export or import your Canton Fair data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              Export Data (JSON)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Download className="h-4 w-4" />
              Export Vendors (CSV)
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <Upload className="h-4 w-4" />
              Import Data
            </Button>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>
              Manage your account settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <Button variant="destructive" className="w-full" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-slate-500 mt-8">
          Canton Fair Capture v1.0.0
        </div>
      </main>
    </div>
  );
}
