import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address.')
    .email('Please enter a valid email address.'),
  password: z
    .string()
    .min(1, 'Please enter your password.'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(100, 'Name must be 100 characters or fewer.'),
    email: z
      .string()
      .trim()
      .min(1, 'Please enter your email address.')
      .email('Please enter a valid email address.'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters.'),
    password_confirmation: z
      .string()
      .min(1, 'Please confirm your password.'),
    mobile: z
      .string()
      .trim()
      .regex(/^$|^03[0-9]{9}$|^[0-9]{10,15}$/, 'Please enter a valid mobile number (e.g., 03001234567).')
      .optional()
      .or(z.literal('')),
    city: z.string().trim().max(100).optional().or(z.literal('')),
    address: z.string().trim().max(255).optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Password confirmation does not match.',
    path: ['password_confirmation'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const verifyOtpSchema = z.object({
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'OTP must be exactly 6 digits.'),
});

export type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address.')
    .email('Please enter a valid email address.'),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    email: z.string().trim().email(),
    otp: z.string().trim().regex(/^\d{6}$/, 'Reset code must be exactly 6 digits.'),
    password: z.string().min(8, 'New password must be at least 8 characters.'),
    password_confirmation: z.string().min(1, 'Please confirm your new password.'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Password confirmation does not match.',
    path: ['password_confirmation'],
  });

export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Please enter your password.'),
  reason: z.string().trim().max(500, 'Reason must not exceed 500 characters.').optional().or(z.literal('')),
});

export type DeleteAccountFormData = z.infer<typeof deleteAccountSchema>;
