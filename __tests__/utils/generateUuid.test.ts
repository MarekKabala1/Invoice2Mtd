import { generateId } from '@/utils/generateUuid';

// Mock react-native-uuid
jest.mock('react-native-uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-123-456-789'),
}));

describe('Generate UUID', () => {
  describe('generateId', () => {
    it('should generate a UUID v4', async () => {
      const result = await generateId();
      expect(result).toBe('mock-uuid-123-456-789');
    });

    it('should return a string', async () => {
      const result = await generateId();
      expect(typeof result).toBe('string');
    });
  });
});