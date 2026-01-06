/**
 * Unit Tests for Game Logic (utils/gameLogic.js)
 * Tests: GL-001 to GL-029
 * Target Coverage: 100% statement, 100% branch
 */

import {
  createDeck,
  shuffleDeck,
  dealCards,
  getCardValue,
  determineTrickWinner,
  getNextPlayer,
  getFirstBidder,
  sortHand,
  updateScores,
  initializePlayers
} from '../../utils/gameLogic';

import { simpleTrick, trumpWinsTrick, highTrumpWinsTrick, offSuitDoesNotWin, mixedSuitTrick, allSameSuit } from '../fixtures/sampleTricks';

describe('GameLogic - Deck Operations', () => {
  
  test('GL-001: Create deck returns 52 cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
  });

  test('GL-002: Create deck has 4 suits', () => {
    const deck = createDeck();
    const suits = [...new Set(deck.map(card => card.suit))];
    expect(suits).toHaveLength(4);
    expect(suits).toEqual(expect.arrayContaining(['Clubs', 'Diamonds', 'Hearts', 'Spades']));
  });

  test('GL-003: Create deck has 13 cards per suit', () => {
    const deck = createDeck();
    const suitCounts = deck.reduce((acc, card) => {
      acc[card.suit] = (acc[card.suit] || 0) + 1;
      return acc;
    }, {});
    
    Object.values(suitCounts).forEach(count => {
      expect(count).toBe(13);
    });
  });

  test('GL-004: Shuffle deck changes order', () => {
    const deck1 = createDeck();
    const deck2 = [...deck1]; // Copy
    
    // Mock Math.random for deterministic test
    const originalRandom = Math.random;
    Math.random = jest.fn()
      .mockReturnValueOnce(0.5)
      .mockReturnValueOnce(0.3)
      .mockReturnValueOnce(0.7)
      .mockReturnValueOnce(0.2);
    
    shuffleDeck(deck2);
    
    Math.random = originalRandom;
    
    // After shuffle, at least one card should be in different position
    let orderChanged = false;
    for (let i = 0; i < deck1.length; i++) {
      if (deck1[i].suit !== deck2[i].suit || deck1[i].label !== deck2[i].label) {
        orderChanged = true;
        break;
      }
    }
    expect(orderChanged).toBe(true);
  });

  test('GL-005: Shuffle deck preserves all cards', () => {
    const deck = createDeck();
    const beforeShuffle = [...deck];
    shuffleDeck(deck);
    
    expect(deck).toHaveLength(52);
    
    // Check all suits and values are still present
    const beforeSuits = beforeShuffle.map(c => `${c.suit}-${c.label}`).sort();
    const afterSuits = deck.map(c => `${c.suit}-${c.label}`).sort();
    expect(afterSuits).toEqual(beforeSuits);
  });

  test('GL-006: Deal cards distributes 13 cards per player', () => {
    const deck = createDeck();
    const hands = dealCards(deck, 4);
    
    expect(hands).toHaveLength(4);
    hands.forEach(hand => {
      expect(hand).toHaveLength(13);
    });
  });

  test('GL-007: Deal cards with non-standard player count', () => {
    const deck = createDeck();
    const hands = dealCards(deck, 3);
    
    expect(hands).toHaveLength(3);
    // 52 cards / 3 players = 17 cards each, with 1 remaining
    expect(hands[0].length + hands[1].length + hands[2].length).toBeLessThanOrEqual(52);
  });
});

describe('GameLogic - Card Value Logic', () => {
  
  test('GL-008: Get card value for numeric cards (2-10)', () => {
    expect(getCardValue({ label: '2' })).toBe(2);
    expect(getCardValue({ label: '5' })).toBe(5);
    expect(getCardValue({ label: '10' })).toBe(10);
  });

  test('GL-009: Get card value for face cards (J, Q, K)', () => {
    expect(getCardValue({ label: 'Jack' })).toBe(11);
    expect(getCardValue({ label: 'Queen' })).toBe(12);
    expect(getCardValue({ label: 'King' })).toBe(13);
  });

  test('GL-010: Get card value for Ace returns 14', () => {
    expect(getCardValue({ label: 'Ace' })).toBe(14);
  });

  test('GL-011: Get card value handles null/undefined', () => {
    expect(getCardValue(null)).toBe(0);
    expect(getCardValue(undefined)).toBe(0);
    expect(getCardValue({})).toBe(0);
  });

  test('GL-012: Get card value with invalid label returns 0', () => {
    expect(getCardValue({ label: 'Invalid' })).toBe(0);
    expect(getCardValue({ label: '' })).toBe(0);
  });

  test('GL-012b: Get card value with value property', () => {
    expect(getCardValue({ value: 14, label: 'Ace' })).toBe(14);
    expect(getCardValue({ value: 7 })).toBe(7);
  });
});

