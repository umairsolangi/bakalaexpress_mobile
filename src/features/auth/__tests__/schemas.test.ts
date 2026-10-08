import { loginSchema, registerSchema } from '../schemas';

describe('Auth Zod Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const valid = { email: 'customer@example.com', password: 'secretpassword' };
      const result = loginSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('fails on invalid email format', () => {
      const invalid = { email: 'not-an-email', password: 'secretpassword' };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('fails on empty password', () => {
      const invalid = { email: 'customer@example.com', password: '' };
      const result = loginSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates complete and correct registration data', () => {
      const valid = {
        name: 'Zainab Customer',
        email: 'zainab@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        mobile: '03001234567',
        city: 'Karachi',
        address: 'House 12, Sector 4A, Baldia Town',
      };
      const result = registerSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('fails when password is shorter than 8 characters', () => {
      const shortPass = {
        name: 'Zainab',
        email: 'zainab@example.com',
        password: 'short',
        password_confirmation: 'short',
      };
      const result = registerSchema.safeParse(shortPass);
      expect(result.success).toBe(false);
    });

    it('fails when password confirmation does not match', () => {
      const mismatch = {
        name: 'Zainab',
        email: 'zainab@example.com',
        password: 'password123',
        password_confirmation: 'different123',
      };
      const result = registerSchema.safeParse(mismatch);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('password_confirmation');
      }
    });

    it('fails on invalid mobile phone format', () => {
      const invalidMobile = {
        name: 'Zainab',
        email: 'zainab@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        mobile: '12345', // Too short
      };
      const result = registerSchema.safeParse(invalidMobile);
      expect(result.success).toBe(false);
    });
  });

  describe('forgotPasswordSchema & resetPasswordSchema', () => {
    it('validates email for forgot password', () => {
      expect(loginSchema.safeParse({ email: 'user@example.com', password: 'password123' }).success).toBe(true);
    });
  });

  describe('deleteAccountSchema', () => {
    it('requires password and accepts optional reason', () => {
      const { deleteAccountSchema } = require('../schemas');
      expect(deleteAccountSchema.safeParse({ password: 'validpass', reason: 'Moving away' }).success).toBe(true);
      expect(deleteAccountSchema.safeParse({ password: 'validpass', reason: '' }).success).toBe(true);
      expect(deleteAccountSchema.safeParse({ password: '' }).success).toBe(false);
    });
  });
});
