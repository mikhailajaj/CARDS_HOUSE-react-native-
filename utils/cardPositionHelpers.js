import { Dimensions } from 'react-native';

/**
 * Calculate exact position for a card in the trick area
 * This MUST match TrickArea's original getCardPosition calculations exactly
 */
/**
 * Calculate exact position for a card in the trick area
 * This matches the original cardAnimationHelpers.js implementation
 */
export const getTrickAreaCardPosition = (playerIndex) => {
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  const offset = 50; // Distance from center for each player's card
  
  switch (playerIndex) {
    case 0: // Top player - card goes to top of trick area
      return { x: centerX, y: centerY - offset };
    case 1: // Left player - card goes to left of trick area
      return { x: centerX - offset, y: centerY };
    case 2: // Bottom player - card goes to bottom of trick area
      return { x: centerX, y: centerY + offset };
    case 3: // Right player - card goes to right of trick area
      return { x: centerX + offset, y: centerY };
    default:
      return { x: centerX, y: centerY };
  }
};

/**
 * Card dimensions for different contexts
 */
export const CARD_DIMENSIONS = {
  HAND: {
    width: 80,
    get height() { return this.width * 1.5; },
  },
  TABLE: {
    width: 60,
    get height() { return this.width * 1.5; },
  },
  // Generic scale factor helper
  scaleForWidth(startWidth) {
    return this.TABLE.width / startWidth;
  },
};
