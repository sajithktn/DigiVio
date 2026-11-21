export type ProofStatus = 'pending' | 'approved' | 'revision_requested';

export interface ProofSummary {
  id: string;
  order_item_id: string;
  order_id: string;
  version_number: number;
  proof_preview_url: string;
  status: ProofStatus;
  feedback_notes?: string | null;
  approved_at?: string | null;
  approved_by?: string | null;
  created_at: string;
}

export interface CreateProofRevisionDTO {
  order_item_id: string;
  proof_preview_url: string;
  notes?: string;
}

export interface ApproveProofDTO {
  proof_id: string;
}

export interface RequestProofRevisionDTO {
  feedback_notes: string;
}
