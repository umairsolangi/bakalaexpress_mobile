import { apiClient, ClientResponse } from './client';
import {
  AdminProfile,
  AuthSuccessData,
  CustomerUser,
  RegisterSuccessData,
  RiderProfile,
  SellerProfile,
  UserRole,
} from './types';

// ==========================================
// Payloads
// ==========================================

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  mobile?: string;
  city?: string;
  address?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResendOtpPayload {
  email: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
  password_confirmation: string;
}

export interface DeleteAccountPayload {
  password: string;
  reason?: string;
}

// ==========================================
// Customer Auth Endpoints (/api/v1/customer/auth)
// ==========================================

export async function registerCustomer(payload: RegisterPayload): Promise<ClientResponse<RegisterSuccessData>> {
  return apiClient<RegisterSuccessData>('customer/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<ClientResponse<AuthSuccessData>> {
  return apiClient<AuthSuccessData>('customer/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function resendOtp(payload: ResendOtpPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('customer/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function loginCustomer(payload: LoginPayload): Promise<ClientResponse<AuthSuccessData>> {
  return apiClient<AuthSuccessData>('customer/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function getCustomerMe(): Promise<ClientResponse<CustomerUser>> {
  return apiClient<CustomerUser>('customer/auth/me', {
    method: 'GET',
  });
}

export async function logoutCustomer(): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('customer/auth/logout', {
    method: 'POST',
  });
}

export async function forgotPasswordCustomer(payload: ForgotPasswordPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('customer/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function resetPasswordCustomer(payload: ResetPasswordPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('customer/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

/**
 * Customer account immediate deletion (GDPR). Rejects with HAS_ACTIVE_ORDERS if active orders exist.
 */
export async function deleteCustomerAccount(payload: { password: string }): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('customer/account', {
    method: 'DELETE',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// Seller Auth Endpoints (/api/v1/seller/auth)
// ==========================================

export async function loginSeller(payload: LoginPayload): Promise<ClientResponse<AuthSuccessData>> {
  return apiClient<AuthSuccessData>('seller/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function getSellerMe(): Promise<ClientResponse<SellerProfile>> {
  return apiClient<SellerProfile>('seller/auth/me', {
    method: 'GET',
  });
}

export async function logoutSeller(): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('seller/auth/logout', {
    method: 'POST',
  });
}

export async function forgotPasswordSeller(payload: ForgotPasswordPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('seller/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function resetPasswordSeller(payload: ResetPasswordPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('seller/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function registerSeller(formData: FormData): Promise<ClientResponse<{ seller: SellerProfile }>> {
  return apiClient<{ seller: SellerProfile }>('seller/auth/register', {
    method: 'POST',
    body: formData,
    skipAuth: true,
  });
}

export async function requestSellerDeletion(payload: DeleteAccountPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('seller/account/deletion-request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// Rider Auth Endpoints (/api/v1/rider/auth)
// ==========================================

export async function loginRider(payload: LoginPayload): Promise<ClientResponse<AuthSuccessData>> {
  return apiClient<AuthSuccessData>('rider/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function getRiderMe(): Promise<ClientResponse<RiderProfile>> {
  return apiClient<RiderProfile>('rider/auth/me', {
    method: 'GET',
  });
}

export async function logoutRider(): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('rider/auth/logout', {
    method: 'POST',
  });
}

export async function forgotPasswordRider(payload: ForgotPasswordPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('rider/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function resetPasswordRider(payload: ResetPasswordPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('rider/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function registerRider(formData: FormData): Promise<ClientResponse<{ rider: RiderProfile }>> {
  return apiClient<{ rider: RiderProfile }>('rider/auth/register', {
    method: 'POST',
    body: formData,
    skipAuth: true,
  });
}

export async function requestRiderDeletion(payload: DeleteAccountPayload): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('rider/account/deletion-request', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ==========================================
// Admin Auth Endpoints (/api/v1/admin/auth)
// ==========================================

export async function loginAdmin(payload: LoginPayload): Promise<ClientResponse<AuthSuccessData>> {
  return apiClient<AuthSuccessData>('admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
}

export async function getAdminMe(): Promise<ClientResponse<AdminProfile>> {
  return apiClient<AdminProfile>('admin/auth/me', {
    method: 'GET',
  });
}

export async function logoutAdmin(): Promise<ClientResponse<Record<string, never>>> {
  return apiClient<Record<string, never>>('admin/auth/logout', {
    method: 'POST',
  });
}

// ==========================================
// Role Dispatchers
// ==========================================

export async function loginByRole(role: UserRole, payload: LoginPayload): Promise<{ token: string; user: any }> {
  let response: ClientResponse<AuthSuccessData>;
  switch (role) {
    case 'customer':
      response = await loginCustomer(payload);
      return { token: response.data.token, user: response.data.user };
    case 'seller':
      response = await loginSeller(payload);
      return { token: response.data.token, user: response.data.seller || response.data.user };
    case 'rider':
      response = await loginRider(payload);
      return { token: response.data.token, user: response.data.rider || response.data.user };
    case 'admin':
      response = await loginAdmin(payload);
      return { token: response.data.token, user: response.data.user };
  }
}

export async function getMeByRole(role: UserRole): Promise<ClientResponse<any>> {
  switch (role) {
    case 'customer':
      return getCustomerMe();
    case 'seller':
      return getSellerMe();
    case 'rider':
      return getRiderMe();
    case 'admin':
      return getAdminMe();
  }
}

export async function logoutByRole(role: UserRole): Promise<void> {
  switch (role) {
    case 'customer':
      await logoutCustomer();
      break;
    case 'seller':
      await logoutSeller();
      break;
    case 'rider':
      await logoutRider();
      break;
    case 'admin':
      await logoutAdmin();
      break;
  }
}

export async function forgotPasswordByRole(role: UserRole, payload: ForgotPasswordPayload): Promise<ClientResponse<Record<string, never>>> {
  switch (role) {
    case 'customer':
      return forgotPasswordCustomer(payload);
    case 'seller':
      return forgotPasswordSeller(payload);
    case 'rider':
      return forgotPasswordRider(payload);
    case 'admin':
      throw new Error('Forgot password is not available for admin role');
  }
}

export async function resetPasswordByRole(role: UserRole, payload: ResetPasswordPayload): Promise<ClientResponse<Record<string, never>>> {
  switch (role) {
    case 'customer':
      return resetPasswordCustomer(payload);
    case 'seller':
      return resetPasswordSeller(payload);
    case 'rider':
      return resetPasswordRider(payload);
    case 'admin':
      throw new Error('Reset password is not available for admin role');
  }
}

export async function deleteAccountByRole(role: UserRole, payload: DeleteAccountPayload): Promise<ClientResponse<Record<string, never>>> {
  switch (role) {
    case 'customer':
      return deleteCustomerAccount({ password: payload.password });
    case 'seller':
      return requestSellerDeletion(payload);
    case 'rider':
      return requestRiderDeletion(payload);
    case 'admin':
      throw new Error('Account deletion is not supported for admin');
  }
}
