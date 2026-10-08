import { apiClient, ClientResponse } from './client';
import {
  ApplyPromoResponse,
  CartItemInput,
  CartValidationResponse,
  OrderDetailItem,
  OrderListItem,
  OrderMessageItem,
  PlaceOrderPayload,
  ReorderPreviewResponse,
} from './types';

/**
 * Generate a random unique Idempotency Key (between 16 and 64 characters)
 */
export function generateIdempotencyKey(): string {
  const rand1 = Math.random().toString(36).substring(2, 15);
  const rand2 = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  return `bkla_${timestamp}_${rand1}${rand2}`.slice(0, 64);
}

/**
 * 1. Validate cart items live stock and unit prices.
 * POST /api/v1/customer/cart/validate
 */
export async function validateCart(
  items: CartItemInput[]
): Promise<ClientResponse<CartValidationResponse>> {
  return apiClient<CartValidationResponse>('customer/cart/validate', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

/**
 * 2. Apply a promotional discount code to cart items.
 * POST /api/v1/customer/checkout/apply-promo
 */
export async function applyPromo(
  items: CartItemInput[],
  code: string
): Promise<ClientResponse<ApplyPromoResponse>> {
  return apiClient<ApplyPromoResponse>('customer/checkout/apply-promo', {
    method: 'POST',
    body: JSON.stringify({ items, code }),
  });
}

/**
 * 3. Place a new order (Cash on Delivery).
 * POST /api/v1/customer/orders
 */
export async function placeOrder(
  payload: PlaceOrderPayload,
  idempotencyKey?: string
): Promise<ClientResponse<OrderDetailItem>> {
  const key = idempotencyKey || generateIdempotencyKey();
  return apiClient<OrderDetailItem>('customer/orders', {
    method: 'POST',
    headers: {
      'Idempotency-Key': key,
    },
    body: JSON.stringify(payload),
  });
}

/**
 * 4. Get active orders (pending, preparing, rider assigned, picked up).
 * GET /api/v1/customer/orders/active
 */
export async function getActiveOrders(
  page = 1,
  perPage = 15
): Promise<ClientResponse<OrderListItem[]>> {
  return apiClient<OrderListItem[]>(
    `customer/orders/active?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
    }
  );
}

/**
 * 5. Get customer order history (delivered, completed, cancelled, rejected).
 * GET /api/v1/customer/orders/history
 */
export async function getOrderHistory(
  page = 1,
  perPage = 15
): Promise<ClientResponse<OrderListItem[]>> {
  return apiClient<OrderListItem[]>(
    `customer/orders/history?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
    }
  );
}

/**
 * 6. Get complete single order details.
 * GET /api/v1/customer/orders/{orderId}
 */
export async function getOrderDetail(
  orderId: number
): Promise<ClientResponse<OrderDetailItem>> {
  return apiClient<OrderDetailItem>(`customer/orders/${orderId}`, {
    method: 'GET',
  });
}

/**
 * 7. Preview reordering items with live stock & prices.
 * GET /api/v1/customer/orders/{orderId}/reorder
 */
export async function getReorderPreview(
  orderId: number
): Promise<ClientResponse<ReorderPreviewResponse>> {
  return apiClient<ReorderPreviewResponse>(`customer/orders/${orderId}/reorder`, {
    method: 'GET',
  });
}

/**
 * 8. Cancel an active order before pickup.
 * POST /api/v1/customer/orders/{orderId}/cancel
 */
export async function cancelOrder(
  orderId: number,
  reason?: string
): Promise<ClientResponse<OrderDetailItem>> {
  return apiClient<OrderDetailItem>(`customer/orders/${orderId}/cancel`, {
    method: 'POST',
    body: JSON.stringify(reason ? { reason } : {}),
  });
}

/**
 * 9. Submit rating & review feedback for delivered order.
 * POST /api/v1/customer/orders/{orderId}/feedback
 */
export async function submitOrderFeedback(
  orderId: number,
  rating: number,
  feedback: string
): Promise<ClientResponse<{ order_id: number; rating: number; feedback: string }>> {
  return apiClient<{ order_id: number; rating: number; feedback: string }>(
    `customer/orders/${orderId}/feedback`,
    {
      method: 'POST',
      body: JSON.stringify({ rating, feedback }),
    }
  );
}

/**
 * 10. Fetch order chat messages.
 * GET /api/v1/customer/orders/{orderId}/messages
 */
export async function getOrderMessages(
  orderId: number,
  sinceId?: number,
  limit = 40
): Promise<ClientResponse<OrderMessageItem[]>> {
  const params = new URLSearchParams();
  if (sinceId !== undefined && sinceId > 0) {
    params.append('since_id', String(sinceId));
  }
  params.append('limit', String(limit));

  return apiClient<OrderMessageItem[]>(
    `customer/orders/${orderId}/messages?${params.toString()}`,
    {
      method: 'GET',
    }
  );
}

/**
 * 11. Send a chat message on an order.
 * POST /api/v1/customer/orders/{orderId}/messages
 */
export async function sendOrderMessage(
  orderId: number,
  message: string
): Promise<ClientResponse<OrderMessageItem>> {
  return apiClient<OrderMessageItem>(`customer/orders/${orderId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * 12. Mark order messages as read.
 * POST /api/v1/customer/orders/{orderId}/messages/read
 */
export async function markOrderMessagesRead(
  orderId: number
): Promise<ClientResponse<{ order_id: number; read_count: number }>> {
  return apiClient<{ order_id: number; read_count: number }>(
    `customer/orders/${orderId}/messages/read`,
    {
      method: 'POST',
    }
  );
}
