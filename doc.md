│ Here’s a concrete, step-by-step implementation plan that ties Tarneeb’s      │
│ rules to your current codebase. For each task, I explain what to do, why     │
│ it’s needed, and exactly where to implement it.                              │
│                                                                              │
│ Goals to reach                                                               │
│                                                                              │
│  • Enforce must-follow-suit for human and AI.                                │
│  • Use trump (tarneeb) to decide trick winners.                              │
│  • Show a small HUD with trump, highest bid, trick counts, and whose turn it │
│    is.                                                                       │
│  • Complete trick scoring per team; after 4 cards, pause 1s, clear table,    │
│    winner leads next trick.                                                  │
│  • Build a proper bidding round (highest bidder, trump selection, lead).     │
│                                                                              │
│ Current state sanity-check                                                   │
│                                                                              │
│  • GameScreen:                                                               │
│     • Has currentTrick, leadSuit, isResolvingTrick; resolveTrick() exists    │
│       and clears the table after 1s and sets the next leader.                │
│     • AI auto-plays one move per tick via triggerAIMoves(). Starts at Player │
│       3 by default.                                                          │
│     • trumpSuit and highestBid are recorded from BiddingPopup, but a full    │
│       bidding phase is not implemented yet.                                  │
│  • gameLogic:                                                                │
│     • playCard enforces turn and removes cards immutably; exposes setTurnTo  │
│       to assign leader.                                                      │
│  • AiLogic:                                                                  │
│     • chooseCardToPlay exists; added a better opening strategy (AK > KQ >    │
│       lowest from longest suit).                                             │
│  • UI:                                                                       │
│     • Side hands are vertical, rotated ±90°; table center is responsive.     │
│                                                                              │
│  1 Must-follow-suit enforcement Why: Tarneeb requires players to follow the  │
│    lead suit if possible.                                                    │
│                                                                              │
│ What to do:                                                                  │
│                                                                              │
│  • Human plays:                                                              │
│     • Compute allowed cards when a trick has a leadSuit.                     │
│     • If the human has at least one card of leadSuit, other suits should be  │
│       disabled and not selectable.                                           │
│  • AI plays:                                                                 │
│     • When calling AiLogic, only pass legal cards (leadSuit if available;    │
│       otherwise any card).                                                   │
│                                                                              │
│ Where to implement:                                                          │
│                                                                              │
│  • File: screens/GameScreen.js                                               │
│     • Add a helper:                                                          │
│        • function legalCardsFor(player, leadSuit) { ... } that returns       │
│          player.hand filtered by leadSuit if player has any; otherwise full  │
│          hand.                                                               │
│     • In handleCardPress:                                                    │
│        • Before playCard, verify the card is legal if leadSuit != null. If   │
│          not legal, ignore the tap or show feedback.                         │
│     • Pass disabled info to Hand:                                            │
│        • Add a canPlayCard predicate: canPlayCard = (c) =>                   │
│          legalCardsFor(currentPlayer, leadSuit).includes(c by suit+label)    │
│        • Update Hand/Card to accept a disabled flag, e.g., Card disabled     │
│          style and ignore onPress if disabled is true.                       │
│  • File: components/Hand.js and components/Card.js                           │
│     • Card: support a disabled prop that lowers opacity and prevents         │
│       onPress.                                                               │
│     • Hand: compute disabled per card using a function passed down, e.g.,    │
│       canPlayCard; default to true if it’s not the player’s turn.            │
│  • File: screens/GameScreen.js (AI)                                          │
│     • In triggerAIMoves:                                                     │
│        • Derive legal = legalCardsFor(current, leadSuitLocal).               │
│        • Call chooseCardToPlay using a version that respects the legal       │
│          subset. Two options:                                                │
│           • Option A (quick): temporarily set aiPlayer.cardList = legal      │
│             before calling chooseCardToPlay.                                 │
│           • Option B (clean): modify AiLogic to accept a legalCards param.   │
│             For speed, use Option A now.                                     │
│                                                                              │
│  2 Trump integration in trick winner calculation Why: With a trump suit,     │
│    highest trump wins; otherwise highest of lead suit.                       │
│                                                                              │
│ What to do:                                                                  │
│                                                                              │
│  • Pass trumpSuit (state) to resolveTrick.                                   │
│  • determineTrickWinner(cardsPlayed, trumpSuit, leadSuit) will give the      │
│    index in the current trick.                                               │
│                                                                              │
│ Where to implement:                                                          │
│                                                                              │
│  • File: screens/GameScreen.js                                               │
│     • In resolveTrick(trick):                                                │
│        • Replace local trumpSuit = null with the actual trumpSuit from       │
│          state.                                                              │
│        • Keep the winnerIndex logic unchanged; it will respect trump.        │
│                                                                              │
│  3 Team trick counting and a minimal HUD Why: You need per-trick tracking    │
│    and user feedback. HUD helps with game clarity.                           │
│                                                                              │
│ What to do:                                                                  │
│                                                                              │
│  • Track teamTricks during the round:                                        │
│     • team1 = players 1 & 3 (indices 0,2); team2 = players 2 & 4 (indices    │
│       1,3).                                                                  │
│  • Display a small HUD:                                                      │
│     • Current trump suit (with symbol or text).                              │
│     • Highest bid and (temporary) bidder.                                    │
│     • Trick counts team1 vs team2.                                           │
│     • Current turn indicator (e.g., “Player 3 to lead/play”).                │
│                                                                              │
│ Where to implement:                                                          │
│                                                                              │
│  • File: screens/GameScreen.js                                               │
│     • Increment teamTricks in resolveTrick after computing winnerIndex:      │
│        • if winnerIndex is 0 or 2: setTeamTricks(t => ({...t, team1:         │
│          t.team1+1})) else team2++.                                          │
│     • Add a small HUD at the top (e.g., a View absolute at top with Text):   │
│        • Show trumpSuit (e.g., use unicode symbols for ♠ ♥ ♦ ♣ or text),     │
│          highestBid, trick counts, current player name.                      │
│  • Optional:                                                                 │
│     • When the round ends (13 tricks), compute round score with bids (see    │
│       Step 5).                                                               │
│                                                                              │
│  4 Rotate table cards based on who played (immersive) Why: Easier to read    │
│    which side played each card; improves spatial mapping.                    │
│                                                                              │
│ What to do:                                                                  │
│                                                                              │
│  • When rendering table cards for each playedCards['Player X'], apply        │
│    rotation:                                                                 │
│     • Player 2 (left): -90deg                                                │
│     • Player 4 (right): +90deg                                               │
│     • Player 1 (top) and Player 3 (bottom): 0deg                             │
│                                                                              │
│ Where to implement:                                                          │
│                                                                              │
│  • File: screens/GameScreen.js                                               │
│     • In the four center play areas, pass rotationDegrees to Card based on   │
│       playedBy name.                                                         │
│                                                                              │
│  5 Complete bidding engine and round scoring to 41 Why: To fully match       │
│    Tarneeb rules.                                                            │
│                                                                              │
│ What to do (phase 1: basic bidding):                                         │
│                                                                              │
│  • A simple bidding round before play:                                       │
│     • Iterate anticlockwise from dealer’s right; collect one bid per player: │
│       number (7–13) or Pass.                                                 │
│     • Track highestBid and highestBidderIndex.                               │
│     • After bidding ends, set trumpSuit (from highest bidder’s choice) and   │
│       set leader to highestBidderIndex.                                      │
│     • Set a declarerTeam ('team1' or 'team2') based on the highest bidder’s  │
│       team.                                                                  │
│                                                                              │
│ What to do (phase 2: end-of-round scoring):                                  │
│                                                                              │
│  • When 13 tricks have concluded (sum of teamTricks.team1 + teamTricks.team2 │
│    === 13):                                                                  │
│     • If declarerTeam’s tricks >= highestBid:                                │
│        • add tricks to that team’s game score                                │
│     • Else:                                                                  │
│        • subtract highestBid from that team’s score                          │
│     • If any team hits 41: end game; else start a new round:                 │
│        • Reset teamTricks, currentTrick, leadSuit, cornerCards, playedCards. │
│        • Shuffle, deal again; run bidding; set leader accordingly.           │
│                                                                              │
│ Where to implement:                                                          │
│                                                                              │
│  • File: screens/GameScreen.js                                               │
│     • Add bidding flow: after Deal Cards, show a sequence of bids per player │
│       (AI can auto-pick a bid stub for now).                                 │
│     • After bidding, set highestBid, trumpSuit, highestBidderIndex,          │
│       declarerTeam, and setTurnTo(highestBidderIndex).                       │
│     • At trick end, if teamTricks sum === 13, compute round score and update │
│       teamScores (via setTeamScores from useGameLogic), then re-deal and     │
│       restart bidding.                                                       │
│                                                                              │
│  6 Must-follow-suit visualization and disabled state Why: UX clarity for     │
│    legal plays.                                                              │
│                                                                              │
│ What to do:                                                                  │
│                                                                              │
│  • Dim or gray out non-legal cards in the human player’s hand when leadSuit  │
│    is present and the player has cards in that suit.                         │
│  • Prevent onPress for disabled cards.                                       │
│                                                                              │
│ Where to implement:                                                          │
│                                                                              │
│  • File: components/Card.js                                                  │
│     • Accept a disabled prop; if true, apply opacity: 0.4 and onPress no-op. │
│  • File: components/Hand.js                                                  │
│     • Accept canPlayCard and isDisabled to compute per-card disabled.        │
│                                                                              │
│  7 Stabilize effects and cleanup Why: Avoid runaway AI loops and race        │
│    conditions.                                                               │
│                                                                              │
│ What to do:                                                                  │
│                                                                              │
│  • Ensure triggerAIMoves only runs one move per effect tick and respects:    │
│     • isResolvingTrick                                                       │
│     • currentTrick.length < 4                                                │
│     • current player is AI                                                   │
│  • Reset playedCards in resolveTrick (done), so center displays clear.       │
│                                                                              │
│ Where to implement:                                                          │
│                                                                              │
│  • File: screens/GameScreen.js                                               │
│     • Already mostly in place; re-check useEffect dependencies to avoid      │
│       redundant triggers (e.g., consider memoizing some derived state or     │
│       using guards to prevent repeated calls in the same tick).              │
│                                                                              │
│  8 AI improvements for partner signaling and trump Why: To reflect your      │
│    desired strategy and Tarneeb nuance.                                      │
│                                                                              │
│ What to do:                                                                  │
│                                                                              │
│  • On lead:                                                                  │
│     • Already adapted with AK/KQ preference; optionally avoid leading trump  │
│       unless strategy dictates (e.g., when very strong in trump).            │
│  • On partner’s previous signal:                                             │
│     • Track partner last play per trick; if partner played very low in a     │
│       suit previously, infer they might be short and adjust play (this is    │
│       more advanced; we can stub placeholders now).                          │
│                                                                              │
│ Where to implement:                                                          │
│                                                                              │
│  • File: utils/AiLogic.js                                                    │
│     • Extend chooseLeadCard and playCardAiSecond/Third/Fourth to optionally  │
│       accept context:                                                        │
│        • playedCards in currentTrick with who played what, plus trump.       │
│     • For now, keep simple and correct before adding deeper heuristics.      │
│                                                                              │
│   9 Testing and edge cases Why: Validate the flow works for normal and edge  │
│     situations.                                                              │
│                                                                              │
│ Checklist:                                                                   │
│                                                                              │
│  • Single trick from empty -> four plays -> resolve -> next leader.          │
│  • Must-follow-suit enforced for human: try illegal play and verify it is    │
│    blocked.                                                                  │
│  • AI doesn’t play when human’s turn; human cannot play when not their turn. │
│  • Bidding: Highest bidder leads; trump is used in resolveTrick.             │
│  • Round end: After 13 tricks, compute score properly, start next round.     │
│                                                                              │
│ Where to capture tests:                                                      │
│                                                                              │
│  • Manual testing in the app with console logs for now.                      │
│  • Optional: Add quick debug buttons (e.g., “Force resolve trick,” “Toggle   │
│    trump”) in development mode.                                              │
│                                                                              │
│ Deliverables order (recommended)                                             │
│                                                                              │
│  • Must-follow-suit enforcement (human + AI) and HUD                         │
│    (trump/bid/tricks/turn).                                                  │
│  • Trump in resolveTrick (use selected trump).                               │
│  • Team trick counting and rotate table cards by side for immersion.         │
│  • Full bidding round and integrate leader/trump from highest bidder.        │
│  • End-of-round scoring to 41 and round reset.                               │
│                                                                              │
│ If this plan looks good, I can start implementing from the top               │
│ (must-follow-suit + HUD), then move through trump integration and trick      │
│ counters. Do you want me to proceed with that order, or adjust the           │
│ priorities?                                                                  │
╰──────────────────────────────────────────────────────────────────────────────╯