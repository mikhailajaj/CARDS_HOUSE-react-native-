# Timing and Performance Analysis - Card Game Flow

**Date:** 2026-01-05  
**Issue:** Cards disappearing on table, timing/processing speed problems during gameplay

---

## Executive Summary

This document identifies **critical timing constraints** and **performance bottlenecks** in the card game implementation that are causing visual artifacts (cards disappearing, table state inconsistencies).

### Root Causes Identified:
1. **Race conditions** between animation completion and state updates
2. **Overlapping timeout chains** creating timing conflicts
3. **Heavy synchronous processing** during card play
4. **Complex animation coordinate calculations** on every render
5. **Multiple concurrent useEffect hooks** triggering simultaneously

---

## Game Flow Overview

### Phase Transitions
```
DEALING → BIDDING → PLAYING → FINISHED → START_NEW_ROUND → (repeat)
                                      ↓
                                 GAME_OVER
```

---

## Critical Timing Constraints

### 1. **Card Animation Flow** (500ms critical path)

**Location:** `components/AnimatingCard.js`, `screens/GameScreen.js`

**Timing Chain:**
```
Player Action/AI Decision
    ↓
triggerCardAnimation() [~0ms]
    ↓
AnimatingCard moti animation [500ms] ← CRITICAL TIMING
    ↓
onAnimationComplete callback [~0ms]
    ↓
handleAnimationComplete() [~0ms]
    ↓
PLAY_CARD dispatch [~0ms]
    ↓
ADD_CARD_TO_TRICK_AREA dispatch [~0ms]
```

**Issue:** The animation takes exactly **500ms** (hardcoded), but state updates can happen before/after unpredictably.

**Code Reference:**
```javascript
// AnimatingCard.js:39-42
transition={{
  type: 'timing',
  duration: 500,  // ← CRITICAL: Fixed 500ms animation
}}
```

### 2. **Trick Completion Settle Delay** (500ms freeze)

**Location:** `utils/state/GameReducer.js`, `screens/GameScreen.js`

**Timing Chain:**
```
4th card played
    ↓
PLAY_CARD sets settling=true [~0ms]
    ↓
UI frozen (settling flag blocks input) [500ms] ← CRITICAL TIMING
    ↓
setTimeout fires [500ms]
    ↓
ADVANCE_AFTER_TRICK dispatch
    ↓
Table clears, next trick begins
```

**Issue:** **500ms freeze** with cards visible on table can overlap with ongoing animations from the 4th card.

**Code Reference:**
```javascript
// GameScreen.js:434-437
const t = setTimeout(() => {
  dispatch({ type: GAME_ACTIONS.ADVANCE_AFTER_TRICK, payload: { winner } });
}, 500);  // ← CRITICAL: Table freeze duration
```

### 3. **AI Move Delays** (800ms per AI player)

**Location:** `screens/GameScreen.js:461-502`

**Timing Chain:**
```
AI player turn begins
    ↓
useEffect detects turn [~0ms]
    ↓
setTimeout delay [800ms] ← CRITICAL TIMING
    ↓
chooseAiCardSmart() [varies, 5-50ms typically]
    ↓
triggerCardAnimation() [starts 500ms animation]
    ↓
PLAY_CARD dispatch
```

**Issue:** AI plays at **800ms intervals**, but animation takes **500ms**. In rapid AI-vs-AI tricks, animations can overlap.

**Code Reference:**
```javascript
// GameScreen.js:461
const timer = setTimeout(() => {
  // ... AI logic
}, 800);  // ← CRITICAL: AI think time
```

### 4. **Human Player Auto-play Timeout** (configurable, default 15s)

**Location:** `screens/GameScreen.js:367-404`

**Timing:** `(settings?.playTimeout || 15) * 1000` milliseconds

**Issue:** Long timeout can cause UX confusion if player loses track of turn.

### 5. **Bidding Delays**

**AI Bidding:** 1500ms (GameScreen.js:311)
**Trump Selection:** 2000ms (GameScreen.js:330)

**Issue:** These are additive delays before gameplay starts, creating perceived lag at round start.

---

## Performance Bottlenecks

