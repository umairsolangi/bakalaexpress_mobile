import { z } from 'zod';

export const sellerRegisterSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Shop name must be at least 2 characters.')
      .max(255, 'Shop name must be 255 characters or fewer.'),
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
    city: z.string().trim().default('Karachi'),
    area: z.string().trim().default('Baldia Town'),
    sector: z
      .string()
      .min(1, 'Please select your sector.')
      .refine((val) => ['4A', '4B', '4C'].includes(val), {
        message: 'Sector must be one of: 4A, 4B, 4C.',
      }),
    catalog_category_id: z
      .union([z.number(), z.string()])
      .refine((val) => val !== '' && val !== undefined && val !== null, {
        message: 'Please select a shop category.',
      }),
    near_areas: z
      .array(z.string())
      .min(1, 'Please select at least one near area / coverage landmark.'),
    full_address: z
      .string()
      .trim()
      .min(10, 'Full address must be at least 10 characters.')
      .max(500, 'Full address must be 500 characters or fewer.'),
    terms: z.literal(true, {
      message: 'You must accept the Terms of Service & Privacy Policy.',
    }),
    profile_image: z.object({
      uri: z.string().min(1, 'Please select a shop profile photo.'),
      name: z.string().optional(),
      type: z.string().optional(),
    }),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Password confirmation does not match.',
    path: ['password_confirmation'],
  });

export type SellerRegisterFormData = z.infer<typeof sellerRegisterSchema>;
