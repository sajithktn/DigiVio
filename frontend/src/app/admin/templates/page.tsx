"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileCode, Plus, Edit } from "lucide-react";

export default function AdminTemplatesPage() {
  const templates = [
    {
      id: "tpl-1",
      name: "Tyvek Marathon Bib Standard",
      product: "Tyvek Race & Event Bibs",
      printArea: "200×140mm (centered)",
      placeholders: ["runner_number", "runner_name", "category"],
    },
    {
      id: "tpl-2",
      name: "Contour Label Circular Die",
      product: "Custom Contour Labels",
      printArea: "76×76mm (diameter 76mm)",
      placeholders: ["brand_title", "barcode"],
    },
    {
      id: "tpl-3",
      name: "Downhill MTB Plate Front",
      product: "MTB Boards",
      printArea: "170×150mm (with zip tie notches)",
      placeholders: ["plate_number", "sponsor_logo"],
    },
  ];

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
            {templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-bold text-xs text-plum">{t.name}</TableCell>
                <TableCell className="text-xs text-ink">{t.product}</TableCell>
                <TableCell className="text-xs text-ink-muted">{t.printArea}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {t.placeholders.map((ph) => (
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
            ))}
          </tbody>
        </Table>
      </div>
    </AdminShell>
  );
}
