# Fix for Maximum Update Depth Warning in Bidding and Playing Phases

This document describes the root causes, fixes applied, and tips for further debugging for the React Native warning:

> Warning: Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render.

## Symptoms
- Warning appears when bidding modal opens and the AI or completion logic triggers continuously.
- UI may appear to freeze or flicker due to constant re-renders.

## Root Causes
- Effects relying on props or objects that change identity on each render (e.g., arrays or objects) causing the effect to run and set state on every render.
- Effects missing proper guards, e.g., running when not visible or when already complete.
- Timers created on each render without cleanup.

## Fixes Applied

1. Strong guards and stable dependencies in `Bidding.js` effects:
   - Bidding completion effect now depends on `visible`, `playersStillBidding?.length`, `highestBidder`, `biddingComplete` and exits early when not applicable.
   - AI auto-bid effect exits unless modal is visible, bidding not complete, `currentBidder` is defined and not human.
   - AI trump selection effect exits unless bidding is complete, declarer is AI, and trump not yet set.

2. Clockwise turn order standardization and first-bidder calculation clarified in `utils/gameLogic.js`.

3. Gameplay AI effect in `screens/GameScreen.js` already protected with `aiMovePending` and phase + player checks; retain if adding more logic.

## Additional Best Practices
- Avoid putting whole objects/arrays in dependency arrays when a stable scalar works (e.g., use `.length` or an `id`).
- Memoize derived values with `useMemo` if passed around and used in effects.
- Always clear timers in the cleanup function of `useEffect`.
- Keep modal-specific effects gated by `visible` flag to prevent running while hidden.

## Where to Add More Logs
- Before triggering `onBiddingComplete()` in `Bidding.js`.
- When AI places a bid or passes.
- When AI selects trump.
- Reducer: when determining next bidder, highest bidder updates, trick completion.

## If Warning Persists
- Temporarily add logs to print dependencies for the effects that trigger frequently (e.g., `console.log('deps', visible, playersStillBidding?.length, highestBidder, biddingComplete)`)
- Confirm that parent state updates don’t recreate arrays on each render in a way that pings the child effect repeatedly.
- Consider moving completion detection into the reducer to be purely state-driven and emitted once.
