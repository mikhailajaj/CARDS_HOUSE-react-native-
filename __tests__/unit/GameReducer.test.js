/**
 * Unit Tests for Game Reducer (utils/state/GameReducer.js)
 * Tests: GR-001 to GR-046
 * Target Coverage: 100% statement, 95% branch
 */

import { 
  gameReducer, 
  initialGameState, 
  GAME_PHASES, 
  GAME_ACTIONS 
} from '../../utils/state/GameReducer';

describe('GameReducer - State Initialization', () => {
  
  test('GR-001: Initial state has correct phase (DEALING)', () => {
    expect(initialGameState.phase).toBe(GAME_PHASES.DEALING);
  });

  test('GR-002: Initial state has 4 players', () => {
    expect(initialGameState.players).toHaveLength(4);
  });

  test('GR-003: Player 3 (index 2) is human', () => {
    expect(initialGameState.players[0].isHuman).toBe(false);
    expect(initialGameState.players[1].isHuman).toBe(false);
    expect(initialGameState.players[2].isHuman).toBe(true);
    expect(initialGameState.players[3].isHuman).toBe(false);
  });

  test('GR-004: Initial bidding state is valid', () => {
    expect(initialGameState.bidding.highestBid).toBe(6);
    expect(initialGameState.bidding.passCount).toBe(0);
    expect(initialGameState.bidding.playersStillBidding).toEqual([0, 1, 2, 3]);
  });

  test('GR-005: Teams are correctly assigned', () => {
    expect(initialGameState.teams.team1.players).toEqual([0, 2]);
    expect(initialGameState.teams.team2.players).toEqual([1, 3]);
  });
});

describe('GameReducer - START_GAME Action', () => {
  
  test('GR-006: START_GAME resets to initial state', () => {
    const modifiedState = {
      ...initialGameState,
      phase: GAME_PHASES.PLAYING,
      round: 5
    };
    
    const newState = gameReducer(modifiedState, { type: GAME_ACTIONS.START_GAME });
    
    expect(newState.phase).toBe(GAME_PHASES.DEALING);
    expect(newState.round).toBe(1);
  });

  test('GR-007: START_GAME resets player hands', () => {
    const state = gameReducer(initialGameState, { type: GAME_ACTIONS.START_GAME });
    
    state.players.forEach(player => {
      expect(player.hand).toEqual([]);
    });
  });
});

describe('GameReducer - CARDS_DEALT Action', () => {
  
  test('GR-008: CARDS_DEALT assigns hands to players', () => {
    const hands = [
      [{ suit: 'Hearts', label: 'Ace', value: 14 }],
      [{ suit: 'Clubs', label: 'King', value: 13 }],
      [{ suit: 'Diamonds', label: 'Queen', value: 12 }],
      [{ suit: 'Spades', label: 'Jack', value: 11 }]
    ];
    
    const state = gameReducer(initialGameState, {
      type: GAME_ACTIONS.CARDS_DEALT,
      payload: { hands }
    });
    
    expect(state.players[0].hand).toEqual(hands[0]);
    expect(state.players[1].hand).toEqual(hands[1]);
  });

  test('GR-009: CARDS_DEALT transitions to BIDDING', () => {
    const hands = [[], [], [], []];
    const state = gameReducer(initialGameState, {
      type: GAME_ACTIONS.CARDS_DEALT,
      payload: { hands }
    });
    
    expect(state.phase).toBe(GAME_PHASES.BIDDING);
  });
});

