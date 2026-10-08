export interface ApiMeta {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  server_time?: string;
  suggested_poll_seconds?: number;
  [key: string]: unknown;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
  meta: ApiMeta;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

export type UserRole = 'customer' | 'seller' | 'rider' | 'admin';

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  role?: string;
  mobile?: string | null;
  phone?: string | null;
  city?: string | null;
  address?: string | null;
  is_verified?: boolean;
  created_at?: string | null;
}

export interface SellerProfile {
  id: number;
  name: string;
  email: string;
  city?: string;
  area?: string;
  sector?: string;
  near_areas?: string[];
  full_address?: string;
  profile_image?: string | null;
  accountIsApproved?: number | boolean;
  is_open?: boolean;
  accepting_orders?: boolean;
  is_deleted?: boolean;
  catalog_category_id?: number | null;
}

export interface RiderProfile {
  id: number;
  name: string;
  email: string;
  phone?: string;
  cnic_number?: string;
  vehicle_type?: string;
  vehicle_number?: string;
  address?: string;
  profile_image?: string | null;
  status?: string;
  is_approved?: boolean;
  is_verified?: boolean;
}

export interface AdminProfile {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export type AnyUserProfile = CustomerUser | SellerProfile | RiderProfile | AdminProfile;

export interface AuthSuccessData {
  token: string;
  user?: CustomerUser;
  seller?: SellerProfile;
  rider?: RiderProfile;
}

export interface RegisterSuccessData {
  user?: CustomerUser;
  email?: string;
  otp_sent?: boolean;
}

export interface LocationCategory {
  id: number;
  name: string;
  slug: string;
}

export interface LocationsMetaResponse {
  sectors: string[];
  near_areas: string[];
  categories: LocationCategory[];
}

export interface CustomerShopCard {
  id: number;
  name: string;
  profile_image: string | null;
  category: string | null;
  area: string | null;
  sector: string | null;
  near_areas: string[];
  opens_at: string | null;
  closes_at: string | null;
  is_open: boolean;
  accepting_orders: boolean;
  average_rating: number;
  rating_count: number;
  is_favorite: boolean;
}

export interface CustomerProductListing {
  listing_id: number;
  global_product_id: number;
  name: string;
  description: string | null;
  unit_type: string | null;
  image: string | null;
  price: string | number;
  stock_quantity: number;
  in_stock: boolean;
  category: string | null;
  is_favorite: boolean;
}

export interface CustomerProductDetail extends CustomerProductListing {
  shop: {
    id: number;
    name: string;
    opens_at?: string | null;
    closes_at?: string | null;
    is_open?: boolean;
    accepting_orders: boolean;
    is_favorite: boolean;
  };
}

export interface CategoryCatalogGroup {
  id: number;
  name: string;
  slug: string;
  products: CustomerProductListing[];
}

export interface SellerProfileAndCatalog {
  seller: CustomerShopCard;
  categories: CategoryCatalogGroup[];
}

export interface CustomerReview {
  rating: number;
  feedback: string;
  created_at: string | null;
  reviewer_name: string;
}

export interface SearchProductItem {
  listing_id: number;
  seller_id: number;
  shop_name: string;
  product_name: string;
  price: string | number;
  image: string | null;
  in_stock: boolean;
  shop_accepting_orders: boolean;
}

export interface SearchAllResponse {
  type: 'all';
  shops: CustomerShopCard[];
  products: SearchProductItem[];
}

export interface SearchShopsResponse {
  type: 'shops';
  shops: CustomerShopCard[];
}

export interface SearchProductsResponse {
  type: 'products';
  products: SearchProductItem[];
}

export type SearchResponseData = SearchAllResponse | SearchShopsResponse | SearchProductsResponse;

export interface SellerVerificationData {
  id: number;
  seller_id: number;
  status: 'pending' | 'approved' | 'rejected';
  business_description: string;
  reason_for_verification: string;
  documents: string[];
  rejection_reason?: string | null;
  submitted_at?: string | null;
  reviewed_at?: string | null;
}

export interface SellerVerificationStatusResponse {
  is_verified: boolean;
  has_submitted: boolean;
  verification: SellerVerificationData | null;
}

// -------------------------------------------------------------
// Cart, Checkout & Orders Types
// -------------------------------------------------------------

export interface CartItemInput {
  listing_id: number;
  quantity: number;
}

export interface EvaluatedCartItem {
  listing_id: number;
  name: string;
  unit_type: string | null;
  image: string | null;
  unit_price: string;
  quantity: number;
  line_total: string;
  available_stock: number;
  ok: boolean;
  problem_code: 'INACTIVE' | 'OUT_OF_STOCK' | 'LIMITED_STOCK' | null;
}

export interface CartTotals {
  subtotal: string;
  delivery_charges: string;
  discount: string;
  total: string;
}

export interface CartValidationResponse {
  is_valid: boolean;
  items: EvaluatedCartItem[];
  totals: CartTotals;
}

export interface PromoAppliedSummary {
  code: string;
  discount_type: 'fixed' | 'percent';
  discount_value: string | number;
}

export interface ApplyPromoResponse {
  is_valid: boolean;
  items: EvaluatedCartItem[];
  promo: PromoAppliedSummary;
  totals: CartTotals;
}

export interface PlaceOrderPayload {
  items: CartItemInput[];
  address: string;
  phone: string;
  delivery_instructions?: string;
  delivery_sector?: string;
  delivery_near_area?: string;
  promo_code?: string;
  payment_method: 'cod';
}

export interface OrderSellerSummary {
  id: number | null;
  name: string;
  image: string | null;
}

export interface OrderRiderSummary {
  id: number;
  name: string;
  vehicle_type: string;
}

export interface OrderListItem {
  id: number;
  status: string;
  status_label: string;
  status_step: number;
  total_amount: string;
  seller: OrderSellerSummary;
  item_count: number;
  unread_messages: number;
  created_at: string | null;
}

export interface OrderItemSnapshot {
  id: number;
  listing_id: number | null;
  item_name: string;
  unit_type: string | null;
  item_image: string | null;
  quantity: number;
  unit_price: string;
  line_total: string;
}

export interface OrderDetailItem {
  id: number;
  status: string;
  status_label: string;
  status_step: number;
  can_cancel: boolean;
  can_review: boolean;
  address: string;
  phone: string;
  delivery_instructions: string | null;
  payment_method: string;
  payment_method_label: string;
  subtotal: string;
  delivery_charges: string;
  discount_amount: string;
  total_amount: string;
  promo_code: string | null;
  estimated_delivery_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  created_at: string | null;
  items: OrderItemSnapshot[];
  seller: OrderSellerSummary;
  rider: OrderRiderSummary | null;
  delivery_proof_image: string | null;
  unread_messages: number;
}

export interface ReorderItemPreview {
  listing_id: number | null;
  name: string;
  current_price: string | null;
  quantity: number;
  available_stock: number;
  ok: boolean;
  problem_code: 'INACTIVE' | 'OUT_OF_STOCK' | 'LIMITED_STOCK' | null;
}

export interface ReorderPreviewResponse {
  order_id: number;
  items: ReorderItemPreview[];
  subtotal: string;
  delivery_fee: string;
  total: string;
}

export interface OrderMessageItem {
  id: number;
  order_id: number;
  sender_type: 'customer' | 'seller' | 'rider' | 'admin' | 'system';
  sender_name: string;
  message: string;
  is_read: boolean;
  created_at: string | null;
}

// -------------------------------------------------------------
// Profile & Favorites Types
// -------------------------------------------------------------

export interface CustomerProfileDetail {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  mobile: string | null;
  address: string | null;
  address2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  sector: string | null;
  near_area: string | null;
  avatar_url: string | null;
  pickup_time: string | null;
  is_verified: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export interface UpdateProfilePayload {
  name?: string;
  mobile?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  zip?: string;
  sector?: string;
  near_area?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ToggleFavoriteResponse {
  is_favorite: boolean;
}

// -------------------------------------------------------------
// Rider Fulfillment Types
// -------------------------------------------------------------

export interface RiderDashboardData {
  rider: {
    id: number;
    name: string;
    status: string;
    vehicle_type: string;
  };
  today_delivered_count: number;
  today_earnings: string;
  earnings_note: string;
  active_orders: RiderOrderShort[];
}

export interface RiderOrderShort {
  id: number;
  status: string;
  status_label: string;
  status_step: number;
  seller: {
    id: number | null;
    name: string;
    image: string | null;
  };
  customer: {
    name: string;
    address: string | null;
    phone: string | null;
  };
  total_amount: string;
  amount_to_collect: string;
  item_count: number;
  updated_at: string | null;
}

export interface RiderAvailableOrder {
  id: number;
  seller: {
    id: number | null;
    name: string;
    image: string | null;
    area: string | null;
    sector: string | null;
    full_address: string | null;
  };
  item_count: number;
  total_amount: string;
  amount_to_collect: string;
  delivery_charges: string;
  ready_since: string | null;
  customer_area_hint: string | null;
}

export interface RiderOrderItemDetail {
  id: number;
  item_name: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  item_image: string | null;
}

export interface RiderOrderDetail {
  id: number;
  status: string;
  status_label: string;
  status_step: number;
  seller: {
    name: string;
    image: string | null;
    address: string;
    area: string | null;
    sector: string | null;
    near_areas: string[];
  };
  customer: {
    name: string;
    phone: string | null;
    address: string | null;
    delivery_instructions: string | null;
  };
  items: RiderOrderItemDetail[];
  subtotal: string;
  delivery_charges: string;
  discount_amount: string;
  total_amount: string;
  amount_to_collect: string;
  timestamps: {
    created_at: string | null;
    estimated_delivery_at: string | null;
    updated_at: string | null;
  };
  delivery_proof_image: string | null;
  can_pickup: boolean;
  can_deliver: boolean;
}

export interface RiderHistoryOrder {
  id: number;
  status: string;
  status_label: string;
  seller_name: string;
  customer_name: string;
  customer_area_hint: string | null;
  item_count: number;
  total_amount: string;
  delivery_charges: string;
  delivery_proof_image: string | null;
  delivered_at: string | null;
}

export interface SellerDashboardStore {
  id: number;
  name: string;
  email: string;
  city: string;
  area: string;
  sector: string;
  full_address: string;
  profile_image: string | null;
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  is_currently_open: boolean;
}

export interface SellerOrderBadges {
  pending: number;
  confirmed: number;
  preparing: number;
  ready: number;
  active_total: number;
  delivered: number;
  completed: number;
  cancelled: number;
  rejected: number;
}

export interface SellerTodayStats {
  sales: string;
  orders_count: number;
}

export interface SellerDashboardData {
  store: SellerDashboardStore;
  order_badges: SellerOrderBadges;
  today: SellerTodayStats;
}

export interface SellerOrderShortItem {
  id: number;
  status: string;
  status_label: string;
  status_step: number;
  customer_first_name: string;
  item_count: number;
  unread_messages: number;
  total_amount: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface SellerOrderItemDetail {
  id: number;
  shop_product_id: number | null;
  is_catalog_item: boolean;
  item_name: string;
  unit_type: string | null;
  item_image: string | null;
  quantity: number;
  current_stock: number | null;
  unit_price: string;
  line_total: string;
}

export interface SellerOrderDetailData {
  id: number;
  status: string;
  status_label: string;
  status_step: number;
  allowed_actions: string[];
  customer: {
    name: string;
    phone: string;
    address: string;
    delivery_instructions: string | null;
  };
  rider: {
    id: number;
    name: string;
    phone: string;
    vehicle_type: string;
  } | null;
  items: SellerOrderItemDetail[];
  subtotal: string;
  delivery_charges: string;
  discount_amount: string;
  total_amount: string;
  promo_code: string | null;
  cancellation_reason: string | null;
  delivery_proof_image: string | null;
  inventory_reserved_at: string | null;
  estimated_delivery_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  unread_messages: number;
}

export interface SellerOperatingHoursData {
  is_open: boolean;
  opens_at: string | null;
  closes_at: string | null;
  is_currently_open: boolean;
}

export interface SellerEarningsData {
  summary: {
    today: string;
    this_week: string;
    this_month: string;
    this_year: string;
    all_time: string;
    total_completed_orders: number;
  };
  monthly_chart: Array<{ month: string; sales: number; orders_count: number }>;
  discounts_note?: string;
}

export interface SellerListingItem {
  listing_id: number;
  global_product_id: number;
  name: string;
  unit_type: string;
  image_url: string | null;
  category: {
    id: number;
    name: string;
  };
  base_price: string;
  custom_price: string | null;
  effective_price: string;
  stock_quantity: number;
  is_active: boolean;
  price_differs_from_base: boolean;
  updated_at: string | null;
}

export interface SellerAvailableProductItem {
  global_product_id: number;
  name: string;
  unit_type: string;
  image_url: string | null;
  base_price: string;
  category: {
    id: number;
    name: string;
  };
}

export interface SellerVerificationDetail {
  id: number;
  seller_id: number;
  status: 'pending' | 'approved' | 'rejected';
  business_description: string;
  reason_for_verification: string;
  documents: string[];
  rejection_reason: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
}

export interface SellerVerificationStatusData {
  is_verified: boolean;
  has_submitted: boolean;
  verification: SellerVerificationDetail | null;
}

export interface InAppNotificationItem {
  id: string;
  type: 'order_status' | 'new_order' | 'other';
  title: string;
  body: string;
  order_id: string | null;
  status: string | null;
  created_at: string | null;
  read_at: string | null;
}

export interface RegisterDevicePayload {
  expo_push_token: string;
  platform?: 'android' | 'ios' | 'web';
  device_name?: string;
}
