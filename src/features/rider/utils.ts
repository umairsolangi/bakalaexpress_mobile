import { FullRiderRegistrationData } from './schemas';
import { createFormDataFilePart, appendFormDataFile } from '../../utils/image';
import { stripCnic } from '../../utils/cnic';

/**
 * Builds React Native FormData payload for rider partner registration matching API contract:
 * POST /api/v1/rider/auth/register
 */
export async function buildRiderRegisterFormData(data: FullRiderRegistrationData): Promise<FormData> {
  const formData = new FormData();

  formData.append('name', data.name.trim());
  formData.append('email', data.email.trim().toLowerCase());
  formData.append('password', data.password);
  formData.append('password_confirmation', data.password_confirmation);
  formData.append('phone', data.phone.trim());
  formData.append('cnic_number', stripCnic(data.cnic_number));
  formData.append('vehicle_type', data.vehicle_type.trim());
  formData.append('vehicle_number', data.vehicle_number.trim());
  formData.append('address', data.address.trim());

  // 6 KYC Document file parts
  const docFields: Array<keyof Pick<
    FullRiderRegistrationData,
    | 'profile_image'
    | 'cnic_front'
    | 'cnic_back'
    | 'license_image'
    | 'vehicle_image'
    | 'registration_book'
  >> = [
    'profile_image',
    'cnic_front',
    'cnic_back',
    'license_image',
    'vehicle_image',
    'registration_book',
  ];

  for (const field of docFields) {
    const doc = data[field];
    if (doc && doc.uri) {
      const fileName = doc.name || `${field}.jpg`;
      const mimeType = doc.type || 'image/jpeg';
      const part = await createFormDataFilePart(doc.uri, fileName, mimeType);
      appendFormDataFile(formData, field, part, fileName);
    }
  }

  return formData;
}
