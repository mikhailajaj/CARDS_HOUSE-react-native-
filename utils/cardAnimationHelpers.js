/**
 * Card Animation Helpers
 * Utilities for calculating card positions and managing card animations
 */

/**
 * Get the position of a card in a player's hand
 * @param {number} playerIndex - The player index (0-3)
 * @param {number} cardIndex - The index of the card in the hand
 * @param {number} totalCards - Total number of cards in hand
 * @param {Object} screenDimensions - Screen width and height
 * @returns {Object} Position object with x, y, rotation
 */
export const getCardPositionInHand = (playerIndex, cardIndex, totalCards, screenDimensions) => {
  const { width, height } = screenDimensions;
  
  switch (playerIndex) {
    case 0: // Top player
      return getTopPlayerCardPosition(cardIndex, totalCards, width, height);
    case 1: // Left player
      return getLeftPlayerCardPosition(cardIndex, totalCards, width, height);
    case 2: // Bottom player (human)
      return getBottomPlayerCardPosition(cardIndex, totalCards, width, height);
    case 3: // Right player
      return getRightPlayerCardPosition(cardIndex, totalCards, width, height);
    default:
      return { x: width / 2, y: height / 2, rotation: 0 };
  }
};

/**
 * Get position for top player's card (horizontal layout)
 */
const getTopPlayerCardPosition = (cardIndex, totalCards, width, height) => {
  const cardWidth = 60;
  const spacing = 8;
  const totalWidth = totalCards * (cardWidth + spacing);
  const startX = (width - totalWidth) / 2;
  
  return {
    x: startX + cardIndex * (cardWidth + spacing) + cardWidth / 2,
    y: 80 + 60, // top position + card height offset
    rotation: 0,
  };
};

/**
 * Get position for left player's card (vertical stack)
 */
const getLeftPlayerCardPosition = (cardIndex, totalCards, width, height) => {
  return {
    x: 8 + 45, // left offset + half width
    y: height / 2,
    rotation: 0,
  };
};

/**
 * Get position for bottom player's card (fan layout)
 */
const getBottomPlayerCardPosition = (cardIndex, totalCards, width, height) => {
  const cardWidth = 110;
  const baseSpacing = 50;
  const maxSpread = width * 0.8;
  const totalWidth = (totalCards - 1) * baseSpacing;
  const spacing = totalWidth > maxSpread ? maxSpread / (totalCards - 1) : baseSpacing;
  const startX = (width - ((totalCards - 1) * spacing)) / 2;
  
  // Fan arc calculation
  const midIndex = (totalCards - 1) / 2;
  const deviation = cardIndex - midIndex;
  const maxRotation = 15;
  const rotation = (deviation / midIndex) * maxRotation;
  
  // Vertical offset for fan effect
  const verticalOffset = Math.abs(deviation) * 8;
  
  return {
    x: startX + cardIndex * spacing + cardWidth / 2,
    y: height - 20 - 120 + verticalOffset, // bottom position with fan curve
    rotation: rotation,
  };
};

/**
 * Get position for right player's card (vertical stack)
 */
const getRightPlayerCardPosition = (cardIndex, totalCards, width, height) => {
  return {
    x: width - 8 - 45, // right offset + half width
    y: height / 2,
    rotation: 0,
  };
};

/**
 * Get the position where a card should land in the trick area
 * @param {number} playerIndex - The player index (0-3)
 * @param {Object} screenDimensions - Screen width and height
 * @returns {Object} Position object with x, y
 */
export const getTrickAreaCardPosition = (playerIndex, screenDimensions) => {
  const { width, height } = screenDimensions;
  const centerX = width / 2;
  const centerY = height / 2;
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
 * Generate a unique ID for an animating card
 */
let animationIdCounter = 0;
export const generateAnimationId = () => {
  return `anim-${Date.now()}-${animationIdCounter++}`;
};

/**
 * Calculate screen dimensions from a layout event
 * @param {Object} layout - Layout object from onLayout event
 * @returns {Object} Screen dimensions
 */
export const getScreenDimensions = (layout) => {
  return {
    width: layout?.width || 400,
    height: layout?.height || 800,
  };
};
