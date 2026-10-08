import { apiClient, ClientResponse } from './client';
import {
  SellerAvailableProductItem,
  SellerDashboardData,
  SellerEarningsData,
  SellerListingItem,
  SellerOperatingHoursData,
  SellerOrderDetailData,
  SellerOrderShortItem,
  SellerVerificationDetail,
  SellerVerificationStatusData,
} from './types';

/**
 * 1. Fetch seller dashboard overview with order counts & daily sales.
 * GET /api/v1/seller/dashboard
 */
export async function getSellerDashboard(): Promise<ClientResponse<SellerDashboardData>> {
  return apiClient<SellerDashboardData>('seller/dashboard', {
    method: 'GET',
  });
}

/**
 * 2. Fetch paginated seller orders list, optionally filtered by status.
 * GET /api/v1/seller/orders
 */
export async function getSellerOrders(
  status?: string,
  page = 1,
  perPage = 15
): Promise<ClientResponse<SellerOrderShortItem[]>> {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  params.append('page', String(page));
  params.append('per_page', String(perPage));

  return apiClient<SellerOrderShortItem[]>(`seller/orders?${params.toString()}`, {
    method: 'GET',
  });
}

/**
 * 3. Fetch full order details for merchant fulfillment.
 * GET /api/v1/seller/orders/{orderId}
 */
export async function getSellerOrderDetail(
  orderId: number
): Promise<ClientResponse<SellerOrderDetailData>> {
  return apiClient<SellerOrderDetailData>(`seller/orders/${orderId}`, {
    method: 'GET',
  });
}

/**
 * 4. Confirm an incoming pending order.
 * POST /api/v1/seller/orders/{orderId}/confirm
 */
export async function confirmSellerOrder(
  orderId: number
): Promise<ClientResponse<SellerOrderDetailData>> {
  return apiClient<SellerOrderDetailData>(`seller/orders/${orderId}/confirm`, {
    method: 'POST',
  });
}

/**
 * 5. Move order to 'preparing' status.
 * POST /api/v1/seller/orders/{orderId}/prepare
 */
export async function prepareSellerOrder(
  orderId: number
): Promise<ClientResponse<SellerOrderDetailData>> {
  return apiClient<SellerOrderDetailData>(`seller/orders/${orderId}/prepare`, {
    method: 'POST',
  });
}

/**
 * 6. Mark order ready for rider pickup.
 * POST /api/v1/seller/orders/{orderId}/ready
 */
export async function readySellerOrder(
  orderId: number
): Promise<ClientResponse<SellerOrderDetailData>> {
  return apiClient<SellerOrderDetailData>(`seller/orders/${orderId}/ready`, {
    method: 'POST',
  });
}

/**
 * 7. Reject an order with a reason.
 * POST /api/v1/seller/orders/{orderId}/reject
 */
