import { supabaseAdmin, isSupabaseConfigured } from '../../config/supabase.js';
import { ApiError } from '../../utils/api-error.js';
import { clampToPrintArea, CanvasElement, PrintArea } from '../printfile/fit.js';
import crypto from 'crypto';

export interface DesignConfig {
  width_mm: number;
  height_mm: number;
  material_id?: string;
  options?: Record<string, any>;
  qty?: number;
  [key: string]: any;
}

export interface DesignData {
  id?: string;
  user_id: string;
  product_id?: string;
  template_id?: string;
  name?: string;
  config: DesignConfig;
  canvas_json?: {
    elements?: CanvasElement[];
    background?: string;
    [key: string]: any;
  };
  upload_path?: string;
  thumbnail_path?: string;
  is_approved?: boolean;
  created_at?: string;
}

// In-memory store for fallback / offline development & testing
export const IN_MEMORY_DESIGNS: Map<string, DesignData> = new Map();

export class DesignsService {
  /**
   * Save a design. Elements are strictly clamped within print boundaries.
   */
  async saveDesign(userId: string, data: Omit<DesignData, 'user_id' | 'id'>): Promise<DesignData> {
    const defaultPrintArea: PrintArea = {
      x: 0,
      y: 0,
      w: data.config.width_mm || 100,
      h: data.config.height_mm || 100,
    };

    // Clamp elements to print area
    let clampedCanvas = data.canvas_json;
    if (clampedCanvas && Array.isArray(clampedCanvas.elements)) {
      clampedCanvas = {
        ...clampedCanvas,
        elements: clampedCanvas.elements.map((el) => clampToPrintArea(el, defaultPrintArea)),
      };
    }

    const designId = crypto.randomUUID();
    const newDesign: DesignData = {
      id: designId,
      user_id: userId,
      product_id: data.product_id,
      template_id: data.template_id,
      name: data.name || 'Untitled Artwork',
      config: data.config,
      canvas_json: clampedCanvas,
      upload_path: data.upload_path,
      thumbnail_path: data.thumbnail_path,
      is_approved: false,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const { data: dbDesign, error } = await supabaseAdmin
          .from('designs')
          .insert(newDesign)
          .select()
          .single();

        if (!error && dbDesign) {
          return dbDesign as DesignData;
        }
      } catch (err) {
        console.warn('Supabase design save failed, using local fallback:', err);
      }
    }

    IN_MEMORY_DESIGNS.set(designId, newDesign);
    return newDesign;
  }

  /**
   * Get all designs belonging to the authenticated user
   */
  async getMyDesigns(userId: string): Promise<DesignData[]> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('designs')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as DesignData[];
        }
      } catch (err) {
        console.warn('Supabase get designs fallback:', err);
      }
    }

    return Array.from(IN_MEMORY_DESIGNS.values()).filter((d) => d.user_id === userId);
  }

  /**
   * Get single design with ownership verification
   */
  async getDesignById(userId: string, designId: string, isAdmin: boolean = false): Promise<DesignData> {
    let design: DesignData | undefined;

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabaseAdmin
          .from('designs')
          .select('*')
          .eq('id', designId)
          .single();

        if (!error && data) {
          design = data as DesignData;
        }
      } catch (err) {
        console.warn('Supabase lookup failed:', err);
      }
    }

    if (!design) {
      design = IN_MEMORY_DESIGNS.get(designId);
    }

    if (!design) {
      throw ApiError.notFound('Design not found.');
    }

    // Ownership check: User A cannot read User B's design
    if (design.user_id !== userId && !isAdmin) {
      throw ApiError.forbidden('Access denied. You do not own this design.');
    }

    return design;
  }

  /**
   * Update design configuration or canvas
   */
  async updateDesign(
    userId: string,
    designId: string,
    data: Partial<DesignData>,
    isAdmin: boolean = false
  ): Promise<DesignData> {
    const existing = await this.getDesignById(userId, designId, isAdmin);

    const updated: DesignData = {
      ...existing,
      ...data,
      id: existing.id,
      user_id: existing.user_id, // Prevent ownership spoofing
    };

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('designs').update(updated).eq('id', designId);
      } catch (err) {
        console.warn('Supabase update failed:', err);
      }
    }

    IN_MEMORY_DESIGNS.set(designId, updated);
    return updated;
  }

  /**
   * Delete design
   */
  async deleteDesign(userId: string, designId: string, isAdmin: boolean = false): Promise<void> {
    await this.getDesignById(userId, designId, isAdmin);

    if (isSupabaseConfigured) {
      try {
        await supabaseAdmin.from('designs').delete().eq('id', designId);
      } catch (err) {
        console.warn('Supabase delete failed:', err);
      }
    }

    IN_MEMORY_DESIGNS.delete(designId);
  }
}

export const designsService = new DesignsService();
