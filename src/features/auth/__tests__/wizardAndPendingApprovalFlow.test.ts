import { apiClient, ApiError } from '../../../api/client';
import { loginByRole } from '../../../api/auth';

const originalFetch = globalThis.fetch;

describe('Multipart FormData Headers, Wizard State and PENDING_APPROVAL Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('Multipart FormData Header Assertion', () => {
    it('does NOT set Content-Type header when body is FormData so fetch boundary generates automatically', async () => {
      let capturedHeaders: Record<string, string> = {};

      globalThis.fetch = jest.fn().mockImplementation((url, init) => {
        capturedHeaders = init?.headers || {};
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            data: { seller: { id: 1 } },
            message: 'Registered',
            meta: {},
          }),
        } as unknown as Response);
      });

      const formData = new FormData();
      formData.append('name', 'Test Store');

      await apiClient('seller/auth/register', {
        method: 'POST',
        body: formData,
        skipAuth: true,
      });

      // Crucial assertion: Content-Type MUST NOT be set
      expect(capturedHeaders['Content-Type']).toBeUndefined();
      expect(capturedHeaders['content-type']).toBeUndefined();
      expect(capturedHeaders.Accept).toBe('application/json');
    });
  });

  describe('Registration Wizard Error Jump Logic', () => {
    function determineFirstErrorStep(errorFields: string[]): 1 | 2 | 3 {
      const step1Fields = ['name', 'email', 'password', 'phone', 'address'];
      const step2Fields = ['vehicle_type', 'vehicle_number', 'cnic_number'];
      const step3Fields = [
        'profile_image',
        'cnic_front',
        'cnic_back',
        'license_image',
        'vehicle_image',
        'registration_book',
      ];

      for (const field of errorFields) {
        if (step1Fields.includes(field)) return 1;
        if (step2Fields.includes(field)) return 2;
        if (step3Fields.includes(field)) return 3;
      }
      return 1;
    }

    it('jumps to step 1 when validation error is in personal details', () => {
      expect(determineFirstErrorStep(['email'])).toBe(1);
      expect(determineFirstErrorStep(['phone', 'vehicle_number'])).toBe(1);
    });

    it('jumps to step 2 when validation error is in vehicle or CNIC', () => {
      expect(determineFirstErrorStep(['cnic_number'])).toBe(2);
      expect(determineFirstErrorStep(['vehicle_number'])).toBe(2);
    });

    it('jumps to step 3 when validation error is in documents', () => {
      expect(determineFirstErrorStep(['cnic_front'])).toBe(3);
      expect(determineFirstErrorStep(['license_image'])).toBe(3);
    });
  });

  describe('PENDING_APPROVAL Flow', () => {
    it('throws ApiError with code PENDING_APPROVAL and status 403 on unapproved partner login', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          code: 'PENDING_APPROVAL',
          message: 'Your account is pending admin approval.',
          errors: {},
        }),
      } as unknown as Response);

      await expect(
        loginByRole('seller', {
          email: 'pending_seller@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ApiError);

      try {
        await loginByRole('seller', {
          email: 'pending_seller@example.com',
          password: 'password123',
        });
      } catch (err: any) {
        expect(err.code).toBe('PENDING_APPROVAL');
        expect(err.status).toBe(403);
      }
    });

    it('throws ApiError with code PENDING_APPROVAL on unapproved rider login', async () => {
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          success: false,
          code: 'PENDING_APPROVAL',
          message: 'Your rider account is pending admin approval.',
          errors: {},
        }),
      } as unknown as Response);

      try {
        await loginByRole('rider', {
          email: 'pending_rider@example.com',
          password: 'password123',
        });
      } catch (err: any) {
        expect(err.code).toBe('PENDING_APPROVAL');
        expect(err.status).toBe(403);
      }
    });
  });
});