### 1. **Card Position Calculation** (HIGH FREQUENCY)

**Location:** `utils/cardAnimationHelpers.js`

**Called:** On every card play for both source and destination positions

**Complexity:**
- `getCardPositionInHand()`: O(1) but involves trigonometry for fan layout
- Fan layout calculations include:
  - Arc radius: `cardWidth * 2.2`
  - Angle distribution: `Math.min(50, N * 5)`
  - Sin/Cos calculations per card
  - Vertical offset: `Math.abs(deviation) * 8`

**Frequency:** 4 times per trick × 13 tricks × 4 players = **52 calculations per round** minimum

**Code Reference:**
```javascript
// cardAnimationHelpers.js:68-81
const midIndex = (totalCards - 1) / 2;
const deviation = cardIndex - midIndex;
const maxRotation = 15;
const rotation = (deviation / midIndex) * maxRotation;
const verticalOffset = Math.abs(deviation) * 8;
```

**Optimization Potential:** ⚠️ **MEDIUM** - Could cache per hand size, but recalc needed on card removal

---

### 2. **AI Card Selection Logic** (HEAVY COMPUTATION)

**Location:** `utils/engine/PlayEngine.js:40-161`

**Function:** `chooseAiCardSmart()`

**Complexity Analysis:**

#### Position 0 (Leading):
```javascript
// Lines 75-106
- Suit grouping: O(n) where n = hand size
- Trump analysis: O(m) where m = trump count
- Non-trump suit scoring: O(s × c) where s = suits, c = cards per suit
- Highest card search: O(n log n) sorting
```

#### Position 1-3 (Following):
```javascript
// Lines 109-157
- Legal card filtering: O(n)
- Simulation per candidate: determineTrickWinner() × legal cards
  - determineTrickWinner: O(4) = constant, but called repeatedly
- Partner winning check: O(4) = constant
- Card value comparisons: O(n log n) worst case
```

**Worst Case:** Leading with full hand (13 cards) requires:
- Grouping: 13 iterations
- Scoring 4 suits: ~13 iterations total
- Sorting: 13 log(13) ≈ 33 operations
- **Total: ~60-80 operations per AI move**

**Frequency:** 3 AI players × 13 tricks = **39 heavy computations per round**

**Code Reference:**
```javascript
// PlayEngine.js:53-62
const pickWinningMinimal = () => {
  const winning = legal.filter(card => 
    simulateWinningIfPlayed(trick, card, trumpSuit, leadSuit)  // ← HEAVY
  );
  // Multiple sorts and filters...
};
```

**Optimization Potential:** ⚠️ **HIGH** - Could precompute suit groups, cache simulations

---

### 3. **Trick Winner Determination** (FREQUENT CALLS)

**Location:** `utils/gameLogic.js:86-129`

**Function:** `determineTrickWinner()`

**Complexity:** O(4) = constant, but called in:
1. Every `simulateWinningIfPlayed()` during AI decision (up to 13 times)
2. Reducer when trick completes
3. AI logic for partner-winning checks

**Frequency Estimate:** 
- AI simulations: ~5-10 calls per AI move
- Trick completion: 1 call per trick
- **Total: ~200-400 calls per round**

**Code Reference:**
```javascript
// gameLogic.js:86-129
export function determineTrickWinner(trickCards, trumpSuit, leadSuit) {
  // Loop through 4 cards with multiple comparisons
  for (let i = 1; i < trickCards.length; i++) {
    // Value comparison: getCardValue() call
    // Suit comparison: trump vs lead suit logic
  }
}
```

**Optimization Potential:** ⚠️ **LOW** - Already efficient, but called very frequently

---

### 4. **Bidding Strategy Evaluation** (MODERATE COMPLEXITY)

**Location:** `utils/biddingStrategy.js`

**Function:** `evaluateBid()` and `pickBestTrumpByTricks()`

**Complexity:**

#### `pickBestTrumpByTricks()`:
```javascript
// Lines 94-105
for (const s of SUIT_ORDER) {  // 4 iterations
  const v = estimateTricks(hand, s);  // O(hand size) each
}
```

