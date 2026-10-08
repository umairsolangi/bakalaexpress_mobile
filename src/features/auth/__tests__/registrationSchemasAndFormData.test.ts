import { formatCnic, stripCnic, maskCnic } from '../../../utils/cnic';
import { sellerRegisterSchema } from '../../seller/schemas';
import { buildSellerRegisterFormData } from '../../seller/utils';
import {
  riderStep1Schema,
  riderStep2Schema,
  riderStep3Schema,
  FullRiderRegistrationData,
} from '../../rider/schemas';
import { buildRiderRegisterFormData } from '../../rider/utils';

describe('Part 2 Registration Schemas, CNIC Helpers & FormData Builders', () => {
  describe('CNIC Helpers', () => {
    it('formatCnic formats raw digits into standard 12345-1234567-1 mask', () => {
      expect(formatCnic('4210112345671')).toBe('42101-1234567-1');
      expect(formatCnic('42101')).toBe('42101');
      expect(formatCnic('421011234')).toBe('42101-1234');
      expect(formatCnic('42101-1234567-1')).toBe('42101-1234567-1');
    });

    it('stripCnic removes all non-digit characters and limits to 13 digits', () => {
      expect(stripCnic('42101-1234567-1')).toBe('4210112345671');
      expect(stripCnic('42101 1234567 1 extra')).toBe('4210112345671');
    });

    it('maskCnic masks all digits except the last 4 digits for privacy', () => {
      expect(maskCnic('42101-1234567-1')).toBe('*********5671');
      expect(maskCnic('1234')).toBe('1234');
    });
  });

  describe('Seller Registration Schema', () => {
    const validSeller = {
      name: 'Bismillah General Store',
      email: 'bismillah@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      city: 'Karachi',
      area: 'Baldia Town',
      sector: '4A',
      catalog_category_id: 1,
      near_areas: ['Ali Chowk', 'Gulshan-e-Ghazi'],
      full_address: 'Shop # 4, Main Road, Sector 4A, Baldia Town',
      terms: true,
      profile_image: { uri: 'file:///cache/shop.jpg' },
    };

    it('validates a complete and correct seller registration payload', () => {
      const result = sellerRegisterSchema.safeParse(validSeller);
      expect(result.success).toBe(true);
    });

    it('fails when terms are not accepted', () => {
      const result = sellerRegisterSchema.safeParse({
        ...validSeller,
        terms: false,
      });
      expect(result.success).toBe(false);
    });

    it('fails when sector is invalid (not 4A, 4B, or 4C)', () => {
      const result = sellerRegisterSchema.safeParse({
        ...validSeller,
        sector: '5D',
      });
      expect(result.success).toBe(false);
    });

    it('fails when near_areas is empty', () => {
      const result = sellerRegisterSchema.safeParse({
        ...validSeller,
        near_areas: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Rider Registration Schemas', () => {
    describe('Step 1 Personal', () => {
      const validStep1 = {
        name: 'Tariq Rider',
        email: 'tariq@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        phone: '03001234567',
        address: 'House # 10, Baldia Town',
      };

      it('validates step 1 with 11-digit phone number', () => {
        expect(riderStep1Schema.safeParse(validStep1).success).toBe(true);
      });

      it('fails when phone is not exactly 11 digits', () => {
        expect(
          riderStep1Schema.safeParse({ ...validStep1, phone: '0300123456' }).success
        ).toBe(false);
        expect(
          riderStep1Schema.safeParse({ ...validStep1, phone: '030012345678' }).success
        ).toBe(false);
      });
    });

    describe('Step 2 Vehicle & CNIC', () => {
      it('validates step 2 and strips CNIC to 13 digits', () => {
        const result = riderStep2Schema.safeParse({
          vehicle_type: 'Motorcycle',
          vehicle_number: 'KHI-9876',
          cnic_number: '42101-1234567-1',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.cnic_number).toBe('4210112345671');
        }
      });

      it('fails if CNIC has fewer than 13 digits', () => {
        const result = riderStep2Schema.safeParse({
          vehicle_type: 'Motorcycle',
          vehicle_number: 'KHI-9876',
          cnic_number: '42101-1234',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('Step 3 Documents', () => {
      it('requires all six document slots', () => {
        const doc = { uri: 'file:///cache/doc.jpg' };
        const validDocs = {
          profile_image: doc,
          cnic_front: doc,
          cnic_back: doc,
          license_image: doc,
          vehicle_image: doc,
          registration_book: doc,
        };

        expect(riderStep3Schema.safeParse(validDocs).success).toBe(true);

        // Missing registration_book
        const missingOne = { ...validDocs, registration_book: undefined };
        expect(riderStep3Schema.safeParse(missingOne).success).toBe(false);
      });
    });
  });

  describe('FormData Builders', () => {
    it('buildSellerRegisterFormData appends all contract fields and file parts', async () => {
      const appendSpy = jest.spyOn(FormData.prototype, 'append');

      const sellerData = {
        name: 'Bismillah Store',
        email: 'bismillah@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        city: 'Karachi',
        area: 'Baldia Town',
        sector: '4A',
        catalog_category_id: 2,
        near_areas: ['Ali Chowk', 'Saeedabad'],
        full_address: 'Shop # 12, Sector 4A, Baldia Town',
        terms: true as const,
        profile_image: {
          uri: 'file:///cache/shop.jpg',
          name: 'shop.jpg',
          type: 'image/jpeg',
        },
      };

      const formData = await buildSellerRegisterFormData(sellerData);
      expect(formData).toBeInstanceOf(FormData);

      expect(appendSpy).toHaveBeenCalledWith('name', 'Bismillah Store');
      expect(appendSpy).toHaveBeenCalledWith('email', 'bismillah@example.com');
      expect(appendSpy).toHaveBeenCalledWith('password', 'password123');
      expect(appendSpy).toHaveBeenCalledWith('sector', '4A');
      expect(appendSpy).toHaveBeenCalledWith('catalog_category_id', '2');
      expect(appendSpy).toHaveBeenCalledWith('terms', '1');
      expect(appendSpy).toHaveBeenCalledWith('near_areas[]', 'Ali Chowk');
      expect(appendSpy).toHaveBeenCalledWith('near_areas[]', 'Saeedabad');

      expect(appendSpy).toHaveBeenCalledWith('profile_image', {
        uri: 'file:///cache/shop.jpg',
        name: 'shop.jpg',
        type: 'image/jpeg',
      });

      appendSpy.mockRestore();
    });

    it('buildRiderRegisterFormData appends all 6 documents and 13 digit CNIC', async () => {
      const appendSpy = jest.spyOn(FormData.prototype, 'append');

      const doc = { uri: 'file:///cache/doc.jpg', name: 'd.jpg', type: 'image/jpeg' };
      const riderData: FullRiderRegistrationData = {
        name: 'Tariq Rider',
        email: 'tariq@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        phone: '03001234567',
        address: 'Baldia Town',
        vehicle_type: 'Motorcycle',
        vehicle_number: 'KHI-1234',
        cnic_number: '42101-1234567-1',
        profile_image: doc,
        cnic_front: doc,
        cnic_back: doc,
        license_image: doc,
        vehicle_image: doc,
        registration_book: doc,
      };

      const formData = await buildRiderRegisterFormData(riderData);
      expect(formData).toBeInstanceOf(FormData);

      expect(appendSpy).toHaveBeenCalledWith('name', 'Tariq Rider');
      expect(appendSpy).toHaveBeenCalledWith('email', 'tariq@example.com');
      expect(appendSpy).toHaveBeenCalledWith('cnic_number', '4210112345671');
      expect(appendSpy).toHaveBeenCalledWith('phone', '03001234567');
      expect(appendSpy).toHaveBeenCalledWith('vehicle_type', 'Motorcycle');
      expect(appendSpy).toHaveBeenCalledWith('vehicle_number', 'KHI-1234');

      expect(appendSpy).toHaveBeenCalledWith('profile_image', {
        uri: 'file:///cache/doc.jpg',
        name: 'd.jpg',
        type: 'image/jpeg',
      });
      expect(appendSpy).toHaveBeenCalledWith('cnic_front', {
        uri: 'file:///cache/doc.jpg',
        name: 'd.jpg',
        type: 'image/jpeg',
      });
      expect(appendSpy).toHaveBeenCalledWith('cnic_back', {
        uri: 'file:///cache/doc.jpg',
        name: 'd.jpg',
        type: 'image/jpeg',
      });
      expect(appendSpy).toHaveBeenCalledWith('license_image', {
        uri: 'file:///cache/doc.jpg',
        name: 'd.jpg',
        type: 'image/jpeg',
      });
      expect(appendSpy).toHaveBeenCalledWith('vehicle_image', {
        uri: 'file:///cache/doc.jpg',
        name: 'd.jpg',
        type: 'image/jpeg',
      });
      expect(appendSpy).toHaveBeenCalledWith('registration_book', {
        uri: 'file:///cache/doc.jpg',
        name: 'd.jpg',
        type: 'image/jpeg',
      });

      appendSpy.mockRestore();
    });
  });
});
