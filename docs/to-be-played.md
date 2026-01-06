# To-Be-Played Card Selection

This document explains the "to-be-played" feature for the human player's hand: how it works, why it exists, and how to maintain or extend it.

## Goals

- Give the human player clear visual feedback that a card has been chosen to play next.
- Allow preselecting a card before the player's turn arrives.
- Automatically commit the selected card when it's the player's turn and the play is legal.
- Avoid race conditions and state desynchronization when input or timers overlap.

## UX Behavior

- Tap any card in the human hand during the PLAYING phase to preselect it.
- The selected card visibly shifts upward and scales slightly ("about to be played").
- Only one card can be selected at a time:
  - Tapping a different card switches selection (previous card returns to normal).
  - Tapping the same selected card deselects it and returns it to place.
- When the human's turn arrives, if the selected card is legal to play, it is auto-played; otherwise the selection remains until the player changes it or the state makes it legal.

## How It Works

### State (screens/GameScreen.js)

- `selectedCard: { suit, label, value } | null`
  - Tracks the human's preselected card.
  - Set by tapping a card in the human hand.
  - Cleared after a successful dispatch of `PLAY_CARD`.

### Selection Flow

- `handleCardPress(card, playerIndex)` in `GameScreen`:
  - Guards: only during PLAYING; ignores while settling or when 4 cards are on the table; only human taps.
  - Toggle logic:
    - If tapped card equals `selectedCard` => deselect.
    - Else => set `selectedCard = card`.
  - No immediate dispatch here; the card remains visually lifted waiting to be played.

- Auto-commit effect (in `GameScreen`):
  - `useEffect` watches: `phase`, `playing.currentPlayer`, `playing.settling`, `playing.currentTrick.length`, and `selectedCard`.
  - When it's the human's turn, not settling, fewer than 4 cards on the table, and a `selectedCard` exists:
    - Validate legality using `isLegalPlay`.
    - If legal, show a small toast/message, dispatch `PLAY_CARD`, and clear `selectedCard`.

### Visuals & Animation

- `components/Card.js`
  - New prop: `isSelected` (boolean).
  - Persistent selection animation via `useEffect`:
    - When selected: `translateY = -18`, `scale = 1.06`.
    - When unselected: `translateY = 0`, `scale = 1.0`.
  - Press feedback (`onPressIn`/`onPressOut`) animates relative to the current baseline so the card does not snap down after a tap when selected.

- `components/Hand.js`
  - New prop: `selectedCard`.
  - Passes `isSelected={selectedCard matches this card}` to `Card`.

- `components/Player.js`
  - Plumbs `selectedCard` down to `Hand`.

### Guards & Reducer Safety

- `utils/state/GameReducer.js` – `PLAY_CARD` guards prevent double plays and illegal state transitions:
  - Must be PLAYING phase; not settling; table not full; correct player's turn.
  - Ensures the player actually still holds the card.
  - Enforces follow-suit rule when applicable.

- `GameScreen` handlers (`handlePlayerTimeUp`, AI move effect) also check phase, turn, table-full, and settling before dispatching.

### Files Touched

- `components/Card.js` – selection baseline and relative press animation.
- `components/Hand.js` – `selectedCard` passthrough; set `isSelected` on `Card`.
- `components/Player.js` – added `selectedCard` prop to `Hand`.
- `screens/GameScreen.js` – `selectedCard` state; selection toggle in `handleCardPress`; auto-commit effect.

## Why

- Preselection adds confidence and speed. Players can prepare their move before their turn starts and get clear visual feedback.
- Auto-commit on turn arrival avoids extra taps and keeps gameplay fluid.
- The visual lift makes it obvious which card is queued.

## Maintenance Notes

- Lift/scale amounts are defined in `Card.js` (`baseY`, `baseScale`). Adjust to taste.
- If you want a confirm action instead of auto-commit:
  1. Remove or gate the auto-commit `useEffect` in `GameScreen`.
  2. Add a small "Play" chip near the selected card when it's the human's turn, and dispatch `PLAY_CARD` on press.
- To block selection of illegal cards during the human's turn:
  - In `handleCardPress`, add a legality check when it's the human's turn and ignore selections that are illegal (we currently allow selection and rely on auto-commit legality).
- Selection resets:
  - On successful `PLAY_CARD`, selection is cleared.
  - On round reset (`START_NEW_ROUND`), selection naturally disappears as hands reset.

## Future Improvements

- Unique Card IDs:
  - Add a stable `id` to each card in the deck (`utils/gameLogic.createDeck`) and use it for both removal and React keys (in `Hand`). This avoids any possibility of ambiguous suit/label lookups and React key reuse.

- Timer Integration:
  - Consider pausing the human timer during `settling` and resuming after. Wire `isSettling` through `PlayerCircles -> PlayerCircle` and call `stopTimer()` when true.

- Confirm vs Auto-Commit Modes:
  - Make this configurable in a settings panel. Some players prefer confirming every play.

- Accessibility:
  - Provide a clear a11y hint when a card becomes selected (e.g., "Selected. Will play on your turn.").

## Testing Checklist

- Preselect a card when it is NOT your turn → card lifts; remains lifted until your turn.
- When your turn arrives with a legal selected card → card plays automatically; selection clears.
- Select a different card → previous card returns; new one lifts.
- Deselect by tapping the selected card again → card returns; nothing is played on turn arrival.
- During settle (after 4th card) → selection should not cause plays; ensure no dispatch occurs.
- Edge cases: lead suit constraints, no cards that can follow, playing on the last trick.

## Related Docs

- `docs/UI_NOTES.md` – player info circles and trick/bid display behavior.
- `docs/GAME_FLOW.md` – game phases overview.