#### `estimateTricks()`:
```javascript
// Lines 44-92
- Hand grouping: O(n)
- Label searches: O(n) multiple times
- Suit iteration: O(4) with nested label checks
```

**Total Complexity:** O(4 × n) = O(n) where n = hand size (13)

**Frequency:** 4 players × 1-3 bids each = **4-12 calls per round** (bidding phase only)

**Optimization Potential:** ⚠️ **MEDIUM** - Called infrequently, but could cache hand analysis

---

### 5. **State Reducer Operations** (SYNCHRONOUS, BLOCKING)

**Location:** `utils/state/GameReducer.js`

**Critical Operations:**

#### `PLAY_CARD` Action (Lines 225-388):
```javascript
1. Validation checks (suit following, card ownership)
2. Array filtering to remove card from hand
3. Array spreading to update currentTrick
4. Conditional trick completion logic:
   - determineTrickWinner() call
   - Team score updates
   - Round completion scoring (complex nested conditionals)
   - Score history creation
```

**Issue:** All operations are **synchronous** and block UI thread. Round completion scoring (lines 313-385) involves:
- Multiple conditional branches
- Array operations
- Object spreading
- History entry creation

**Optimization Potential:** ⚠️ **MEDIUM** - Could defer non-critical updates (history logging)

---

### 6. **React useEffect Cascade** (TIMING HAZARD)

**Location:** `screens/GameScreen.js`

**Count:** **11 concurrent useEffect hooks** monitoring game state

**Hooks and Dependencies:**

1. **AI Bidding** (Line 291): `[gameState.bidding.currentBidder, gameState.phase]`
2. **AI Trump Selection** (Line 319): `[gameState.phase, gameState.contract.declarer, gameState.contract.trumpSuit]`
3. **Turn Indicator** (Line 337): `[gameState.playing.currentPlayer, gameState.phase]`
4. **Human Timeout** (Line 347): 7 dependencies including `gameState.playing.*`
5. **Trick Advance** (Line 426): 4 dependencies for settling logic
6. **AI Move** (Line 442): `[gameState.phase, gameState.playing.currentPlayer, ...]`
7. **Dev Validation** (Line 506): `[]` (mount only)
8. **State Validation** (Line 513): `[gameState.phase, gameState.playing.trickNumber]`
9. **Score History** (Line 523): `[gameState.scoreHistory, gameState.phase]`
10. **Human Card Commit** (Line 545): 5 dependencies
11. **Screen Layout** (Line 51): Layout callback

**Issue:** When `gameState` changes, **multiple effects can fire simultaneously**, each potentially:
- Starting timers
- Dispatching actions
- Triggering animations
- Updating component state

**Race Condition Example:**
```
PLAY_CARD dispatch
    ↓
gameState updates
    ↓
├─ AI Move effect triggers (if AI turn next)
├─ Trick Advance effect triggers (if trick complete)
├─ Turn Indicator effect triggers
└─ Score History effect triggers
```

All fire within **the same render cycle**, creating unpredictable execution order.

**Optimization Potential:** ⚠️ **HIGH** - Consolidate effects, add guard flags, serialize state transitions

---

## Identified Race Conditions

### Race #1: Animation vs. State Update

**Scenario:**
```
1. Player plays card
2. triggerCardAnimation() starts 500ms animation
3. PLAY_CARD dispatch updates state immediately
4. Card removed from hand in state
5. Hand re-renders without card (card still animating!)
6. After 500ms: onAnimationComplete fires
7. ADD_CARD_TO_TRICK_AREA adds card to table
```

**Result:** Card briefly disappears during animation because it's removed from hand state but not yet in trick area.

**Location:** `GameScreen.js:237-288`, `AnimatingCard.js:43-47`

---

### Race #2: Trick Completion vs. Next Card Animation

**Scenario:**
```
1. 4th card animation still in progress (started at T=0, ends at T=500ms)
2. At T=0: Trick complete, settling=true, 500ms timer starts
3. At T=500ms: ADVANCE_AFTER_TRICK fires, clears trickAreaCards
4. At T=500ms (same time): 4th card animation completes, tries to add to trick area
5. Trick area already cleared!
```

