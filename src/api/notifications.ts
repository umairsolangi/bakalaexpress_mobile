import { apiClient, ClientResponse } from './client';
import { InAppNotificationItem, RegisterDevicePayload } from './types';

/**
 * 1. Fetch authenticated customer notifications list.
 * GET /api/v1/customer/notifications
 */
export async function getCustomerNotifications(
  page = 1,
  perPage = 20
): Promise<ClientResponse<InAppNotificationItem[]>> {
  return apiClient<InAppNotificationItem[]>(
    `customer/notifications?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
    }
  );
}

/**
 * 2. Mark customer notifications as read.
 * POST /api/v1/customer/notifications/read
 */
export async function markCustomerNotificationsRead(
  payload: { all?: boolean; ids?: string[] } = { all: true }
): Promise<ClientResponse<{ unread_count: number }>> {
  return apiClient<{ unread_count: number }>('customer/notifications/read', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 3. Fetch authenticated seller notifications list.
 * GET /api/v1/seller/notifications
 */
export async function getSellerNotifications(
  page = 1,
  perPage = 20
): Promise<ClientResponse<InAppNotificationItem[]>> {
  return apiClient<InAppNotificationItem[]>(
    `seller/notifications?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
    }
  );
}

/**
 * 4. Mark seller notifications as read.
 * POST /api/v1/seller/notifications/read
 */
export async function markSellerNotificationsRead(
  payload: { all?: boolean; ids?: string[] } = { all: true }
): Promise<ClientResponse<{ unread_count: number }>> {
  return apiClient<{ unread_count: number }>('seller/notifications/read', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 5. Register device push notification token.
 * POST /api/v1/{role}/devices
 */
export async function registerDeviceToken(
  role: 'customer' | 'seller' | 'rider',
  payload: RegisterDevicePayload
): Promise<ClientResponse<any>> {
  return apiClient<any>(`${role}/devices`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 6. Delete device push notification token on logout.
 * DELETE /api/v1/{role}/devices
 */
export async function deleteDeviceToken(
  role: 'customer' | 'seller' | 'rider',
  expoPushToken: string
): Promise<ClientResponse<any>> {
  return apiClient<any>(`${role}/devices`, {
    method: 'DELETE',
    body: JSON.stringify({ expo_push_token: expoPushToken }),
  });
}
