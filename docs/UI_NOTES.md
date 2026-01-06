# UI Notes: Player Info Boxes (Bid/Tricks)

Summary
- The small round boxes near each player now serve two purposes depending on phase:
  - Bidding phase: shows the player’s highest bid, but only for the current highest bidder (hidden for others).
  - Playing phase: shows tricks won by that player in the current round.

Behavior details
- Bidding
  - We compute the highest bid per player from `state.bidding.bids` and show it only if `state.bidding.highestBidder === playerIndex`.
  - As soon as another player overbids, the prior highest bidder’s box hides and the new top bidder’s box shows.
- Playing
  - We track per-player trick counts in `state.playerTricks` (added to reducer), increment on trick completion, and reset at `START_NEW_ROUND`.
  - Each player’s box shows their own trick count during PLAYING.

Visual styling
- During bidding (Bid mode): gold circle with a deeper gold/brown border; caption "Bid" underneath.
- During playing (Tricks mode): blue circle with a deeper blue border; caption "Tricks" underneath.
- Base size: 32x32, bold number centered.

Positioning
- Absolute placement near each player, tuned for current layout:
  - Player 1 (top): bottom: -56, horizontally centered.
  - Player 2 (left): right: -12, vertically centered.
  - Player 3 (bottom): top: -28, horizontally centered.
  - Player 4 (right): left: -12, vertically centered.
- This layout keeps the circles slightly on the table for context.

Code references
- screens/GameScreen.js
  - PlayerInfoBox: logic for when to show, what to show, and placement.
  - Styles under `playerInfoContainer`, `playerInfoBox`, `playerInfoBoxBid`, `playerInfoBoxTricks`, `playerInfoCaption`.
- utils/state/GameReducer.js
  - `playerTricks` added to state; incremented on trick completion; reset on `START_NEW_ROUND`.

Future improvements
- Make placement fully responsive by positioning relative to the TrickArea (table) bounds using onLayout and percentage insets. This was prototyped but reverted per request; can re-enable later.
- Add per-mode text colors inside the circle for higher contrast.
- Optional animation on mode switch (Bid -> Tricks) to make the transition clearer.