**Result:** 4th card animation completes but card never appears on table.

**Location:** `GameScreen.js:426-439`, `GameReducer.js:516-544`

---

### Race #3: Overlapping AI Moves

**Scenario:**
```
AI-1 plays at T=0 (800ms delay + 500ms animation = done at T=1300ms)
AI-2 turn starts at T=0 (state updated)
AI-2 plays at T=800ms (animation starts)
AI-3 turn starts at T=800ms
AI-3 plays at T=1600ms

Timeline:
T=0:    AI-1 effect triggers, setTimeout(800)
T=0:    AI-2 turn assigned in state
T=800:  AI-1 plays, animation starts (ends T=1300)
T=800:  AI-2 effect triggers, setTimeout(800)
T=1300: AI-1 animation completes
T=1600: AI-2 plays, animation starts (ends T=2100)
```

**Result:** Animations can overlap if state updates faster than animations complete.

**Location:** `GameScreen.js:442-503`

---

### Race #4: Human Commit vs. Auto-play Timeout

**Scenario:**
```
1. Human's turn starts, 15s timeout begins
2. At T=14.9s: Human selects card
3. Selection triggers commit effect
4. At T=15s: Timeout fires, auto-plays same card
5. Both commits attempt to dispatch PLAY_CARD
```

**Mitigation:** `commitInProgressRef` guard exists but timing is tight.

**Location:** `GameScreen.js:367-404`, `GameScreen.js:545-582`

---

## Memory and Rendering Performance

### 1. **Animating Cards Array Growth**

**Location:** `GameScreen.js:46`

```javascript
const [animatingCards, setAnimatingCards] = useState([]);
```

**Issue:** Array grows with each card play, relies on completion callbacks to shrink. If callbacks fail (race condition), array leaks memory.

**Current Max Size:** 4 cards max (one per player in a trick)

**Mitigation:** Completion handler removes by ID, but race conditions can prevent cleanup.

---

### 2. **State Object Complexity**

**Size Estimate:**
```javascript
gameState = {
  players[4]: {
    hand[0-13]: { suit, label, value }  // ~52 cards total initially
  },
  bidding: { bids[], ... },
  playing: { currentTrick[0-4], previousTrick[0-4], ... },
  teams: { ... },
  animations: { trickAreaCards[0-4], playedCardAnimations{} },
  scoreHistory[0-N],  // Grows unbounded!
  ...
}
```

**Issues:**
- `scoreHistory` array grows unbounded (one entry per round, no limit)
- `animations.trickAreaCards` temporary array (max 4 items)
- Deep object nesting causes expensive spreads in reducer

**Optimization Potential:** ⚠️ **MEDIUM** - Limit history size, flatten state structure

---

### 3. **Component Re-render Frequency**

**GameScreen Component:**
- Re-renders on every `gameState` change (via useReducer)
- Contains 11 useEffect hooks
- Renders 4 Player components + TrickArea + modals

**Trigger Frequency:**
- Every card play: 1 render
- Every state update: 1 render
- Every animation completion: 1 render
- **Estimate: 100-200 renders per round**

**Optimization Potential:** ⚠️ **HIGH** - React.memo for Player components, useMemo for calculations

---

## Critical Timing Conflicts

### Conflict Matrix

| Event | Duration | Overlaps With | Impact |
|-------|----------|---------------|---------|
| Card Animation | 500ms | Trick settle (500ms) | Cards disappear |
| AI Move Delay | 800ms | Next AI move delay | Animations overlap |
| Trick Settle | 500ms | 4th card animation | Last card vanishes |
| Human Timeout | 15s | Card commit effect | Double-play risk |
| Bidding Delays | 1500-2000ms | User perception | Feels slow |

---

## Recommendations Summary

### High Priority (Immediate)

1. **Serialize Animation & State Updates**
   - Wait for animation completion before clearing trick area
   - Add `animationsInProgress` counter/flag

2. **Fix Race #2** (Trick completion vs. 4th card)
   - Delay ADVANCE_AFTER_TRICK by additional 100ms buffer
   - Or: Wait for all animation completions before advancing

