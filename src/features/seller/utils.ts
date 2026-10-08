import { SellerRegisterFormData } from './schemas';
import { createFormDataFilePart, appendFormDataFile } from '../../utils/image';

/**
 * Builds React Native FormData payload for seller registration matching the Laravel API contract:
 * POST /api/v1/seller/auth/register
 */
export async function buildSellerRegisterFormData(data: SellerRegisterFormData): Promise<FormData> {
  const formData = new FormData();

  formData.append('name', data.name.trim());
  formData.append('email', data.email.trim().toLowerCase());
  formData.append('password', data.password);
  formData.append('password_confirmation', data.password_confirmation);
  formData.append('city', data.city || 'Karachi');
  formData.append('area', data.area || 'Baldia Town');
  formData.append('sector', data.sector);
  formData.append('catalog_category_id', String(data.catalog_category_id));
  formData.append('full_address', data.full_address.trim());
  formData.append('terms', '1');

  // Near areas as array
  if (Array.isArray(data.near_areas)) {
    data.near_areas.forEach((area) => {
      formData.append('near_areas[]', area);
    });
  }

  // Profile image file part (WinterCG Blob/File on device, legacy on test)
  const filePart = await createFormDataFilePart(
    data.profile_image.uri,
    data.profile_image.name || 'shop_profile.jpg',
    data.profile_image.type || 'image/jpeg'
  );
  appendFormDataFile(
    formData,
    'profile_image',
    filePart,
    data.profile_image.name || 'shop_profile.jpg'
  );

  return formData;
}
