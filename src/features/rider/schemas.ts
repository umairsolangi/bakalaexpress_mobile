import { z } from 'zod';
import { stripCnic } from '../../utils/cnic';

export const riderStep1Schema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters.')
      .max(255, 'Name must be 255 characters or fewer.'),
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
    phone: z
      .string()
      .trim()
      .regex(/^[0-9]{11}$/, 'Phone number must be exactly 11 digits (e.g., 03001234567).'),
    address: z
      .string()
      .trim()
      .min(5, 'Residential address must be at least 5 characters.'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Password confirmation does not match.',
    path: ['password_confirmation'],
  });

export type RiderStep1FormData = z.infer<typeof riderStep1Schema>;

export const riderStep2Schema = z.object({
  vehicle_type: z
    .string()
    .trim()
    .min(2, 'Please enter your vehicle type (e.g. Motorcycle).')
    .max(255),
  vehicle_number: z
    .string()
    .trim()
    .min(2, 'Please enter your vehicle number.')
    .max(255),
  cnic_number: z
    .string()
    .trim()
    .transform((val) => stripCnic(val))
    .pipe(z.string().regex(/^[0-9]{13}$/, 'CNIC must be exactly 13 digits.')),
});

export type RiderStep2FormData = z.infer<typeof riderStep2Schema>;

const docSchema = z.object({
  uri: z.string().min(1, 'Document is required.'),
  name: z.string().optional(),
  type: z.string().optional(),
});

export const riderStep3Schema = z.object({
  profile_image: docSchema,
  cnic_front: docSchema,
  cnic_back: docSchema,
  license_image: docSchema,
  vehicle_image: docSchema,
  registration_book: docSchema,
});

export type RiderStep3FormData = z.infer<typeof riderStep3Schema>;

export interface FullRiderRegistrationData
  extends Omit<RiderStep1FormData, 'password_confirmation'>,
    RiderStep2FormData,
    RiderStep3FormData {
  password_confirmation: string;
}
