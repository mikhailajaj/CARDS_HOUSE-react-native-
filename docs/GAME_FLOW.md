# Tarneeb Game Flow and Rules Implemented

This document outlines how the current codebase implements the Tarneeb flow you requested.

## Deal → Bid → Trump → Play → Finish → Game Over

1) Dealer and Dealing
- Dealer is tracked in reducer (`state.dealer`), rotates each round.
- Cards are created, shuffled, and dealt evenly to 4 players.

2) Bidding
- First bidder: player to the right of the dealer (one anticlockwise step).
- Order proceeds anticlockwise: right-of-dealer → next anticlockwise → next → next (dealer bids last).
- Bids: player must bid higher than current highest (min 7) or Pass.
- When a higher bid is placed, `playersStillBidding` resets so everyone can bid again.
- Bidding completes when only one player remains in `playersStillBidding` and there is a valid `highestBidder`.
- Reducer sets `contract.declarer`, `contract.amount` and moves to trump selection.

3) Trump Selection
- Highest bidder (declarer) picks the trump suit.
- Only the human declarer can press suit buttons (AI picks after a short delay automatically).
- After trump selection, phase transitions to `PLAYING`, leader/currentPlayer set to declarer.

4) Playing
- Turn order is anticlockwise; declarer leads and play proceeds right-to-left.
- Player must follow suit if possible; trick winner is determined via Tarneeb rules.
- Winner leads next trick; trick count per team updated.

5) Finish and Game Over
- Round ends after 13 tricks; scores applied:
  - Declarer team: if made contract, score equals number of tricks won; else, -contract amount.
  - Defenders: score equals tricks won.
- Game over at 31 points. Play Again resets the game.

## Edge Case
- If everyone passes initially, bidding could stall. We should define a rule: redeal/rotate dealer, restart bidding, or force dealer to take minimum contract.

## Key Files
- `utils/state/GameReducer.js`: state machine and transitions
- `utils/gameLogic.js`: turn helpers and trick winner
- `Bidding.js`: bidding modal UI and automation
- `screens/GameScreen.js`: orchestration and AI play loop
