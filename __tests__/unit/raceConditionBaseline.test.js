/**
 * Baseline test for Race Condition #1: Card Disappearing Bug
 * Goal: Demonstrate current buggy behavior where the card is removed from the player's hand
 * immediately upon PLAY_CARD, instead of remaining visible during the 500ms animation period.
 *
 * NOTE: This test is expected to FAIL currently, serving as a baseline regression test.
 */

import {
  gameReducer,
  initialGameState,
  GAME_PHASES,
  GAME_ACTIONS,
} from '../../utils/state/GameReducer';
import { sampleCard as card } from '../fixtures/sampleHands';

describe('Race Condition #1: Card Disappearing Bug (Baseline)', () => {
  it('keeps card in hand during animation period (expected behavior) - BASELINE FAIL', () => {
    // Given: Game is in PLAYING phase and it's player 0's turn with a known card in hand
    const state = {
      ...initialGameState,
      phase: GAME_PHASES.PLAYING,
      players: [
        { ...initialGameState.players[0], hand: [card] },
        { ...initialGameState.players[1], hand: [] },
        { ...initialGameState.players[2], hand: [] },
        { ...initialGameState.players[3], hand: [] },
      ],
      playing: {
        ...initialGameState.playing,
        currentPlayer: 0,
        currentTrick: [],
        leadSuit: null,
      },
      animations: {
        ...initialGameState.animations,
        trickAreaCards: [],
      },
    };

    // When: Player 0 plays the card
    const newState = gameReducer(state, {
      type: GAME_ACTIONS.PLAY_CARD,
      payload: { playerIndex: 0, card },
    });

    // Then (expected behavior): During the 500ms animation window, the card should still be visible.
    // Baseline expectation: The card remains in the player's hand until animation completes
    // and only then moves to the trick area (or is removed from hand).
    //
    // Current buggy behavior removes the card immediately, so this assertion should FAIL now,
    // providing a baseline test to prevent regression once fixed.
    expect(newState.players[0].hand).toContainEqual(card);
  });
});
