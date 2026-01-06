/**
 * Unit Tests for Play Engine (utils/engine/PlayEngine.js)
 * Tests: PE-001 to PE-012
 * Target Coverage: 95% statement, 90% branch
 */

import {
  nextPlayerClockwise,
  nextPlayerAnticlockwise,
  legalCardsFor,
  getCardValue,
  chooseAiCardSmart
} from '../../utils/engine/PlayEngine';

describe('PlayEngine - Player Navigation', () => {
  
  test('PE-001: Next player clockwise wraps correctly', () => {
    expect(nextPlayerClockwise(0)).toBe(3);
    expect(nextPlayerClockwise(3)).toBe(2);
    expect(nextPlayerClockwise(2)).toBe(1);
    expect(nextPlayerClockwise(1)).toBe(0);
  });

  test('PE-002: Next player anticlockwise wraps correctly', () => {
    expect(nextPlayerAnticlockwise(0)).toBe(1);
    expect(nextPlayerAnticlockwise(1)).toBe(2);
    expect(nextPlayerAnticlockwise(2)).toBe(3);
    expect(nextPlayerAnticlockwise(3)).toBe(0);
  });
});

describe('PlayEngine - Legal Card Logic', () => {
  
  const hand = [
    { suit: 'Hearts', label: 'Ace', value: 14 },
    { suit: 'Hearts', label: '5', value: 5 },
    { suit: 'Clubs', label: 'King', value: 13 },
    { suit: 'Clubs', label: '3', value: 3 },
    { suit: 'Spades', label: 'Queen', value: 12 }
  ];

  test('PE-003: Must follow suit when holding lead suit', () => {
    const leadSuit = 'Hearts';
    const legal = legalCardsFor(hand, leadSuit);
    
    expect(legal).toHaveLength(2);
    expect(legal.every(card => card.suit === 'Hearts')).toBe(true);
  });

  test('PE-004: Can play any card when void in lead suit', () => {
    const leadSuit = 'Diamonds';
    const legal = legalCardsFor(hand, leadSuit);
    
    expect(legal).toHaveLength(5); // All cards are legal
    expect(legal).toEqual(hand);
  });

  test('PE-005: No lead suit - all cards legal', () => {
    const legal = legalCardsFor(hand, null);
    
    expect(legal).toHaveLength(5);
    expect(legal).toEqual(hand);
  });

  test('PE-006: Empty hand returns empty legal cards', () => {
    const legal = legalCardsFor([], 'Hearts');
    expect(legal).toHaveLength(0);
  });

  test('PE-007: Invalid hand returns empty array', () => {
    const legal = legalCardsFor(null, 'Hearts');
    expect(legal).toHaveLength(0);
  });
});