3. **Add Animation Queue**
   - Prevent overlapping card animations
   - Queue AI moves until previous animation completes

4. **Consolidate useEffect Hooks**
   - Combine related effects
   - Add mutual exclusion guards

### Medium Priority

5. **Optimize AI Logic**
   - Cache suit groupings
   - Precompute hand analysis at deal time
   - Move heavy computation off UI thread (web workers if possible)

6. **Memoize Position Calculations**
   - Cache card positions per hand size
   - Use React.memo for Player components

7. **Limit State Growth**
   - Cap `scoreHistory` at last 10 rounds
   - Clear old animation data

### Low Priority

8. **Performance Monitoring**
   - Add timing logs around heavy functions
   - Track animation completion rates
   - Monitor state update frequency

9. **User Feedback**
   - Visual indicators during processing
   - Loading states for AI moves
   - Animation progress feedback

---

## Detailed Function Timing Profiles

### Heavy Functions (Need Profiling)

| Function | Location | Estimated Time | Frequency | Total Impact |
|----------|----------|----------------|-----------|--------------|
| `chooseAiCardSmart()` | PlayEngine.js:40 | 5-50ms | 39/round | 195-1950ms/round |
| `evaluateBid()` | biddingStrategy.js:199 | 2-10ms | 4-12/round | 8-120ms/round |
| `determineTrickWinner()` | gameLogic.js:86 | <1ms | 200-400/round | 200-400ms/round |
| `getCardPositionInHand()` | cardAnimationHelpers.js:13 | <1ms | 52/round | <52ms/round |
| `gameReducer PLAY_CARD` | GameReducer.js:225 | 1-5ms | 52/round | 52-260ms/round |

**Total Processing Time per Round:** ~455-2,782ms (not counting delays)

---

## Timing Configuration Constants

All hardcoded timing values in the codebase:

| Constant | Value | Location | Purpose |
|----------|-------|----------|---------|
| Animation Duration | 500ms | AnimatingCard.js:41 | Card flight time |
| Trick Settle Delay | 500ms | GameScreen.js:436 | Table freeze after trick |
| AI Move Delay | 800ms | GameScreen.js:461 | AI think time |
| AI Bid Delay | 1500ms | GameScreen.js:311 | AI bidding pause |
| Trump Select Delay | 2000ms | GameScreen.js:330 | Trump choice pause |
| Human Timeout | 15000ms | GameScreen.js:364 | Auto-play timer |
| Message Duration | 1500-3000ms | Various | Toast messages |
| PlayerCircle Interval | 1000ms | PlayerCircle.js:128 | Timer countdown |

**Total Delay per Trick (AI only):** 800ms × 4 players + 500ms settle = **3,700ms minimum**

**Total Delay per Round (13 tricks, all AI):** ~48 seconds of artificial delays

---

## Testing Recommendations

### Unit Tests Needed
1. Animation completion callbacks
2. Race condition guards (commitInProgressRef, aiGuardRef)
3. State update ordering
4. Timer cleanup on unmount

### Integration Tests Needed
1. Rapid card plays (stress test)
2. Animation overlap scenarios
3. Trick boundary transitions
4. Human timeout edge cases

### Performance Tests Needed
1. Render count per round
2. AI logic execution time
3. State update latency
4. Animation frame drops

---

## Monitoring Hooks (Proposed)

```javascript
// Add to GameScreen.js for debugging
useEffect(() => {
  const start = performance.now();
  // Track render time
  return () => {
    const duration = performance.now() - start;
    if (duration > 16) { // > 1 frame at 60fps
      console.warn('Slow render:', duration, 'ms');
    }
  };
});
```

---

## Conclusion

The card disappearing issues stem from **timing mismatches** between:
1. 500ms animation duration
2. 500ms trick settle delay  
3. Immediate state updates

These create a perfect storm where cards are removed from state before animations complete, and trick areas are cleared while animations are still in flight.

**Primary Fix:** Implement animation state tracking and defer state updates until animations complete.

**Secondary Fix:** Add buffer delays and queue system to prevent overlapping operations.

---

**End of Analysis**
