import { supabaseAdmin, isSupabaseConfigured } from '../../config/supabase.js';
import { ApiError } from '../../utils/api-error.js';
import { IN_MEMORY_ORDERS } from '../orders/orders.service.js';
import crypto from 'crypto';

export type ProofStatus = 'pending' | 'approved' | 'changes_requested' | 'superseded';

export interface ProofRecord {
  id: string;
  order_item_id: string;
  order_id: string;
  version: number;
  canvas_snapshot: Record<string, any>;
  snapshot_hash: string;
  preview_path: string;
  status: ProofStatus;
  owner_user_id: string;
  created_at: string;
}

export interface ProofEvent {
  id: string;
  proof_id: string;
  version: number;
  event: 'created' | 'approved' | 'changes_requested';
  actor_id: string;
  message?: string;
  created_at: string;
}

// In-memory stores for resilience / testing
export const IN_MEMORY_PROOFS = new Map<string, ProofRecord>();
export const IN_MEMORY_PROOF_EVENTS: ProofEvent[] = [];
export const IN_MEMORY_ORDERS_STATE = new Map<string, { files_unlocked: boolean; status: string }>();

export class ProofsService {
  /**
   * Calculate SHA-256 hash of immutable canvas snapshot
   */
  hashSnapshot(snapshot: Record<string, any>): string {
    const serialized = JSON.stringify(snapshot, Object.keys(snapshot).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Create next proof version (v1, v2...)
   * Automatically marks any previous pending proof as 'superseded'
   */
  async createProof(
    orderItemId: string,
    orderId: string,
    ownerUserId: string,
    canvasSnapshot: Record<string, any> = { background: '#ffffff', elements: [] }
  ): Promise<ProofRecord> {
    const timestamp = new Date().toISOString();
    const existing = await this.getProofsByOrderItem(orderItemId, ownerUserId, true);

    // Mark previous pending proof as superseded
    existing.forEach((p) => {
      if (p.status === 'pending') {
        p.status = 'superseded';
        IN_MEMORY_PROOFS.set(p.id, p);
      }
    });

    const nextVersion = existing.length > 0 ? Math.max(...existing.map((p) => p.version)) + 1 : 1;
    const proofId = crypto.randomUUID();
    const snapshotHash = this.hashSnapshot(canvasSnapshot);

    const newProof: ProofRecord = {
      id: proofId,
      order_item_id: orderItemId,
      order_id: orderId,
      version: nextVersion,
      canvas_snapshot: canvasSnapshot,
      snapshot_hash: snapshotHash,
      preview_path: `/previews/${orderId}/${orderItemId}_v${nextVersion}.png`,
      status: 'pending',
      owner_user_id: ownerUserId,
      created_at: timestamp,
    };

    IN_MEMORY_PROOFS.set(proofId, newProof);

    // Log creation event
    IN_MEMORY_PROOF_EVENTS.push({
      id: crypto.randomUUID(),
      proof_id: proofId,
      version: nextVersion,
      event: 'created',
      actor_id: ownerUserId,
      created_at: timestamp,
    });

    return newProof;
  }

  /**
   * List proofs for an order item with ownership isolation
   */
  async getMyProofs(userId: string, isAdmin: boolean = false): Promise<ProofRecord[]> {
    if (isSupabaseConfigured) {
      try {
        let query = supabaseAdmin
          .from('proofs')
          .select(`
            *,
            order_items!inner(
              id,
              order_id,
              product_id,
              orders!inner(id, order_no, user_id)
            )
          `)
          .order('created_at', { ascending: false });

        if (!isAdmin) {
          query = query.eq('order_items.orders.user_id', userId);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data;
        }
      } catch (err) {
        console.warn('Supabase getMyProofs fallback:', err);
      }
    }

    const all = Array.from(IN_MEMORY_PROOFS.values());
    if (isAdmin) return all;
    return all.filter((p) => p.owner_user_id === userId);
  }

  /**
   * List proofs for an order item with ownership isolation
   */
  async getProofsByOrderItem(
    orderItemId: string,
    userId: string,
    isAdmin: boolean = false
  ): Promise<ProofRecord[]> {
    const proofs = Array.from(IN_MEMORY_PROOFS.values()).filter(
      (p) => p.order_item_id === orderItemId
    );

    if (proofs.length > 0 && !isAdmin && proofs[0].owner_user_id !== userId) {
      throw ApiError.forbidden('Access denied. You do not own this order item.');
    }

    return proofs.sort((a, b) => a.version - b.version);
  }

  /**
   * Customer approves proof
   * STRICT GATES:
   * 1. Only owner (or admin).
   * 2. Must be status 'pending'.
   * 3. Must be the LATEST version (approving superseded -> 409).
   */
  async approveProof(proofId: string, userId: string, isAdmin: boolean = false): Promise<ProofRecord> {
    const timestamp = new Date().toISOString();
    let proof = IN_MEMORY_PROOFS.get(proofId);

    if (!proof) {
      proof = Array.from(IN_MEMORY_PROOFS.values()).find(
        (p) => p.order_id === proofId || p.id === proofId
      );
    }

    if (!proof) {
      throw ApiError.notFound('Proof not found.');
    }

    // Ownership gate: another customer cannot approve my proof
    if (proof.owner_user_id !== userId && !isAdmin) {
      throw ApiError.forbidden('Access denied. You can only approve your own proofs.');
    }

    // Version gate: verify if proof is superseded or older version
    const allVersions = await this.getProofsByOrderItem(proof.order_item_id, userId, true);
    const latestVersion = Math.max(...allVersions.map((p) => p.version));

    if (proof.version < latestVersion || proof.status === 'superseded') {
      throw ApiError.conflict(`Cannot approve older version v${proof.version}. Latest is v${latestVersion}.`);
    }

    if (proof.status !== 'pending') {
      throw ApiError.conflict(`Proof is already in '${proof.status}' status.`);
    }

    // Update status to approved
    proof.status = 'approved';
    IN_MEMORY_PROOFS.set(proof.id, proof);

    // Unlock files on the master order and set to production
    IN_MEMORY_ORDERS_STATE.set(proof.order_id, {
      files_unlocked: true,
      status: 'production',
    });

    const masterOrder =
      IN_MEMORY_ORDERS.get(proof.order_id) ||
      Array.from(IN_MEMORY_ORDERS.values()).find((o) => o.order_no === proof.order_id || o.id === proof.order_id);
    if (masterOrder) {
      masterOrder.files_unlocked = true;
      masterOrder.status = 'production';
      IN_MEMORY_ORDERS.set(masterOrder.id, masterOrder);
      if (masterOrder.order_no) IN_MEMORY_ORDERS.set(masterOrder.order_no, masterOrder);
    }

    // Write audit event
    IN_MEMORY_PROOF_EVENTS.push({
      id: crypto.randomUUID(),
      proof_id: proof.id,
      version: proof.version,
      event: 'approved',
      actor_id: userId,
      message: 'Proof approved by customer. Files unlocked.',
      created_at: timestamp,
    });

    return proof;
  }

  /**
   * Customer requests changes
   * Moves proof to 'changes_requested' and order back to 'artwork'
   */
  async requestChanges(
    proofId: string,
    userId: string,
    message: string,
    isAdmin: boolean = false
  ): Promise<ProofRecord> {
    const timestamp = new Date().toISOString();
    let proof = IN_MEMORY_PROOFS.get(proofId);

    if (!proof) {
      proof = Array.from(IN_MEMORY_PROOFS.values()).find(
        (p) => p.order_id === proofId || p.id === proofId
      );
    }

    if (!proof) {
      throw ApiError.notFound('Proof not found.');
    }

    if (proof.owner_user_id !== userId && !isAdmin) {
      throw ApiError.forbidden('Access denied. You can only request changes on your own proofs.');
    }

    proof.status = 'changes_requested';
    IN_MEMORY_PROOFS.set(proofId, proof);

    // Move order status back to 'artwork'
    IN_MEMORY_ORDERS_STATE.set(proof.order_id, {
      files_unlocked: false,
      status: 'artwork',
    });

    // Write audit event
    IN_MEMORY_PROOF_EVENTS.push({
      id: crypto.randomUUID(),
      proof_id: proof.id,
      version: proof.version,
      event: 'changes_requested',
      actor_id: userId,
      message,
      created_at: timestamp,
    });

    return proof;
  }

  /**
   * Get proof events log for auditing
   */
  getEventsByProofId(proofId: string): ProofEvent[] {
    return IN_MEMORY_PROOF_EVENTS.filter((e) => e.proof_id === proofId);
  }
}

export const proofsService = new ProofsService();
