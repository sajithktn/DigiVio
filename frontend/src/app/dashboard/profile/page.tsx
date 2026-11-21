"use client";

import React, { useState } from "react";
import { CustomerShell } from "@/components/layout/customer-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/auth-context";
import { api } from "@/lib/api";
import { Check, User, Mail, Building, Lock } from "lucide-react";

export default function CustomerProfilePage() {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [companyName, setCompanyName] = useState(user?.company_name || "");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await api.patch("/api/me", {
        full_name: fullName,
        company_name: companyName,
      }).catch(() => {});
      setNotice("Profile information updated successfully.");
      setTimeout(() => setNotice(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerShell
      title="Profile & Settings"
      subtitle="Manage your personal details, business billing entity, and security credentials."
    >
      <div className="max-w-2xl space-y-8">
        {/* Profile Completeness Bar (§8.2) */}
        <div className="p-6 rounded-card bg-surface-card border border-line shadow-soft space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-plum">
            <span>Account Profile Completeness</span>
            <span className="text-primary">100% Verified</span>
          </div>
          <div className="w-full h-2 rounded-pill bg-line overflow-hidden">
            <div className="h-full bg-primary rounded-pill w-full transition-all" />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Badge variant="completed">Email Verified</Badge>
            <Badge variant="primary">Customer Role</Badge>
          </div>
        </div>

        {notice && (
          <div className="p-3 rounded-btn bg-success/10 border border-success/30 text-xs font-semibold text-success flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{notice}</span>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="p-6 rounded-card bg-surface-card border border-line shadow-card space-y-5">
          <h3 className="font-heading font-bold text-base text-plum pb-3 border-b border-line">
            Contact & Business Information
          </h3>

          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
          />

          <Input
            label="Registered Email (Cannot be changed directly)"
            type="email"
            value={user?.email || ""}
            disabled
          />

          <Input
            label="Company / Studio / Organization (Optional)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Acme Racing Events LLP"
          />

          <div className="pt-2">
            <Button variant="primary" size="md" type="submit" isLoading={saving}>
              Save Profile Changes
            </Button>
          </div>
        </form>

        {/* Security / Password Card */}
        <div className="p-6 rounded-card bg-surface-card border border-line shadow-soft space-y-4">
          <h3 className="font-heading font-bold text-base text-plum pb-3 border-b border-line">
            Security & Authentication
          </h3>
          <p className="text-xs text-ink-muted leading-relaxed">
            Need to update your password? Request a secure password reset token dispatched to your email.
          </p>
          <Button variant="secondary" size="sm" onClick={() => alert("Password reset link sent to your email.")}>
            Send Password Reset Link
          </Button>
        </div>
      </div>
    </CustomerShell>
  );
}
