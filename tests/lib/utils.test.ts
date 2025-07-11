import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cn,
  generateId,
  formatDate,
  formatPercent,
  formatScore,
  calculateProgress,
  debounce,
  throttle,
  sanitizeInput,
  validateEmail,
  validateUrl,
  sleep,
  range,
  chunk,
  groupBy,
  deepClone,
  isEqual,
  getColorFromString,
  truncateText,
  capitalizeFirst,
  camelToKebab,
  kebabToCamel,
  removeEmptyValues,
  downloadFile,
  copyToClipboard,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  isValidId,
} from '@/lib/utils';

describe('Utils Functions', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
    });

    it('handles Tailwind class conflicts', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('handles conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      
      expect(cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )).toBe('base-class active-class');
    });
  });

  describe('generateId', () => {
    it('generates unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('generates IDs of consistent length', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1.length).toBe(id2.length);
      expect(id1.length).toBeGreaterThan(0);
    });

    it('generates alphanumeric IDs', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('formatDate', () => {
    it('formats dates correctly', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/Jan 1, 2023/);
      expect(formatted).toMatch(/12:00/);
    });

    it('handles different dates', () => {
      const date1 = new Date('2023-12-25T15:30:00Z');
      const date2 = new Date('2023-06-15T09:15:00Z');
      
      expect(formatDate(date1)).toMatch(/Dec 25, 2023/);
      expect(formatDate(date2)).toMatch(/Jun 15, 2023/);
    });
  });

  describe('formatPercent', () => {
    it('formats percentages correctly', () => {
      expect(formatPercent(0.5)).toBe('50.0%');
      expect(formatPercent(0.75)).toBe('75.0%');
      expect(formatPercent(1)).toBe('100.0%');
    });

    it('handles decimal places', () => {
      expect(formatPercent(0.123)).toBe('12.3%');
      expect(formatPercent(0.1234)).toBe('12.3%');
    });

    it('handles edge cases', () => {
      expect(formatPercent(0)).toBe('0.0%');
      expect(formatPercent(1.5)).toBe('150.0%');
    });
  });

  describe('formatScore', () => {
    it('formats scores to 2 decimal places', () => {
      expect(formatScore(4.5)).toBe('4.50');
      expect(formatScore(3.141592)).toBe('3.14');
      expect(formatScore(5)).toBe('5.00');
    });

    it('handles negative scores', () => {
      expect(formatScore(-2.5)).toBe('-2.50');
    });

    it('handles zero', () => {
      expect(formatScore(0)).toBe('0.00');
    });
  });

  describe('calculateProgress', () => {
    it('calculates progress correctly', () => {
      expect(calculateProgress(5, 10)).toBe(50);
      expect(calculateProgress(3, 4)).toBe(75);
      expect(calculateProgress(10, 10)).toBe(100);
    });

    it('handles zero total', () => {
      expect(calculateProgress(5, 0)).toBe(0);
    });

    it('handles zero current', () => {
      expect(calculateProgress(0, 10)).toBe(0);
    });

    it('rounds results', () => {
      expect(calculateProgress(1, 3)).toBe(33);
      expect(calculateProgress(2, 3)).toBe(67);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('cancels previous calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledOnce();
    });

    it('passes arguments correctly', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn('arg1', 'arg2');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('limits function execution', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledOnce();
    });

    it('allows execution after timeout', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledOnce();

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('passes arguments correctly', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn('arg1', 'arg2');
      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('sanitizeInput', () => {
    it('removes HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeInput('<div>hello</div>')).toBe('hello');
    });

    it('removes JavaScript protocols', () => {
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")');
      expect(sanitizeInput('JAVASCRIPT:alert("xss")')).toBe('alert("xss")');
    });

    it('removes event handlers', () => {
      expect(sanitizeInput('onclick=alert("xss")')).toBe('alert("xss")');
      expect(sanitizeInput('onmouseover=alert("xss")')).toBe('alert("xss")');
    });

    it('trims whitespace', () => {
      expect(sanitizeInput('  hello world  ')).toBe('hello world');
    });

    it('handles empty strings', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
    });
  });

  describe('validateEmail', () => {
    it('validates correct email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('rejects invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });

    it('handles edge cases', () => {
      expect(validateEmail('user@domain.c')).toBe(true); // Single char TLD
      expect(validateEmail('a@b.co')).toBe(true); // Short email
    });
  });

  describe('validateUrl', () => {
    it('validates correct URLs', () => {
      expect(validateUrl('https://example.com')).toBe(true);
      expect(validateUrl('http://test.com')).toBe(true);
      expect(validateUrl('https://subdomain.example.com/path')).toBe(true);
    });

    it('rejects invalid URLs', () => {
      expect(validateUrl('invalid-url')).toBe(false);
      expect(validateUrl('example.com')).toBe(false);
      expect(validateUrl('')).toBe(false);
      expect(validateUrl('not a url')).toBe(false);
    });

    it('handles different protocols', () => {
      expect(validateUrl('ftp://example.com')).toBe(true);
      expect(validateUrl('file:///path/to/file')).toBe(true);
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resolves after specified time', async () => {
      const promise = sleep(100);
      let resolved = false;

      promise.then(() => {
        resolved = true;
      });

      expect(resolved).toBe(false);
      vi.advanceTimersByTime(100);
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe('range', () => {
    it('generates number ranges', () => {
      expect(range(1, 5)).toEqual([1, 2, 3, 4, 5]);
      expect(range(0, 3)).toEqual([0, 1, 2, 3]);
      expect(range(10, 12)).toEqual([10, 11, 12]);
    });

    it('handles single number ranges', () => {
      expect(range(5, 5)).toEqual([5]);
    });

    it('handles negative numbers', () => {
      expect(range(-2, 2)).toEqual([-2, -1, 0, 1, 2]);
    });
  });

  describe('chunk', () => {
    it('chunks arrays correctly', () => {
      expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
      expect(chunk([1, 2, 3, 4, 5, 6], 3)).toEqual([[1, 2, 3], [4, 5, 6]]);
    });

    it('handles empty arrays', () => {
      expect(chunk([], 2)).toEqual([]);
    });

    it('handles chunk size larger than array', () => {
      expect(chunk([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    });

    it('handles chunk size of 1', () => {
      expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
    });
  });

  describe('groupBy', () => {
    it('groups objects by key', () => {
      const data = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
      ];

      const grouped = groupBy(data, 'category');
      expect(grouped).toEqual({
        A: [{ category: 'A', value: 1 }, { category: 'A', value: 3 }],
        B: [{ category: 'B', value: 2 }],
      });
    });

    it('handles empty arrays', () => {
      expect(groupBy([], 'key')).toEqual({});
    });

    it('handles numeric keys', () => {
      const data = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 1, name: 'C' },
      ];

      const grouped = groupBy(data, 'id');
      expect(grouped).toEqual({
        '1': [{ id: 1, name: 'A' }, { id: 1, name: 'C' }],
        '2': [{ id: 2, name: 'B' }],
      });
    });
  });

  describe('deepClone', () => {
    it('clones primitive values', () => {
      expect(deepClone(42)).toBe(42);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
      expect(deepClone(undefined)).toBe(undefined);
    });

    it('clones arrays', () => {
      const original = [1, 2, [3, 4]];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    it('clones objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    it('clones dates', () => {
      const original = new Date('2023-01-01');
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned instanceof Date).toBe(true);
    });

    it('handles circular references gracefully', () => {
      const original: any = { a: 1 };
      original.self = original;

      // Should not throw, but behavior may vary
      expect(() => deepClone(original)).not.toThrow();
    });
  });

  describe('isEqual', () => {
    it('compares primitive values', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual('a', 'a')).toBe(true);
      expect(isEqual(true, true)).toBe(true);
      expect(isEqual(null, null)).toBe(true);
      expect(isEqual(undefined, undefined)).toBe(true);

      expect(isEqual(1, 2)).toBe(false);
      expect(isEqual('a', 'b')).toBe(false);
      expect(isEqual(true, false)).toBe(false);
    });

    it('compares arrays', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, [2, 3]], [1, [2, 3]])).toBe(true);

      expect(isEqual([1, 2, 3], [1, 2, 4])).toBe(false);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('compares objects', () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(isEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true);

      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
      expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    it('handles different types', () => {
      expect(isEqual(1, '1')).toBe(false);
      expect(isEqual([], {})).toBe(false);
      expect(isEqual(null, undefined)).toBe(false);
    });
  });

  describe('getColorFromString', () => {
    it('returns consistent colors for same strings', () => {
      const color1 = getColorFromString('test');
      const color2 = getColorFromString('test');
      expect(color1).toBe(color2);
    });

    it('returns different colors for different strings', () => {
      const color1 = getColorFromString('test1');
      const color2 = getColorFromString('test2');
      expect(color1).not.toBe(color2);
    });

    it('returns valid hex colors', () => {
      const color = getColorFromString('test');
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });

    it('handles empty strings', () => {
      const color = getColorFromString('');
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    });
  });

  describe('truncateText', () => {
    it('truncates long text', () => {
      expect(truncateText('This is a very long text', 10)).toBe('This is a...');
    });

    it('returns original text if shorter than limit', () => {
      expect(truncateText('Short text', 20)).toBe('Short text');
    });

    it('handles exact length', () => {
      expect(truncateText('Exact', 5)).toBe('Exact');
    });

    it('handles empty strings', () => {
      expect(truncateText('', 10)).toBe('');
    });
  });

  describe('capitalizeFirst', () => {
    it('capitalizes first letter', () => {
      expect(capitalizeFirst('hello')).toBe('Hello');
      expect(capitalizeFirst('world')).toBe('World');
    });

    it('handles already capitalized strings', () => {
      expect(capitalizeFirst('Hello')).toBe('Hello');
    });

    it('handles empty strings', () => {
      expect(capitalizeFirst('')).toBe('');
    });

    it('handles single characters', () => {
      expect(capitalizeFirst('a')).toBe('A');
    });
  });

  describe('camelToKebab', () => {
    it('converts camelCase to kebab-case', () => {
      expect(camelToKebab('camelCase')).toBe('camel-case');
      expect(camelToKebab('myVariableName')).toBe('my-variable-name');
    });

    it('handles already kebab-case strings', () => {
      expect(camelToKebab('kebab-case')).toBe('kebab-case');
    });

    it('handles single words', () => {
      expect(camelToKebab('word')).toBe('word');
    });
  });

  describe('kebabToCamel', () => {
    it('converts kebab-case to camelCase', () => {
      expect(kebabToCamel('kebab-case')).toBe('kebabCase');
      expect(kebabToCamel('my-variable-name')).toBe('myVariableName');
    });

    it('handles already camelCase strings', () => {
      expect(kebabToCamel('camelCase')).toBe('camelCase');
    });

    it('handles single words', () => {
      expect(kebabToCamel('word')).toBe('word');
    });
  });

  describe('removeEmptyValues', () => {
    it('removes null, undefined, and empty string values', () => {
      const input = {
        a: 'value',
        b: null,
        c: undefined,
        d: '',
        e: 0,
        f: false,
      };

      const result = removeEmptyValues(input);
      expect(result).toEqual({
        a: 'value',
        e: 0,
        f: false,
      });
    });

    it('handles empty objects', () => {
      expect(removeEmptyValues({})).toEqual({});
    });

    it('preserves valid falsy values', () => {
      const input = { a: 0, b: false, c: null };
      const result = removeEmptyValues(input);
      expect(result).toEqual({ a: 0, b: false });
    });
  });

  describe('Storage Functions', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    describe('getStorageItem', () => {
      it('retrieves stored items', () => {
        localStorage.setItem('test-key', JSON.stringify('test-value'));
        expect(getStorageItem('test-key')).toBe('test-value');
      });

      it('returns default value for non-existent items', () => {
        expect(getStorageItem('non-existent', 'default')).toBe('default');
      });

      it('handles invalid JSON', () => {
        localStorage.setItem('invalid-json', 'invalid json');
        expect(getStorageItem('invalid-json', 'default')).toBe('default');
      });
    });

    describe('setStorageItem', () => {
      it('stores items correctly', () => {
        setStorageItem('test-key', 'test-value');
        expect(localStorage.getItem('test-key')).toBe('"test-value"');
      });

      it('handles complex objects', () => {
        const obj = { a: 1, b: [2, 3] };
        setStorageItem('object-key', obj);
        expect(getStorageItem('object-key')).toEqual(obj);
      });
    });

    describe('removeStorageItem', () => {
      it('removes items correctly', () => {
        setStorageItem('test-key', 'test-value');
        removeStorageItem('test-key');
        expect(getStorageItem('test-key')).toBe(null);
      });

      it('handles non-existent items gracefully', () => {
        expect(() => removeStorageItem('non-existent')).not.toThrow();
      });
    });
  });

  describe('isValidId', () => {
    it('validates correct IDs', () => {
      expect(isValidId('valid-id')).toBe(true);
      expect(isValidId('valid_id')).toBe(true);
      expect(isValidId('validId123')).toBe(true);
      expect(isValidId('123')).toBe(true);
    });

    it('rejects invalid IDs', () => {
      expect(isValidId('')).toBe(false);
      expect(isValidId('invalid id')).toBe(false);
      expect(isValidId('invalid@id')).toBe(false);
      expect(isValidId('invalid.id')).toBe(false);
    });

    it('handles null and undefined', () => {
      expect(isValidId(null as any)).toBe(false);
      expect(isValidId(undefined as any)).toBe(false);
    });

    it('handles length limits', () => {
      expect(isValidId('a'.repeat(100))).toBe(true);
      expect(isValidId('a'.repeat(101))).toBe(false);
    });
  });

  describe('DOM Functions', () => {
    describe('downloadFile', () => {
      beforeEach(() => {
        // Mock DOM methods
        global.URL.createObjectURL = vi.fn(() => 'mock-url');
        global.URL.revokeObjectURL = vi.fn();
        
        // Mock document methods
        const mockElement = {
          href: '',
          download: '',
          click: vi.fn(),
        };
        
        document.createElement = vi.fn(() => mockElement as any);
        document.body.appendChild = vi.fn();
        document.body.removeChild = vi.fn();
      });

      it('creates download link correctly', () => {
        downloadFile('test content', 'test.txt');
        
        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(document.body.appendChild).toHaveBeenCalled();
        expect(document.body.removeChild).toHaveBeenCalled();
      });
    });

    describe('copyToClipboard', () => {
      it('uses modern clipboard API when available', async () => {
        const mockWriteText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
          value: { writeText: mockWriteText },
          writable: true,
        });

        await copyToClipboard('test text');
        expect(mockWriteText).toHaveBeenCalledWith('test text');
      });

      it('falls back to legacy method when clipboard API is not available', async () => {
        Object.defineProperty(navigator, 'clipboard', {
          value: undefined,
          writable: true,
        });

        const mockElement = {
          value: '',
          select: vi.fn(),
        };
        
        document.createElement = vi.fn(() => mockElement as any);
        document.body.appendChild = vi.fn();
        document.body.removeChild = vi.fn();
        document.execCommand = vi.fn();

        await copyToClipboard('test text');
        
        expect(document.createElement).toHaveBeenCalledWith('textarea');
        expect(mockElement.select).toHaveBeenCalled();
        expect(document.execCommand).toHaveBeenCalledWith('copy');
      });
    });
  });
});