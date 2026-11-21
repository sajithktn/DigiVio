"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, UserX } from "lucide-react";

export default function AdminCustomersPage() {
  const [users, setUsers] = useState([
    {
      id: "usr-1",
      email: "rahul@example.com",
      fullName: "Rahul Sharma",
      role: "customer",
      ordersCount: 3,
      status: "active",
    },
    {
      id: "usr-2",
      email: "events@citymarathon.in",
      fullName: "Ananya Deshmukh",
      role: "customer",
      ordersCount: 8,
      status: "active",
    },
    {
      id: "usr-3",
      email: "pressmaster@digivio.com",
      fullName: "Sajit Admin",
      role: "admin",
      ordersCount: 0,
      status: "active",
    },
  ]);

  const toggleRole = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newRole = u.role === "admin" ? "customer" : "admin";
          return { ...u, role: newRole };
        }
        return u;
      })
    );
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
            {users.map((u) => (
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
            ))}
          </tbody>
        </Table>
      </div>
    </AdminShell>
  );
}
