"use client";

import React, { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { Users, ShieldCheck, UserX } from "lucide-react";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await api.get<any[]>("/api/admin/users");
        if (Array.isArray(res)) {
          setUsers(
            res.map((u: any) => ({
              id: u.id,
              email: u.email,
              fullName: u.full_name || u.email,
              role: u.role || "customer",
              ordersCount: u.order_counts?.total || 0,
              status: u.is_active !== false ? "active" : "inactive",
            }))
          );
        }
      } catch {}
    }
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    const newRole = target.role === "admin" ? "customer" : "admin";
    try {
      await api.patch(`/api/admin/users/${userId}`, { role: newRole }).catch(() => {});
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } catch {}
  };

  return (
    <AdminShell
      title="User & Customer Accounts"
      subtitle="Supervise customer accounts, audit order frequency, and assign administrator privileges."
    >
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>User / Customer</TableHead>
              <TableHead>Email Address</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Manage Role</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-xs text-ink-muted">
                  No user accounts found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-bold text-xs text-plum">{u.fullName}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "primary" : "secondary"}>
                      {u.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="tabular-nums text-xs">{u.ordersCount} orders</TableCell>
                  <TableCell>
                    <span className="text-xs font-semibold text-success flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" /> Active
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleRole(u.id)}
                      className="text-xs"
                    >
                      Switch to {u.role === "admin" ? "Customer" : "Admin"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </AdminShell>
  );
}
