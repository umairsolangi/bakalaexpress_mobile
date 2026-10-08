import { apiClient, ClientResponse } from './client';
import {
  RiderAvailableOrder,
  RiderDashboardData,
  RiderHistoryOrder,
  RiderOrderDetail,
} from './types';

/**
 * 1. Fetch rider dashboard statistics & active assigned orders.
 * GET /api/v1/rider/dashboard
 */
export async function getRiderDashboard(): Promise<ClientResponse<RiderDashboardData>> {
  return apiClient<RiderDashboardData>('rider/dashboard', {
    method: 'GET',
  });
}

/**
 * 2. Toggle rider status between 'online' and 'offline'.
 * POST /api/v1/rider/status
 */
export async function updateRiderStatus(
  status: 'online' | 'offline'
): Promise<ClientResponse<{ id: number; name: string; status: string }>> {
  return apiClient<{ id: number; name: string; status: string }>('rider/status', {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
}

/**
 * 3. Fetch orders that are ready for pickup (pool of available deliveries).
 * GET /api/v1/rider/orders/available
 */
export async function getAvailableOrders(
  page = 1,
  perPage = 15
): Promise<ClientResponse<RiderAvailableOrder[]>> {
  return apiClient<RiderAvailableOrder[]>(
    `rider/orders/available?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
    }
  );
}

/**
 * 4. Fetch orders currently accepted/assigned to this rider.
 * GET /api/v1/rider/orders/current
 */
export async function getCurrentOrders(): Promise<ClientResponse<RiderOrderDetail[]>> {
  return apiClient<RiderOrderDetail[]>('rider/orders/current', {
    method: 'GET',
  });
}

/**
 * 5. Fetch single rider order details.
 * GET /api/v1/rider/orders/{orderId}
 */
export async function getRiderOrderDetail(
  orderId: number
): Promise<ClientResponse<RiderOrderDetail>> {
  return apiClient<RiderOrderDetail>(`rider/orders/${orderId}`, {
    method: 'GET',
  });
}

/**
 * 6. Accept an available delivery order.
 * POST /api/v1/rider/orders/{orderId}/accept
 */
export async function acceptRiderOrder(
  orderId: number
): Promise<ClientResponse<RiderOrderDetail>> {
  return apiClient<RiderOrderDetail>(`rider/orders/${orderId}/accept`, {
    method: 'POST',
  });
}

/**
 * 7. Mark order as picked up from the merchant shop.
 * POST /api/v1/rider/orders/{orderId}/pickup
 */
export async function pickupRiderOrder(
  orderId: number
): Promise<ClientResponse<RiderOrderDetail>> {
  return apiClient<RiderOrderDetail>(`rider/orders/${orderId}/pickup`, {
    method: 'POST',
  });
}

/**
 * 8. Mark order as delivered to customer (optionally with proof image).
 * POST /api/v1/rider/orders/{orderId}/deliver
 */
export async function deliverRiderOrder(
  orderId: number,
  proofImageUri?: string
): Promise<ClientResponse<RiderOrderDetail>> {
  if (proofImageUri) {
    const formData = new FormData();
    const filename = proofImageUri.split('/').pop() || 'proof.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('proof_image', {
      uri: proofImageUri,
      name: filename,
      type,
    } as any);

    return apiClient<RiderOrderDetail>(`rider/orders/${orderId}/deliver`, {
      method: 'POST',
      body: formData,
    });
  }

  return apiClient<RiderOrderDetail>(`rider/orders/${orderId}/deliver`, {
    method: 'POST',
  });
}

/**
 * 9. Fetch rider delivered orders history.
 * GET /api/v1/rider/history
 */
export async function getRiderHistory(
  from?: string,
  to?: string,
  page = 1,
  perPage = 15
): Promise<ClientResponse<RiderHistoryOrder[]>> {
  const params = new URLSearchParams();
  if (from) params.append('from', from);
  if (to) params.append('to', to);
  params.append('page', String(page));
  params.append('per_page', String(perPage));

  return apiClient<RiderHistoryOrder[]>(`rider/history?${params.toString()}`, {
    method: 'GET',
  });
}
