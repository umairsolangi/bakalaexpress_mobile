import {
  formatMoney,
  parseToPaisa,
  paisaToString,
  addMoney,
  multiplyMoney,
} from '../money';

describe('Money Formatter & Utilities', () => {
  describe('formatMoney', () => {
    it('formats amounts with .00 as integer rupees with "Rs 1,250" format', () => {
      expect(formatMoney('280.00')).toBe('Rs 280');
      expect(formatMoney('1250.00')).toBe('Rs 1,250');
      expect(formatMoney('10000.00')).toBe('Rs 10,000');
    });

    it('formats amounts with non-zero decimals with 2 decimal places', () => {
      expect(formatMoney('1250.50')).toBe('Rs 1,250.50');
      expect(formatMoney('1250.05')).toBe('Rs 1,250.05');
      expect(formatMoney('15.75')).toBe('Rs 15.75');
    });

    it('handles numeric and zero inputs cleanly', () => {
      expect(formatMoney(280)).toBe('Rs 280');
      expect(formatMoney('0.00')).toBe('Rs 0');
      expect(formatMoney(0)).toBe('Rs 0');
      expect(formatMoney(null)).toBe('Rs 0');
      expect(formatMoney(undefined)).toBe('Rs 0');
    });
  });

  describe('paisa conversions and arithmetic', () => {
    it('converts string money to integer paisa accurately', () => {
      expect(parseToPaisa('280.00')).toBe(28000);
      expect(parseToPaisa('15.50')).toBe(1550);
      expect(parseToPaisa('15.5')).toBe(1550);
      expect(parseToPaisa('0.05')).toBe(5);
    });

    it('converts integer paisa to 2-decimal string', () => {
      expect(paisaToString(28000)).toBe('280.00');
      expect(paisaToString(1550)).toBe('15.50');
      expect(paisaToString(5)).toBe('0.05');
    });

    it('adds money values without IEEE-754 float rounding issues', () => {
      // 0.1 + 0.2 = 0.30 (in floats this is 0.30000000000000004)
      const sum = addMoney('0.10', '0.20');
      expect(sum).toBe('0.30');

      const total = addMoney('280.00', '15.50', '4.50');
      expect(total).toBe('300.00');
    });

    it('multiplies money by integer quantity accurately', () => {
      expect(multiplyMoney('280.00', 3)).toBe('840.00');
      expect(multiplyMoney('15.50', 3)).toBe('46.50');
    });
  });
});
