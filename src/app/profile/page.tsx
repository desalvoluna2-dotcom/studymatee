"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { User, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    try {
      const res = await fetch("/api/users/me", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      setUser(data.user);
      setName(data.user.name || "");
      setEmail(data.user.email || "");
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const body: any = {};
      if (name !== (user?.name || "")) body.name = name;
      if (email !== (user?.email || "")) body.email = email;
      if (newPassword) {
        if (!currentPassword) throw new Error("Enter current password to change password");
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      if (Object.keys(body).length === 0) {
        setMessage("No changes");
        return;
      }
      const res = await fetch("/api/users/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setMessage("Profile updated");
      setCurrentPassword("");
      setNewPassword("");
      load();
    } catch (err: any) {
      setError(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    if (!confirm("Are you sure? This permanently deletes your account and all data.")) return;
    const password = prompt("Enter your password to confirm deletion:");
    if (!password) return;
    try {
      const res = await fetch("/api/users/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Deletion failed");
      window.location.href = "/api/auth/logout";
    } catch (err: any) {
      setError(err.message || "Deletion failed");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Please <Link href="/login" className="underline">sign in</Link>.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Profile &amp; account settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences.</p>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-foreground">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email} · {user.role}</p>
              </div>
            </div>
            <form onSubmit={updateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="p-name">Full name</Label>
                <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-email">Email address</Label>
                <Input id="p-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-current">Current password (to change password)</Label>
                <Input id="p-current" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-new">New password</Label>
                <Input id="p-new" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                <p className="text-xs text-muted-foreground">At least 8 characters</p>
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
            {message && (
              <div className="p-3 rounded-lg border border-green-200 bg-green-50 text-green-800 text-sm">{message}</div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Danger zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Deleting your account is permanent and cannot be undone. All your courses, materials, quizzes, and data will be removed.
            </p>
            <Button variant="destructive" onClick={deleteAccount} className="w-full">
              Delete account
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 flex justify-end">
        <Link href="/dashboard" className="text-sm text-primary underline">← Back to dashboard</Link>
      </div>
    </div>
  );
}
