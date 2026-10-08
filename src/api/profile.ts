import { apiClient, ClientResponse } from './client';
import {
  CustomerProductListing,
  CustomerProfileDetail,
  CustomerShopCard,
  ChangePasswordPayload,
  ToggleFavoriteResponse,
  UpdateProfilePayload,
} from './types';

/**
 * 1. Fetch authenticated customer full profile.
 * GET /api/v1/customer/profile
 */
export async function getCustomerProfile(): Promise<ClientResponse<CustomerProfileDetail>> {
  return apiClient<CustomerProfileDetail>('customer/profile', {
    method: 'GET',
  });
}

/**
 * 2. Update customer profile details.
 * PUT /api/v1/customer/profile
 */
export async function updateCustomerProfile(
  payload: UpdateProfilePayload
): Promise<ClientResponse<CustomerProfileDetail>> {
  return apiClient<CustomerProfileDetail>('customer/profile', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/**
 * 3. Change customer password.
 * POST /api/v1/customer/profile/password
 */
export async function changeCustomerPassword(
  payload: ChangePasswordPayload
): Promise<ClientResponse<null>> {
  return apiClient<null>('customer/profile/password', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * 4. Delete and anonymize customer account.
 * DELETE /api/v1/customer/account
 */
export async function deleteCustomerAccount(
  password: string
): Promise<ClientResponse<null>> {
  return apiClient<null>('customer/account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
}

/**
 * 5. Fetch customer favorite shops.
 * GET /api/v1/customer/favorites/sellers
 */
export async function getFavoriteSellers(
  page = 1,
  perPage = 15
): Promise<ClientResponse<CustomerShopCard[]>> {
  return apiClient<CustomerShopCard[]>(
    `customer/favorites/sellers?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
    }
  );
}

/**
 * 6. Fetch customer favorite products.
 * GET /api/v1/customer/favorites/products
 */
export async function getFavoriteProducts(
  page = 1,
  perPage = 15
): Promise<ClientResponse<CustomerProductListing[]>> {
  return apiClient<CustomerProductListing[]>(
    `customer/favorites/products?page=${page}&per_page=${perPage}`,
    {
      method: 'GET',
    }
  );
}

/**
 * 7. Toggle shop in customer favorites.
 * POST /api/v1/customer/favorites/sellers/{sellerId}/toggle
 */
export async function toggleSellerFavorite(
  sellerId: number
): Promise<ClientResponse<ToggleFavoriteResponse>> {
  return apiClient<ToggleFavoriteResponse>(
    `customer/favorites/sellers/${sellerId}/toggle`,
    {
      method: 'POST',
    }
  );
}

/**
 * 8. Toggle product listing in customer favorites.
 * POST /api/v1/customer/favorites/products/{listingId}/toggle
 */
export async function toggleProductFavorite(
  listingId: number
): Promise<ClientResponse<ToggleFavoriteResponse>> {
  return apiClient<ToggleFavoriteResponse>(
    `customer/favorites/products/${listingId}/toggle`,
    {
      method: 'POST',
    }
  );
}
