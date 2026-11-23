"use client";

import React, { useState, useEffect } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { FileCode, Plus, Edit } from "lucide-react";

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);

  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await api.get<any[]>('/api/products');
        if (Array.isArray(res)) {
          const list: any[] = [];
          for (const p of res) {
            if (Array.isArray(p.templates)) {
              for (const t of p.templates) {
                list.push({
                  id: t.id || `${p.slug}-${t.name}`,
                  name: t.name || `${p.name} Template`,
                  product: p.name,
                  printArea: `${p.min_width_mm || 90}×${p.min_height_mm || 50} mm (Bleed ${p.bleed_mm || 3}mm)`,
                  placeholders: Array.isArray(t.placeholders)
                    ? t.placeholders.map((ph: any) => ph.key || String(ph))
                    : ['bib_number', 'runner_name'],
                });
              }
            }
          }
          setTemplates(list);
        }
      } catch {}
    }
    loadTemplates();
  }, []);

  return (
    <AdminShell
      title="Templates & Print Area Boundaries"
      subtitle="Define bounding boxes, minimum font constraints, and variable text fitting rules."
      actions={
        <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
          New Template
        </Button>
      }
    >
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Template Name</TableHead>
              <TableHead>Associated Product</TableHead>
              <TableHead>Physical Print Area</TableHead>
              <TableHead>Configured Placeholders</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-xs text-ink-muted">
                  No visual designer templates configured.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-bold text-xs text-plum">{t.name}</TableCell>
                  <TableCell className="text-xs text-ink">{t.product}</TableCell>
                  <TableCell className="text-xs text-ink-muted">{t.printArea}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {t.placeholders.map((ph: string) => (
                        <Badge key={ph} variant="secondary">
                          {ph}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-3.5 h-3.5" />
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
