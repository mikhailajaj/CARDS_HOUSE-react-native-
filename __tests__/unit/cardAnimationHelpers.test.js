import {
  getCardPositionInHand,
  getTrickAreaCardPosition,
  generateAnimationId,
  getScreenDimensions,
} from '../../utils/cardAnimationHelpers';

describe('cardAnimationHelpers', () => {
  const mockScreenDimensions = { width: 400, height: 800 };

  describe('getCardPositionInHand', () => {
    it('calculates position for top player (index 0)', () => {
      const position = getCardPositionInHand(0, 5, 10, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('rotation');
      expect(typeof position.x).toBe('number');
      expect(typeof position.y).toBe('number');
      expect(typeof position.rotation).toBe('number');
    });

    it('calculates position for left player (index 1)', () => {
      const position = getCardPositionInHand(1, 5, 10, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('rotation');
    });

    it('calculates position for bottom player (index 2)', () => {
      const position = getCardPositionInHand(2, 5, 10, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('rotation');
      // Bottom player has fan layout with rotation
      expect(position.rotation).not.toBe(0);
    });

    it('calculates position for right player (index 3)', () => {
      const position = getCardPositionInHand(3, 5, 10, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('rotation');
    });

    it('handles invalid player index', () => {
      const position = getCardPositionInHand(99, 5, 10, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      expect(position).toHaveProperty('rotation');
    });

    it('handles edge cases for card index', () => {
      const firstCard = getCardPositionInHand(2, 0, 10, mockScreenDimensions);
      const lastCard = getCardPositionInHand(2, 9, 10, mockScreenDimensions);
      expect(firstCard.x).not.toBe(lastCard.x);
    });
  });

  describe('getTrickAreaCardPosition', () => {
    it('calculates position for top player (index 0)', () => {
      const position = getTrickAreaCardPosition(0, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      // Top player card should be in center-top
      expect(position.x).toBe(mockScreenDimensions.width / 2);
      expect(position.y).toBeLessThan(mockScreenDimensions.height / 2);
    });

    it('calculates position for left player (index 1)', () => {
      const position = getTrickAreaCardPosition(1, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      // Left player card should be in center-left
      expect(position.x).toBeLessThan(mockScreenDimensions.width / 2);
      expect(position.y).toBe(mockScreenDimensions.height / 2);
    });

    it('calculates position for bottom player (index 2)', () => {
      const position = getTrickAreaCardPosition(2, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      // Bottom player card should be in center-bottom
      expect(position.x).toBe(mockScreenDimensions.width / 2);
      expect(position.y).toBeGreaterThan(mockScreenDimensions.height / 2);
    });

    it('calculates position for right player (index 3)', () => {
      const position = getTrickAreaCardPosition(3, mockScreenDimensions);
      expect(position).toHaveProperty('x');
      expect(position).toHaveProperty('y');
      // Right player card should be in center-right
      expect(position.x).toBeGreaterThan(mockScreenDimensions.width / 2);
      expect(position.y).toBe(mockScreenDimensions.height / 2);
    });
  });

  describe('generateAnimationId', () => {
    it('generates unique IDs', () => {
      const id1 = generateAnimationId();
      const id2 = generateAnimationId();
      expect(id1).not.toBe(id2);
    });

    it('generates IDs with correct format', () => {
      const id = generateAnimationId();
      expect(id).toMatch(/^anim-\d+-\d+$/);
    });

    it('generates multiple unique IDs in sequence', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateAnimationId());
      }
      expect(ids.size).toBe(100);
    });
  });

  describe('getScreenDimensions', () => {
    it('extracts dimensions from layout object', () => {
      const layout = { width: 375, height: 667 };
      const dimensions = getScreenDimensions(layout);
      expect(dimensions).toEqual({ width: 375, height: 667 });
    });

    it('handles missing layout with defaults', () => {
      const dimensions = getScreenDimensions(null);
      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
      expect(dimensions.width).toBe(400);
      expect(dimensions.height).toBe(800);
    });

    it('handles undefined layout with defaults', () => {
      const dimensions = getScreenDimensions(undefined);
      expect(dimensions).toHaveProperty('width');
      expect(dimensions).toHaveProperty('height');
    });
  });
});
