import { apiClient, ClientResponse } from './client';
import {
  CustomerProductDetail,
  CustomerReview,
  CustomerShopCard,
  LocationsMetaResponse,
  SearchResponseData,
  SellerProfileAndCatalog,
} from './types';

export interface HomeQueryParams {
  sector?: string;
  near_area?: string;
  category_id?: number;
  category?: number;
  q?: string;
  is_open?: boolean;
  page?: number;
  per_page?: number;
}

export interface SearchQueryParams {
  q: string;
  sector?: string;
  type?: 'all' | 'shops' | 'products';
  category_id?: number;
  category?: number;
  in_stock?: boolean;
  seller_id?: number;
  page?: number;
  per_page?: number;
}

/**
 * Fetch locations metadata (sectors, near areas, categories).
 */
export async function getLocationsMeta(): Promise<ClientResponse<LocationsMetaResponse>> {
  return apiClient<LocationsMetaResponse>('customer/meta/locations', {
    method: 'GET',
    skipAuth: true,
  });
}

/**
 * Fetch paginated home shop cards.
 */
export async function getHomeShops(params: HomeQueryParams = {}): Promise<ClientResponse<CustomerShopCard[]>> {
  const query = new URLSearchParams();
  if (params.sector) query.append('sector', params.sector);
  if (params.near_area) query.append('near_area', params.near_area);
  if (params.category_id) query.append('category_id', String(params.category_id));
  if (params.category) query.append('category', String(params.category));
  if (params.q) query.append('q', params.q);
  if (typeof params.is_open === 'boolean') query.append('is_open', String(params.is_open));
  if (params.page) query.append('page', String(params.page));
  if (params.per_page) query.append('per_page', String(params.per_page));

  const qs = query.toString();
  const endpoint = qs ? `customer/home?${qs}` : 'customer/home';

  return apiClient<CustomerShopCard[]>(endpoint, {
    method: 'GET',
    skipAuth: true,
  });
}

/**
 * Fetch shop profile and categorized catalog listings.
 */
export async function getSellerDetail(sellerId: number): Promise<ClientResponse<SellerProfileAndCatalog>> {
  return apiClient<SellerProfileAndCatalog>(`customer/sellers/${sellerId}`, {
    method: 'GET',
    skipAuth: true,
  });
}

/**
 * Fetch single catalog listing detail.
 */
export async function getProductDetail(sellerId: number, listingId: number): Promise<ClientResponse<CustomerProductDetail>> {
  return apiClient<CustomerProductDetail>(`customer/sellers/${sellerId}/products/${listingId}`, {
    method: 'GET',
    skipAuth: true,
  });
}

/**
 * Fetch paginated seller reviews.
 */
export async function getSellerReviews(
  sellerId: number,
  page = 1,
  perPage = 15
): Promise<ClientResponse<CustomerReview[]>> {
  return apiClient<CustomerReview[]>(`customer/sellers/${sellerId}/reviews?page=${page}&per_page=${perPage}`, {
    method: 'GET',
    skipAuth: true,
  });
}

/**
 * Search shops and catalog products.
 */
export async function searchCatalog(params: SearchQueryParams): Promise<ClientResponse<SearchResponseData>> {
  const query = new URLSearchParams();
  query.append('q', params.q);
  if (params.sector) query.append('sector', params.sector);
  if (params.type) query.append('type', params.type);
  if (params.category_id) query.append('category_id', String(params.category_id));
  if (params.category) query.append('category', String(params.category));
  if (typeof params.in_stock === 'boolean') query.append('in_stock', String(params.in_stock));
  if (params.seller_id) query.append('seller_id', String(params.seller_id));
  if (params.page) query.append('page', String(params.page));
  if (params.per_page) query.append('per_page', String(params.per_page));

  return apiClient<SearchResponseData>(`customer/search?${query.toString()}`, {
    method: 'GET',
    skipAuth: true,
  });
}