describe('GameReducer - PLACE_BID Action', () => {
  
  test('GR-010: Valid bid updates highest bid', () => {
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.BIDDING,
      bidding: {
        ...initialGameState.bidding,
        currentBidder: 0,
        highestBid: 6
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: 0, amount: 8 }
    });
    
    expect(newState.bidding.highestBid).toBe(8);
    expect(newState.bidding.highestBidder).toBe(0);
  });

  test('GR-011: Invalid bid (too low) is rejected', () => {
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.BIDDING,
      bidding: {
        ...initialGameState.bidding,
        currentBidder: 0,
        highestBid: 10
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: 0, amount: 8 }
    });
    
    // State should not change
    expect(newState.bidding.highestBid).toBe(10);
  });

  test('GR-012: Pass bid increments pass count', () => {
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.BIDDING,
      bidding: {
        ...initialGameState.bidding,
        currentBidder: 0,
        passCount: 0
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: 0, amount: 0 }
    });
    
    expect(newState.bidding.passCount).toBe(1);
  });

  test('GR-013: Minimum bid is 7', () => {
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.BIDDING
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: 0, amount: 7 }
    });
    
    expect(newState.bidding.highestBid).toBe(7);
  });
});

describe('GameReducer - SELECT_TRUMP Action', () => {
  
  test('GR-014: Trump selection sets contract', () => {
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.BIDDING,
      bidding: {
        ...initialGameState.bidding,
        highestBidder: 1,
        highestBid: 9
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.SELECT_TRUMP,
      payload: { trumpSuit: 'Hearts' }
    });
    
    expect(newState.contract.trumpSuit).toBe('Hearts');
    expect(newState.contract.amount).toBe(9);
    expect(newState.contract.declarer).toBe(1);
  });

  test('GR-015: Trump selection transitions to PLAYING', () => {
    const state = {
      ...initialGameState,
      bidding: {
        ...initialGameState.bidding,
        highestBidder: 0,
        highestBid: 8
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.SELECT_TRUMP,
      payload: { trumpSuit: 'Spades' }
    });
    
    expect(newState.phase).toBe(GAME_PHASES.PLAYING);
  });

  test('GR-016: Trump selection sets correct declarer team', () => {
    const state = {
      ...initialGameState,
      bidding: {
        ...initialGameState.bidding,
        highestBidder: 0, // Team 1
        highestBid: 8
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.SELECT_TRUMP,
      payload: { trumpSuit: 'Clubs' }
    });
    
    expect(newState.contract.declarerTeam).toBe('team1');
  });
});

describe('GameReducer - PLAY_CARD Action', () => {
  
  test('GR-017a: PLAY_CARD keeps card in hand for animation', () => {
    const card = { suit: 'Hearts', label: 'Ace', value: 14 };
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.PLAYING,
      players: [
        { ...initialGameState.players[0], hand: [card] },
        ...initialGameState.players.slice(1)
      ],
      playing: {
        ...initialGameState.playing,
        currentPlayer: 0,
        currentTrick: []
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.PLAY_CARD,
      payload: { playerIndex: 0, card }
    });
    
    // Card should remain in hand during animation
    expect(newState.players[0].hand).toHaveLength(1);
    expect(newState.players[0].hand[0]).toEqual(card);
  });

  test('GR-017b: ADD_CARD_TO_TRICK_AREA removes card from hand', () => {
    const card = { suit: 'Hearts', label: 'Ace', value: 14 };
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.PLAYING,
      players: [
        { ...initialGameState.players[0], hand: [card] },
        ...initialGameState.players.slice(1)
      ],
      playing: {
        ...initialGameState.playing,
        currentPlayer: 0,
        currentTrick: []
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.ADD_CARD_TO_TRICK_AREA,
      payload: { playerIndex: 0, card }
    });
    
    // Card should be removed after animation completes
    expect(newState.players[0].hand).toHaveLength(0);
  });

  test('GR-018: First card sets lead suit', () => {
    const card = { suit: 'Hearts', label: 'Ace', value: 14 };
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.PLAYING,
      players: [
        { ...initialGameState.players[0], hand: [card] },
        ...initialGameState.players.slice(1)
      ],
      playing: {
        ...initialGameState.playing,
        currentPlayer: 0,
        currentTrick: [],
        leadSuit: null
      }
    };
    
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.PLAY_CARD,
      payload: { playerIndex: 0, card }
    });
    
    expect(newState.playing.leadSuit).toBe('Hearts');
  });
});

// Add more test suites as needed