export async function rejectSellerOrder(
  orderId: number,
  reason: string
): Promise<ClientResponse<SellerOrderDetailData>> {
  return apiClient<SellerOrderDetailData>(`seller/orders/${orderId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * 8. Complete a delivered order.
 * POST /api/v1/seller/orders/{orderId}/complete
 */
export async function completeSellerOrder(
  orderId: number
): Promise<ClientResponse<SellerOrderDetailData>> {
  return apiClient<SellerOrderDetailData>(`seller/orders/${orderId}/complete`, {
    method: 'POST',
  });
}

/**
 * 9. Fetch shop operating hours.
 * GET /api/v1/seller/operating-hours
 */
export async function getSellerOperatingHours(): Promise<ClientResponse<SellerOperatingHoursData>> {
  return apiClient<SellerOperatingHoursData>('seller/operating-hours', {
    method: 'GET',
  });
}

/**
 * 10. Update shop operating hours and is_open status.
 * PUT /api/v1/seller/operating-hours
 */
export async function updateSellerOperatingHours(payload: {
  is_open: boolean;
  opens_at?: string;
  closes_at?: string;
}): Promise<ClientResponse<SellerOperatingHoursData>> {
  return apiClient<SellerOperatingHoursData>('seller/operating-hours', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * 11. Fetch seller earnings summary & monthly trends.
 * GET /api/v1/seller/earnings
 */
export async function getSellerEarnings(): Promise<ClientResponse<SellerEarningsData>> {
  return apiClient<SellerEarningsData>('seller/earnings', {
    method: 'GET',
  });
}

/**
 * 12. Fetch seller's active product listings.
 * GET /api/v1/seller/catalog/listings
 */
export async function getSellerCatalogListings(params?: {
  category_id?: number;
  search?: string;
  is_active?: boolean;
  page?: number;
  per_page?: number;
}): Promise<ClientResponse<SellerListingItem[]>> {
  const query = new URLSearchParams();
  if (params?.category_id) query.append('category_id', String(params.category_id));
  if (params?.search) query.append('search', params.search);
  if (params?.is_active !== undefined) query.append('is_active', String(params.is_active));
  if (params?.page) query.append('page', String(params.page));
  if (params?.per_page) query.append('per_page', String(params.per_page));

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiClient<SellerListingItem[]>(`seller/catalog/listings${qs}`, {
    method: 'GET',
  });
}

/**
 * 13. Fetch global catalog products available to be imported.
 * GET /api/v1/seller/catalog/available
 */
export async function getSellerAvailableCatalog(params?: {
  category_id?: number;
  search?: string;
  page?: number;
  per_page?: number;
}): Promise<ClientResponse<SellerAvailableProductItem[]>> {
  const query = new URLSearchParams();
  if (params?.category_id) query.append('category_id', String(params.category_id));
  if (params?.search) query.append('search', params.search);
  if (params?.page) query.append('page', String(params.page));
  if (params?.per_page) query.append('per_page', String(params.per_page));

  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiClient<SellerAvailableProductItem[]>(`seller/catalog/available${qs}`, {
    method: 'GET',
  });
}

/**
 * 14. Import global products into shop catalog.
 * POST /api/v1/seller/catalog/import
 */
export async function importSellerCatalogProducts(payload: {
  global_product_ids?: number[];
  import_all_category?: boolean;
  category_id?: number;
}): Promise<ClientResponse<{ imported_count: number; skipped_count: number }>> {
  return apiClient<{ imported_count: number; skipped_count: number }>('seller/catalog/import', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 15. Update an individual shop product listing (custom price, stock quantity, active toggle).
 * PUT /api/v1/seller/catalog/listings/{listingId}
 */
export async function updateSellerListing(
  listingId: number,
  payload: {
    custom_price?: number | null;
    stock_quantity?: number;
    stock_adjust?: number;
    is_active?: boolean;
  }
): Promise<ClientResponse<SellerListingItem>> {
  return apiClient<SellerListingItem>(`seller/catalog/listings/${listingId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * 16. Check seller verification status.
 * GET /api/v1/seller/verification/status
 */
export async function getSellerVerificationStatus(): Promise<
  ClientResponse<SellerVerificationStatusData>
> {
  return apiClient<SellerVerificationStatusData>('seller/verification/status', {
    method: 'GET',
  });
}

/**
 * 17. Submit seller verification request with documents.
 * POST /api/v1/seller/verification/submit
 */
export async function submitSellerVerification(payload: {
  business_description: string;
  reason_for_verification: string;
  documentUris?: string[];
}): Promise<ClientResponse<SellerVerificationDetail>> {
  const formData = new FormData();
  formData.append('business_description', payload.business_description);
  formData.append('reason_for_verification', payload.reason_for_verification);
  formData.append('verification_agreement', '1');

  if (payload.documentUris && payload.documentUris.length > 0) {
    payload.documentUris.forEach((uri, idx) => {
      const filename = uri.split('/').pop() || `doc_${idx + 1}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      formData.append('documents[]', {
        uri,
        name: filename,
        type,
      } as any);
    });
  }

  return apiClient<SellerVerificationDetail>('seller/verification/submit', {
    method: 'POST',
    body: formData,
  });
}

/**
 * 18. Fetch seller order chat messages.
 * GET /api/v1/seller/orders/{orderId}/messages
 */
export async function getSellerOrderMessages(
  orderId: number,
  sinceId?: number
): Promise<ClientResponse<any[]>> {
  const qs = sinceId ? `?since=${sinceId}` : '';
  return apiClient<any[]>(`seller/orders/${orderId}/messages${qs}`, {
    method: 'GET',
  });
}

/**
 * 19. Send message to customer in order chat.
 * POST /api/v1/seller/orders/{orderId}/messages
 */
export async function sendSellerOrderMessage(
  orderId: number,
  message: string
): Promise<ClientResponse<any>> {
  return apiClient<any>(`seller/orders/${orderId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ message }),
  });
}

/**
 * 20. Mark order messages as read.
 * POST /api/v1/seller/orders/{orderId}/messages/read
 */
export async function markSellerOrderMessagesRead(
  orderId: number
): Promise<ClientResponse<any>> {
  return apiClient<any>(`seller/orders/${orderId}/messages/read`, {
    method: 'POST',
  });
}
