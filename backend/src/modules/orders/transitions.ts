import { ApiError } from '../../utils/api-error.js';

export type OrderStatus =
  | 'quote'
  | 'order'
  | 'artwork'
  | 'proof'
  | 'production'
  | 'completed'
  | 'cancelled';

export interface TransitionCheckParams {
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  filesUnlocked: boolean;
  paymentStatus: 'unpaid' | 'paid' | 'failed' | 'refunded';
}

/**
 * Allowed forward and rollback transitions in the Print Pipeline
 */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  quote: ['order', 'cancelled'],
  order: ['artwork', 'cancelled'],
  artwork: ['proof', 'cancelled'],
  proof: ['production', 'artwork', 'cancelled'],
  production: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

/**
 * Validates whether a state transition is legal per pipeline rules
 */
export const validateTransition = (params: TransitionCheckParams): void => {
  const { fromStatus, toStatus, filesUnlocked, paymentStatus } = params;

  if (fromStatus === toStatus) {
    return;
  }

  const allowed = ALLOWED_TRANSITIONS[fromStatus] || [];
  if (!allowed.includes(toStatus)) {
    throw ApiError.conflict(
      `Invalid pipeline transition from '${fromStatus}' to '${toStatus}'. Allowed transitions: [${allowed.join(', ')}].`
    );
  }

  // Hard gate on moving to 'production'
  if (toStatus === 'production') {
    if (!filesUnlocked) {
      throw ApiError.conflict(
        `Cannot transition to 'production': proofs must be approved and files unlocked first.`
      );
    }
    if (paymentStatus !== 'paid') {
      throw ApiError.conflict(
        `Cannot transition to 'production': order payment status must be 'paid' (current: '${paymentStatus}').`
      );
    }
  }
};