describe('PlayEngine - AI Card Selection', () => {
  
  test('PE-008: AI leading plays strongest suit', () => {
    const hand = [
      { suit: 'Hearts', label: 'Ace', value: 14 },
      { suit: 'Hearts', label: 'King', value: 13 },
      { suit: 'Clubs', label: '3', value: 3 },
      { suit: 'Clubs', label: '2', value: 2 }
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick: [],
      leadSuit: null,
      trumpSuit: 'Spades',
      playerIndex: 0,
      players: []
    });
    
    expect(card).toBeTruthy();
    expect(card.suit).toBe('Hearts'); // Should lead from strongest suit
    expect(card.value).toBeGreaterThanOrEqual(13); // Should play high
  });

  test('PE-009: AI second player tries to win cheaply', () => {
    const hand = [
      { suit: 'Hearts', label: '5', value: 5 },
      { suit: 'Hearts', label: '10', value: 10 },
      { suit: 'Clubs', label: 'Ace', value: 14 }
    ];
    
    const trick = [
      { player: 0, card: { suit: 'Hearts', label: '7', value: 7 } }
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick,
      leadSuit: 'Hearts',
      trumpSuit: 'Spades',
      playerIndex: 1,
      players: []
    });
    
    expect(card.suit).toBe('Hearts'); // Must follow suit
    expect(card.value).toBe(10); // Should play lowest card that wins
  });

  test('PE-010: AI third player conserves if partner winning', () => {
    const hand = [
      { suit: 'Hearts', label: 'Ace', value: 14 },
      { suit: 'Hearts', label: '3', value: 3 }
    ];
    
    const trick = [
      { player: 0, card: { suit: 'Hearts', label: '5', value: 5 } },
      { player: 1, card: { suit: 'Hearts', label: 'King', value: 13 } } // Partner winning
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick,
      leadSuit: 'Hearts',
      trumpSuit: 'Spades',
      playerIndex: 2, // Partner of player 0
      players: []
    });
    
    expect(card.value).toBe(3); // Should play lowest card
  });

  test('PE-011: AI third player tries to win if partner losing', () => {
    const hand = [
      { suit: 'Hearts', label: 'Ace', value: 14 },
      { suit: 'Hearts', label: '3', value: 3 }
    ];
    
    const trick = [
      { player: 1, card: { suit: 'Hearts', label: 'King', value: 13 } }, // Opponent winning
      { player: 0, card: { suit: 'Hearts', label: '5', value: 5 } }  // Partner losing
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick,
      leadSuit: 'Hearts',
      trumpSuit: 'Spades',
      playerIndex: 2, // Partner of player 0
      players: []
    });
    
    expect(card.value).toBe(14); // Should try to win with Ace
  });

  test('PE-012: AI fourth player conserves if partner winning', () => {
    const hand = [
      { suit: 'Hearts', label: 'Ace', value: 14 },
      { suit: 'Hearts', label: '2', value: 2 }
    ];
    
    const trick = [
      { player: 0, card: { suit: 'Hearts', label: '5', value: 5 } },
      { player: 1, card: { suit: 'Hearts', label: 'King', value: 13 } }, // Partner winning
      { player: 2, card: { suit: 'Hearts', label: '3', value: 3 } }
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick,
      leadSuit: 'Hearts',
      trumpSuit: 'Spades',
      playerIndex: 3, // Partner of player 1
      players: []
    });
    
    expect(card.value).toBe(2); // Should conserve - play lowest
  });

  test('PE-013: AI fourth player wins with minimal card', () => {
    const hand = [
      { suit: 'Hearts', label: 'Ace', value: 14 },
      { suit: 'Hearts', label: '10', value: 10 },
      { suit: 'Hearts', label: '2', value: 2 }
    ];
    
    const trick = [
      { player: 0, card: { suit: 'Hearts', label: '5', value: 5 } },
      { player: 1, card: { suit: 'Hearts', label: '7', value: 7 } },
      { player: 2, card: { suit: 'Hearts', label: '3', value: 3 } }
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick,
      leadSuit: 'Hearts',
      trumpSuit: 'Spades',
      playerIndex: 3, // Partner of player 1 (who is losing)
      players: []
    });
    
    // Should play 10 (minimal card that wins over 7)
    expect(card.value).toBe(10);
  });

  test('PE-014: AI trumps when void in lead suit', () => {
    const hand = [
      { suit: 'Spades', label: '2', value: 2 }, // Trump
      { suit: 'Spades', label: '5', value: 5 }, // Trump
      { suit: 'Clubs', label: 'Ace', value: 14 }
    ];
    
    const trick = [
      { player: 0, card: { suit: 'Hearts', label: 'King', value: 13 } }
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick,
      leadSuit: 'Hearts',
      trumpSuit: 'Spades',
      playerIndex: 1,
      players: []
    });
    
    expect(card.suit).toBe('Spades'); // Should trump
    expect(card.value).toBe(2); // Should use lowest trump
  });

  test('PE-015: AI discards lowest when cannot win', () => {
    const hand = [
      { suit: 'Clubs', label: 'King', value: 13 },
      { suit: 'Clubs', label: '3', value: 3 },
      { suit: 'Clubs', label: '2', value: 2 }
    ];
    
    const trick = [
      { player: 0, card: { suit: 'Hearts', label: 'Ace', value: 14 } }
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick,
      leadSuit: 'Hearts',
      trumpSuit: 'Spades',
      playerIndex: 1,
      players: []
    });
    
    // Void in Hearts, no trumps, should discard lowest
    expect(card.value).toBe(2);
  });

  test('PE-016: AI leads trump when holding many trumps', () => {
    const hand = [
      { suit: 'Spades', label: 'Ace', value: 14 },
      { suit: 'Spades', label: 'King', value: 13 },
      { suit: 'Spades', label: 'Queen', value: 12 },
      { suit: 'Spades', label: 'Jack', value: 11 },
      { suit: 'Spades', label: '10', value: 10 },
      { suit: 'Spades', label: '5', value: 5 },
      { suit: 'Hearts', label: '3', value: 3 }
    ];
    
    const card = chooseAiCardSmart({
      hand,
      trick: [],
      leadSuit: null,
      trumpSuit: 'Spades',
      playerIndex: 0,
      players: []
    });
    
    expect(card.suit).toBe('Spades'); // Should lead trump
  });
});

describe('PlayEngine - Edge Cases', () => {
  
  test('PE-017: Single card in hand returns that card', () => {
    const hand = [{ suit: 'Hearts', label: 'Ace', value: 14 }];
    
    const card = chooseAiCardSmart({
      hand,
      trick: [],
      leadSuit: null,
      trumpSuit: 'Spades',
      playerIndex: 0,
      players: []
    });
    
    expect(card).toEqual(hand[0]);
  });

  test('PE-018: Empty hand returns null', () => {
    const card = chooseAiCardSmart({
      hand: [],
      trick: [],
      leadSuit: null,
      trumpSuit: 'Spades',
      playerIndex: 0,
      players: []
    });
    
    expect(card).toBeNull();
  });
});
