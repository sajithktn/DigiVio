"use client";

import React, { useState } from "react";
import { AdminShell } from "@/components/layout/admin-shell";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/select";
import { DIVISIONS } from "@/components/layout/navbar";
import { Plus, Edit, Trash2, Package } from "lucide-react";

export default function AdminProductsCrudPage() {
  const [products, setProducts] = useState([
    {
      id: "prod-1",
      name: "Custom Contour Labels",
      division: "Labels & Stickers",
      basePriceMinor: 29900,
      limits: "30-300W × 30-300H mm",
      minQty: 50,
      materialsCount: 3,
    },
    {
      id: "prod-2",
      name: "Tyvek Race & Event Bibs",
      division: "Race & Event Numbers",
      basePriceMinor: 45000,
      limits: "140-220W × 100-160H mm",
      minQty: 100,
      materialsCount: 1,
    },
    {
      id: "prod-3",
      name: "Downhill MTB Number Plates",
      division: "MTB Boards",
      basePriceMinor: 39900,
      limits: "160-200W × 140-180H mm",
      minQty: 25,
      materialsCount: 1,
    },
    {
      id: "prod-4",
      name: "Self-Inking Rubber Stamps",
      division: "Stamps",
      basePriceMinor: 59900,
      limits: "40-75W × 15-40H mm",
      minQty: 1,
      materialsCount: 1,
    },
  ]);

  const [modalOpen, setModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdDivision, setNewProdDivision] = useState(DIVISIONS[0].slug);
  const [newProdBasePrice, setNewProdBasePrice] = useState(299);

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return;

    const divObj = DIVISIONS.find((d) => d.slug === newProdDivision);
    setProducts((prev) => [
      ...prev,
      {
        id: "prod-" + Date.now(),
        name: newProdName,
        division: divObj?.name || "Labels & Stickers",
        basePriceMinor: newProdBasePrice * 100,
        limits: "50-500W × 50-500H mm",
        minQty: 50,
        materialsCount: 1,
      },
    ]);
    setModalOpen(false);
    setNewProdName("");
  };

  return (
    <AdminShell
      title="Catalogue Management (CRUD)"
      subtitle="Configure products, size boundaries, material stocks, and ascending volume discount brackets without application rebuilds."
      actions={
        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Product
        </Button>
      }
    >
      <div className="space-y-6">
        <Table>
          <TableHeader>
            <tr>
              <TableHead>Product Name</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Base Unit Price</TableHead>
              <TableHead>Allowed Dimensions</TableHead>
              <TableHead>Min Units</TableHead>
              <TableHead>Materials</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </tr>
          </TableHeader>
          <tbody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-bold text-plum">{p.name}</TableCell>
                <TableCell>
                  <Badge variant="primary">{p.division}</Badge>
                </TableCell>
                <TableCell className="font-heading font-semibold text-primary tabular-nums">
                  ₹{(p.basePriceMinor / 100).toFixed(2)}
                </TableCell>
                <TableCell className="text-xs text-ink-muted">{p.limits}</TableCell>
                <TableCell className="tabular-nums text-xs">{p.minQty}</TableCell>
                <TableCell className="text-xs">{p.materialsCount} stocks</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-danger hover:bg-danger/10"
                    onClick={() => setProducts((prev) => prev.filter((x) => x.id !== p.id))}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Modal: Add Product */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Product to Catalogue"
        description="Creates live entry across products API, configurator, and instant quote engine"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4">
          <Input
            label="Product Name"
            value={newProdName}
            onChange={(e) => setNewProdName(e.target.value)}
            placeholder="e.g. Metallic Foil Sticker Decals"
            required
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink">
              Division
            </label>
            <select
              value={newProdDivision}
              onChange={(e) => setNewProdDivision(e.target.value)}
              className="w-full rounded-btn border border-line p-2.5 text-xs text-ink outline-none focus:border-primary"
            >
              {DIVISIONS.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Base Starting Price (INR)"
            type="number"
            value={newProdBasePrice}
            onChange={(e) => setNewProdBasePrice(Number(e.target.value))}
            min={10}
            required
          />

          <div className="pt-4 border-t border-line flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Product
            </Button>
          </div>
        </form>
      </Modal>
    </AdminShell>
  );
}