describe('GameLogic - Trick Winner Logic', () => {
  
  test('GL-013: Trump card beats non-trump', () => {
    const trumpSuit = 'Hearts';
    const leadSuit = 'Clubs';
    const winnerIndex = determineTrickWinner(trumpWinsTrick, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(2); // Hearts 2 (trump) beats all clubs
  });

  test('GL-014: Higher trump beats lower trump', () => {
    const trumpSuit = 'Hearts';
    const leadSuit = 'Hearts';
    const winnerIndex = determineTrickWinner(highTrumpWinsTrick, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(2); // King of Hearts (value 13) is highest
  });

  test('GL-015: Higher lead suit card wins (no trumps played)', () => {
    const trumpSuit = 'Diamonds';
    const leadSuit = 'Hearts';
    const winnerIndex = determineTrickWinner(simpleTrick, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(2); // Hearts 9 is highest
  });

  test('GL-016: Trump beats higher lead suit card', () => {
    const trumpSuit = 'Hearts';
    const leadSuit = 'Clubs';
    // Clubs: Ace, King, Hearts 2 (trump), Queen
    const winnerIndex = determineTrickWinner(trumpWinsTrick, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(2); // Even low trump beats high clubs
  });

  test('GL-017: Off-suit card cannot win', () => {
    const trumpSuit = 'Hearts';
    const leadSuit = 'Clubs';
    const winnerIndex = determineTrickWinner(offSuitDoesNotWin, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(2); // Clubs 7 wins (highest of lead suit)
  });

  test('GL-018: First card wins if all equal value', () => {
    const trick = [
      { suit: 'Hearts', label: '5', value: 5 },
      { suit: 'Clubs', label: '5', value: 5 },
      { suit: 'Diamonds', label: '5', value: 5 },
      { suit: 'Spades', label: '5', value: 5 }
    ];
    const trumpSuit = 'Spades';
    const leadSuit = 'Hearts';
    const winnerIndex = determineTrickWinner(trick, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(3); // Last card is trump (Spades)
  });

  test('GL-019: Empty trick returns null', () => {
    const winnerIndex = determineTrickWinner([], 'Hearts', 'Clubs');
    expect(winnerIndex).toBeNull();
  });

  test('GL-020: Single card trick returns 0', () => {
    const trick = [{ suit: 'Hearts', label: 'Ace', value: 14 }];
    const winnerIndex = determineTrickWinner(trick, 'Spades', 'Hearts');
    expect(winnerIndex).toBe(0);
  });

  test('GL-021: All trump cards - highest wins', () => {
    const trumpSuit = 'Hearts';
    const leadSuit = 'Hearts';
    const winnerIndex = determineTrickWinner(highTrumpWinsTrick, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(2); // King (13) is highest
  });

  test('GL-022: Mixed suits - only lead/trump can win', () => {
    const trumpSuit = 'Hearts';
    const leadSuit = 'Diamonds';
    const winnerIndex = determineTrickWinner(mixedSuitTrick, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(3); // King of Diamonds (lead suit)
  });

  test('GL-023: All same suit - highest value wins', () => {
    const trumpSuit = 'Hearts';
    const leadSuit = 'Spades';
    const winnerIndex = determineTrickWinner(allSameSuit, trumpSuit, leadSuit);
    expect(winnerIndex).toBe(2); // Ace (14) is highest
  });
});

describe('GameLogic - Player Navigation', () => {
  
  test('GL-024: Next player clockwise (0→1→2→3→0)', () => {
    expect(getNextPlayer(0, 'clockwise')).toBe(1);
    expect(getNextPlayer(1, 'clockwise')).toBe(2);
    expect(getNextPlayer(2, 'clockwise')).toBe(3);
    expect(getNextPlayer(3, 'clockwise')).toBe(0);
  });

  test('GL-025: Next player anticlockwise (0→3→2→1→0)', () => {
    expect(getNextPlayer(0, 'anticlockwise')).toBe(3);
    expect(getNextPlayer(3, 'anticlockwise')).toBe(2);
    expect(getNextPlayer(2, 'anticlockwise')).toBe(1);
    expect(getNextPlayer(1, 'anticlockwise')).toBe(0);
  });

  test('GL-026: Get first bidder (right of dealer)', () => {
    expect(getFirstBidder(0)).toBe(3); // Right of player 0
    expect(getFirstBidder(1)).toBe(0); // Right of player 1
    expect(getFirstBidder(2)).toBe(1); // Right of player 2
    expect(getFirstBidder(3)).toBe(2); // Right of player 3
  });

  test('GL-027: First bidder wraps around (dealer=3, first=2)', () => {
    const firstBidder = getFirstBidder(3);
    expect(firstBidder).toBe(2);
  });
});

describe('GameLogic - Hand Sorting', () => {
  
  test('GL-028: Sort hand by suit order', () => {
    const hand = [
      { suit: 'Hearts', label: '5', value: 5 },
      { suit: 'Clubs', label: '3', value: 3 },
      { suit: 'Spades', label: '7', value: 7 },
      { suit: 'Diamonds', label: '2', value: 2 }
    ];
    
    const sorted = sortHand([...hand]);
    expect(sorted[0].suit).toBe('Spades');
    expect(sorted[1].suit).toBe('Hearts');
    expect(sorted[2].suit).toBe('Clubs');
    expect(sorted[3].suit).toBe('Diamonds');
  });

  test('GL-029: Sort hand by value within suit', () => {
    const hand = [
      { suit: 'Hearts', label: 'King', value: 13 },
      { suit: 'Hearts', label: '5', value: 5 },
      { suit: 'Hearts', label: 'Ace', value: 14 },
      { suit: 'Hearts', label: '2', value: 2 }
    ];
    
    const sorted = sortHand([...hand]);
    expect(sorted[0].label).toBe('2');
    expect(sorted[1].label).toBe('5');
    expect(sorted[2].label).toBe('King');
    expect(sorted[3].label).toBe('Ace');
  });

  test('GL-030: Sort mixed hand correctly', () => {
    const hand = [
      { suit: 'Diamonds', label: 'King', value: 13 },
      { suit: 'Spades', label: '2', value: 2 },
      { suit: 'Hearts', label: 'Ace', value: 14 },
      { suit: 'Clubs', label: '5', value: 5 }
    ];
    
    const sorted = sortHand([...hand]);
    // Should be: Spades 2, Hearts Ace, Clubs 5, Diamonds King
    expect(sorted[0]).toMatchObject({ suit: 'Spades', label: '2' });
    expect(sorted[1]).toMatchObject({ suit: 'Hearts', label: 'Ace' });
    expect(sorted[2]).toMatchObject({ suit: 'Clubs', label: '5' });
    expect(sorted[3]).toMatchObject({ suit: 'Diamonds', label: 'King' });
  });
});

describe('GameLogic - Score Management', () => {
  
  test('GL-031: Update scores increments winner', () => {
    const scores = [0, 0, 0, 0];
    const updated = updateScores(scores, 2);
    expect(updated).toEqual([0, 0, 1, 0]);
  });

  test('GL-032: Update scores preserves other scores', () => {
    const scores = [3, 5, 2, 4];
    const updated = updateScores(scores, 1);
    expect(updated).toEqual([3, 6, 2, 4]);
  });

  test('GL-033: Initialize players creates correct structure', () => {
    const hands = [[], [], [], []];
    const players = initializePlayers(hands);
    
    expect(players).toHaveLength(4);
    expect(players[0]).toMatchObject({
      id: 0,
      name: 'Player 1',
      hand: [],
      score: 0,
      hasPassed: false
    });
  });
});
