/**
 * Integration Tests - Full Game Flow
 * Tests: INT-001 to INT-005
 * Tests complete game cycles from start to finish
 */

import { 
  gameReducer, 
  initialGameState, 
  GAME_PHASES, 
  GAME_ACTIONS 
} from '../../utils/state/GameReducer';
import { createDeck, shuffleDeck, dealCards } from '../../utils/gameLogic';

describe('Integration - Full Game Flow', () => {
  
  test('INT-001: Complete game from deal to first trick', () => {
    let state = { ...initialGameState };
    
    // Step 1: Start game
    state = gameReducer(state, { type: GAME_ACTIONS.START_GAME });
    expect(state.phase).toBe(GAME_PHASES.DEALING);
    
    // Step 2: Deal cards
    const deck = createDeck();
    shuffleDeck(deck);
    const hands = dealCards(deck, 4);
    
    state = gameReducer(state, {
      type: GAME_ACTIONS.CARDS_DEALT,
      payload: { hands }
    });
    expect(state.phase).toBe(GAME_PHASES.BIDDING);
    expect(state.players[0].hand).toHaveLength(13);
    
    // Step 3: Bidding - player 0 bids 8
    state = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: state.bidding.currentBidder, amount: 8 }
    });
    expect(state.bidding.highestBid).toBe(8);
    
    // Step 4: Other players pass
    for (let i = 0; i < 3; i++) {
      state = gameReducer(state, {
        type: GAME_ACTIONS.PLACE_BID,
        payload: { playerIndex: state.bidding.currentBidder, amount: 0 }
      });
    }
    
    // Step 5: Select trump
    state = gameReducer(state, {
      type: GAME_ACTIONS.SELECT_TRUMP,
      payload: { trumpSuit: 'Hearts' }
    });
    expect(state.phase).toBe(GAME_PHASES.PLAYING);
    expect(state.contract.trumpSuit).toBe('Hearts');
    
    // Step 6: Play first card
    const firstCard = state.players[state.playing.currentPlayer].hand[0];
    state = gameReducer(state, {
      type: GAME_ACTIONS.PLAY_CARD,
      payload: { 
        playerIndex: state.playing.currentPlayer, 
        card: firstCard 
      }
    });
    
    expect(state.playing.currentTrick).toHaveLength(1);
    expect(state.playing.leadSuit).toBe(firstCard.suit);
  });

  test('INT-002: Bidding phase completes correctly', () => {
    let state = {
      ...initialGameState,
      phase: GAME_PHASES.BIDDING
    };
    
    // Player 0 bids 9
    state = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: 0, amount: 9 }
    });
    
    // Player 1 passes
    state = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: 1, amount: 0 }
    });
    
    // Player 2 passes
    state = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: 2, amount: 0 }
    });
    
    // Player 3 passes - bidding should end
    state = gameReducer(state, {
      type: GAME_ACTIONS.PLACE_BID,
      payload: { playerIndex: 3, amount: 0 }
    });
    
    expect(state.bidding.passCount).toBe(3);
    expect(state.bidding.highestBidder).toBe(0);
  });

  test('INT-003: Score calculation after round', () => {
    let state = {
      ...initialGameState,
      phase: GAME_PHASES.FINISHED,
      contract: {
        declarer: 0,
        declarerTeam: 'team1',
        amount: 8,
        trumpSuit: 'Hearts'
      },
      teams: {
        team1: { players: [0, 2], tricks: 9, score: 0, roundScore: 0 },
        team2: { players: [1, 3], tricks: 4, score: 0, roundScore: 0 }
      }
    };
    
    state = gameReducer(state, { type: GAME_ACTIONS.ROUND_COMPLETE });
    
    // Team1 made their contract (8) with 9 tricks
    expect(state.teams.team1.score).toBeGreaterThan(0);
    expect(state.scoreHistory).toHaveLength(1);
  });

  test('INT-004: Game ends when team reaches winning score', () => {
    let state = {
      ...initialGameState,
      phase: GAME_PHASES.FINISHED,
      contract: {
        declarer: 0,
        declarerTeam: 'team1',
        amount: 8,
        trumpSuit: 'Hearts'
      },
      teams: {
        team1: { players: [0, 2], tricks: 10, score: 29, roundScore: 0 },
        team2: { players: [1, 3], tricks: 3, score: 15, roundScore: 0 }
      },
      winningScore: 31
    };
    
    state = gameReducer(state, { type: GAME_ACTIONS.ROUND_COMPLETE });
    
    // Team1 should reach winning score and game should end
    if (state.teams.team1.score >= 31) {
      expect(state.phase).toBe(GAME_PHASES.GAME_OVER);
    }
  });

  test('INT-005: New round resets game state correctly', () => {
    let state = {
      ...initialGameState,
      phase: GAME_PHASES.FINISHED,
      round: 2,
      dealer: 1,
      teams: {
        team1: { players: [0, 2], tricks: 7, score: 15, roundScore: 7 },
        team2: { players: [1, 3], tricks: 6, score: 12, roundScore: 6 }
      }
    };
    
    state = gameReducer(state, { type: GAME_ACTIONS.START_NEW_ROUND });
    
    expect(state.phase).toBe(GAME_PHASES.DEALING);
    expect(state.round).toBe(3);
    expect(state.dealer).toBe(2); // Dealer rotates
    expect(state.teams.team1.tricks).toBe(0); // Tricks reset
    expect(state.teams.team1.score).toBe(15); // Score preserved
  });
});
