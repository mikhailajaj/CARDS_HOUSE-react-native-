# Timing Flow Diagrams

Visual representation of timing flows and race conditions in the game.

---

## 1. Normal Card Play Flow (Single Player)

```
Time: 0ms
┌─────────────────────────────────────────────────────────┐
│ User clicks card OR AI timer fires (800ms delay)       │
└────────────────┬────────────────────────────────────────┘
                 │
Time: 0ms        ▼
┌─────────────────────────────────────────────────────────┐
│ triggerCardAnimation()                                  │
│ - Calculate from/to positions                           │
│ - Add to animatingCards state                           │
│ - Generate animation ID                                 │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├──────────────────┬─────────────────────┐
                 │                  │                     │
Time: 0ms        ▼                  ▼                     │
┌──────────────────────┐   ┌────────────────────┐        │
│ PLAY_CARD dispatch   │   │ Moti Animation     │        │
│ - Remove from hand   │   │ Starts (500ms)     │        │
│ - Add to trick       │   │                    │        │
│ - Update state       │   └──────┬─────────────┘        │
└──────────────────────┘          │                      │
                                  │                      │
Time: 0-500ms                     │ Animating...         │
Card invisible in hand!           │                      │
Not yet on table!                 │                      │
                                  │                      │
Time: 500ms                       ▼                      │
                         ┌────────────────────┐          │
                         │ onAnimationComplete│          │
                         │ callback fires     │          │
                         └──────┬─────────────┘          │
                                │                        │
Time: 500ms                     ▼                        │
                  ┌──────────────────────────┐           │
                  │ handleAnimationComplete()│           │
                  │ - Find animation by ID   │           │
                  │ - Remove from state      │           │
                  └──────┬───────────────────┘           │
                         │                               │
Time: 500ms              ▼                               │
                  ┌──────────────────────────┐           │
                  │ ADD_CARD_TO_TRICK_AREA   │           │
                  │ - Card appears on table  │           │
                  └──────────────────────────┘           │
                                                         │
Time: 0-500ms: CARD IS INVISIBLE! ◄────────────────────┘
(Removed from hand, not yet on table)
```

---

## 2. Trick Completion Flow (Race Condition)

```
Time: 0ms - 3 cards already on table
┌─────────────────────────────────────────────────────────┐
│ 4th Player plays card                                   │
└────────────────┬────────────────────────────────────────┘
                 │
Time: 0ms        ▼
┌─────────────────────────────────────────────────────────┐
│ triggerCardAnimation() for 4th card                     │
│ Animation duration: 500ms                               │
└────────────────┬────────────────────────────────────────┘
                 │
Time: 0ms        ▼
┌─────────────────────────────────────────────────────────┐
│ PLAY_CARD dispatch (4th card)                           │
│ - trickComplete = true                                  │
│ - settling = true (blocks input)                        │
│ - pendingAdvance = { winner }                           │
└────────────────┬────────────────────────────────────────┘
                 │
Time: 0ms        ▼
┌─────────────────────────────────────────────────────────┐
│ useEffect (Trick Advance) triggers                      │
│ setTimeout(() => ADVANCE_AFTER_TRICK, 500ms)            │
└─────────────────────────────────────────────────────────┘
                 
Time: 0-500ms
┌─────────────────────────────────────────────────────────┐
│ STATE: Table frozen (settling=true)                     │
│ - 3 cards visible on table                              │
│ - 4th card animating (not visible anywhere!)            │
│ - Users can't play                                      │
└─────────────────────────────────────────────────────────┘

Time: 500ms - RACE CONDITION!
┌──────────────────────────┐    ┌──────────────────────────┐
│ Path A: Animation        │    │ Path B: setTimeout       │
│ completes                │    │ fires                    │
│                          │    │                          │
│ onAnimationComplete()    │    │ ADVANCE_AFTER_TRICK      │
│ ↓                        │    │ ↓                        │
│ ADD_CARD_TO_TRICK_AREA   │    │ Clear trickAreaCards[]   │
│ (tries to add 4th card)  │    │ Clear currentTrick[]     │
└────────┬─────────────────┘    └────────┬─────────────────┘
         │                               │
         │    RACE! Who wins?            │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌────────────────────────┐
         │ Possible Outcomes:     │
         │                        │
         │ A wins: 4th card added │
         │   then cleared (brief  │
         │   flash, disappears)   │
         │                        │
         │ B wins: 4th card never │
         │   appears (cleared     │
         │   before added)        │
         │                        │
         │ Simultaneous: undefined│
         │   behavior!            │
         └────────────────────────┘

Result: 4th card often never appears on table!
```

---

## 3. Rapid AI Play Sequence (Overlapping Animations)

```
Timeline: Full trick with 4 AI players

Time: 0ms
┌──────────────────────────────────────┐
│ AI Player 0 turn                     │
│ useEffect triggers                   │
│ setTimeout(800ms)                    │
└──────────────────────────────────────┘

Time: 800ms
┌──────────────────────────────────────┐
│ AI Player 0 plays                    │
│ - Animation starts (500ms)           │
│ - PLAY_CARD updates state            │
│ - Next player = AI Player 1          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ AI Player 1 turn (immediate)         │
│ useEffect triggers                   │
│ setTimeout(800ms)                    │
└──────────────────────────────────────┘

Time: 1300ms
┌──────────────────────────────────────┐
│ AI Player 0 animation COMPLETES      │
│ Card added to table                  │
└──────────────────────────────────────┘

Time: 1600ms (800ms after P0 played)
┌──────────────────────────────────────┐
│ AI Player 1 plays                    │
│ - Animation starts (500ms)           │
│ - PLAY_CARD updates state            │
│ - Next player = AI Player 2          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ AI Player 2 turn (immediate)         │
│ useEffect triggers                   │
│ setTimeout(800ms)                    │
└──────────────────────────────────────┘

Time: 2100ms
┌──────────────────────────────────────┐
│ AI Player 1 animation COMPLETES      │
│ Card added to table                  │
└──────────────────────────────────────┘

Time: 2400ms
┌──────────────────────────────────────┐
│ AI Player 2 plays                    │
│ - Animation starts (500ms)           │
│ - PLAY_CARD updates state            │
│ - Next player = AI Player 3          │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│ AI Player 3 turn (immediate)         │
│ useEffect triggers                   │
│ setTimeout(800ms)                    │
└──────────────────────────────────────┘

Time: 2900ms
┌──────────────────────────────────────┐
│ AI Player 2 animation COMPLETES      │
│ Card added to table                  │
└──────────────────────────────────────┘

Time: 3200ms
┌──────────────────────────────────────┐
│ AI Player 3 plays (4th card!)        │
│ - Animation starts (500ms)           │
│ - PLAY_CARD: trickComplete=true      │
│ - settling=true                      │
│ - setTimeout(ADVANCE, 500ms)         │
└──────────────────────────────────────┘

Time: 3700ms - BOTH EVENTS FIRE!
┌──────────────────────────────────────┐
│ AI Player 3 animation completes      │
│ + setTimeout fires                   │
│ = RACE CONDITION #2 again!           │
└──────────────────────────────────────┘

OBSERVATION: Animations overlap during 800-1300ms window!
- P0 animation: 800-1300ms
- P1 starts: 1600ms (300ms gap - OK)
- P1 animation: 1600-2100ms
- P2 starts: 2400ms (300ms gap - OK)
- P2 animation: 2400-2900ms
- P3 starts: 3200ms (300ms gap - OK)
- P3 animation: 3200-3700ms
- Trick advance: 3700ms (COLLISION!)

Total trick time: 3700ms (3.7 seconds for 4 AI players)
```

---

## 4. Human Player with Auto-Timeout

```
Time: 0ms
┌─────────────────────────────────────────────────────────┐
│ Human player's turn begins                              │
│ - PlayerCircle timer starts (15s countdown)             │
│ - humanTimeoutRef setTimeout(15000ms)                   │
└────────────────┬────────────────────────────────────────┘
                 │
Time: 0-14900ms  │
┌────────────────▼────────────────────────────────────────┐
│ Human thinking...                                       │
│ - Can select cards                                      │
│ - Visual timer counting down                            │
└─────────────────────────────────────────────────────────┘

Time: 14900ms
┌─────────────────────────────────────────────────────────┐
│ Human selects card                                      │
│ - setSelectedCard(card)                                 │
│ - Triggers useEffect (line 545)                         │
└────────────────┬────────────────────────────────────────┘
                 │
Time: 14900ms    ▼
┌─────────────────────────────────────────────────────────┐
│ useEffect detects valid selection                       │
│ - commitInProgressRef.current = true                    │
│ - clearTimeout(humanTimeoutRef) ← CRITICAL!             │
│ - triggerCardAnimation()                                │
│ - PLAY_CARD dispatch                                    │
└─────────────────────────────────────────────────────────┘

Time: 15000ms (100ms later!)
┌─────────────────────────────────────────────────────────┐
│ Auto-timeout fires                                      │
│ - Checks commitInProgressRef (should be true)           │
│ - If false: would dispatch PLAY_CARD again! ← DANGER    │
└─────────────────────────────────────────────────────────┘

SAFE SCENARIO (working):
commitInProgressRef prevents double-play

UNSAFE SCENARIO (if timing is off):
If commit effect hasn't set flag yet, both paths fire!

Timing window: ~100ms race condition window
```

---

## 5. useEffect Cascade on State Change

```
Event: PLAY_CARD dispatched
       │
       ▼
┌──────────────────────────────────────┐
│ gameReducer runs (synchronous)       │
│ - Updates gameState                  │
│ - Returns new state object           │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│ GameScreen re-renders                │
│ All useEffect hooks check deps       │
└────────────┬─────────────────────────┘
             │
             ├─────────────────┬───────────────┬──────────────┬─────────────┐
             ▼                 ▼               ▼              ▼             ▼
┌──────────────────┐  ┌──────────────┐ ┌─────────────┐ ┌──────────┐ ┌────────┐
│ AI Move Effect   │  │ Turn Show    │ │ Human       │ │ Trick    │ │ Score  │
│ (line 442)       │  │ Message      │ │ Timeout     │ │ Advance  │ │ History│
│                  │  │ (line 337)   │ │ (line 347)  │ │ (line426)│ │ (523)  │
│ Checks:          │  │              │ │             │ │          │ │        │
│ - isAI?          │  │ Shows msg    │ │ Sets timer  │ │ Checks   │ │ Saves  │
│ - settling?      │  │              │ │             │ │ settling │ │ entry  │
│ - trick full?    │  │              │ │             │ │          │ │        │
│                  │  │              │ │             │ │          │ │        │
│ If yes:          │  │              │ │             │ │ Fires if │ │        │
│ setTimeout(800)  │  │              │ │             │ │ complete │ │        │
└──────────────────┘  └──────────────┘ └─────────────┘ └──────────┘ └────────┘

ALL FIRE IN SAME RENDER CYCLE! ← Potential timing conflicts

Execution order: UNDEFINED (React doesn't guarantee order)
Some effects set timers, some dispatch actions immediately.

Result: Unpredictable timing, race conditions
```

---

## 6. Animation State vs. Game State Mismatch

```
Game State:                Animation State:
┌─────────────┐            ┌──────────────────┐
│ players[2]  │            │ animatingCards[] │
│ .hand = [   │            │                  │
│   Card1,    │            │                  │
│   Card2,    │◄───┐       │                  │
│   Card3     │    │       │                  │
│ ]           │    │       │                  │
└─────────────┘    │       └──────────────────┘
                   │
                   │ User plays Card1
                   │
Time: 0ms          │
┌─────────────┐    │       ┌──────────────────┐
│ players[2]  │    │       │ animatingCards[] │
│ .hand = [   │    │       │ = [              │
│   Card2,    │◄───┼───X   │   {              │
│   Card3     │    │       │     card: Card1, │
│ ]           │    │       │     from: {...}, │
│             │    │       │     to: {...}    │
│ Card1       │    │       │   }              │
│ REMOVED! ◄──┘    │       │ ]                │
└─────────────┘    │       └──────────────────┘
                   │
                   │ Card1 is NOT in hand
                   │ Card1 is NOT on table yet
                   │ Card1 is ONLY in animation state
                   │
Time: 0-500ms      │
CARD1 INVISIBLE!   │
                   │
Time: 500ms        │
┌─────────────┐    │       ┌──────────────────┐
│ Table:      │    │       │ animatingCards[] │
│ [           │    │       │ = []             │
│   Card1 ◄───┼────┼───────┤                  │
│ ]           │    │       │ (removed after   │
└─────────────┘    │       │  completion)     │
                   │       └──────────────────┘
                   │
                   │ Now Card1 appears on table
                   │ (500ms gap of invisibility!)
```

---

## 7. Proposed Fix: Animation-Aware State Management

```
Current (BROKEN):
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ├──────────────┬─────────────────┐
       │              │                 │
       ▼              ▼                 ▼
  Dispatch       Animation         Component
  (instant)      (500ms)          Re-render
       │              │                 │
       ▼              │                 ▼
  State Updated       │            Card removed from UI
  (instant)           │            (invisible!)
                      │
                      ▼
                 Completes (500ms later)
                 Card appears on table


Proposed (FIXED):
┌─────────────┐
│ User Action │
└──────┬──────┘
       │
       ▼
  Start Animation (mark card as "animating")
       │
       ├──────────────┬─────────────────┐
       │              │                 │
       ▼              ▼                 ▼
  Mark Card      Animation         Component
  "animating"    (500ms)           Re-render
  (instant)                             │
       │                                ▼
       │                           Render card with
       │                           "animating" flag
       │                           (visible, translucent)
       │                                │
       │                                │
       │              ┌─────────────────┘
       │              │
       ▼              ▼
  Wait for animation complete
       │
       ▼
  Dispatch state update
  (remove from hand, add to table)
       │
       ▼
  Card appears on table
  (no gap!)

Key change: State update AFTER animation, not BEFORE
```

---

## 8. Timeline: Full Round (13 Tricks, 4 AI Players)

```
Trick 1:
  0.0s - P0 turn starts
  0.8s - P0 plays, animation starts
  1.3s - P0 animation completes
  1.3s - P1 turn starts
  2.1s - P1 plays, animation starts
  2.6s - P1 animation completes
  2.6s - P2 turn starts
  3.4s - P2 plays, animation starts
  3.9s - P2 animation completes
  3.9s - P3 turn starts
  4.7s - P3 plays, animation starts
  5.2s - P3 animation completes + ADVANCE fires (RACE!)
  
Trick 2:
  5.2s - Winner leads
  6.0s - Winner plays
  ... (repeat pattern)
  
Total time per trick: ~5.2 seconds
Total time for 13 tricks: ~67.6 seconds

Add bidding phase: ~5-10 seconds
Total round time: ~73-78 seconds (over 1 minute!)

User perception: Feels slow and laggy
```

---

## 9. Memory Leak Scenario

```
Normal flow:
┌──────────────────┐
│ animatingCards[] │
│ size: 0          │
└────────┬─────────┘
         │
         ▼ Add animation
┌──────────────────┐
│ animatingCards[] │
│ size: 1          │
│ [anim-1]         │
└────────┬─────────┘
         │
         ▼ Animation completes
┌──────────────────┐
│ animatingCards[] │
│ size: 0          │
│ (removed)        │
└──────────────────┘

Leak scenario (callback fails):
┌──────────────────┐
│ animatingCards[] │
│ size: 0          │
└────────┬─────────┘
         │
         ▼ Add animation
┌──────────────────┐
│ animatingCards[] │
│ size: 1          │
│ [anim-1]         │
└────────┬─────────┘
         │
         ▼ Animation completes but callback doesn't fire!
┌──────────────────┐
│ animatingCards[] │
│ size: 1          │
│ [anim-1] ← STUCK!│
└────────┬─────────┘
         │
         ▼ Next animation
┌──────────────────┐
│ animatingCards[] │
│ size: 2          │
│ [anim-1, anim-2] │
└────────┬─────────┘
         │
         ▼ Grows forever...
┌──────────────────┐
│ animatingCards[] │
│ size: 52         │
│ [anim-1...52]    │
│ Memory leak!     │
└──────────────────┘

Mitigation: Add cleanup timers, max size limits
```

---

## Summary

All diagrams show critical timing issues:
1. **500ms animation gap** where cards are invisible
2. **Race condition** at trick completion (500ms + 500ms collision)
3. **Overlapping operations** in rapid AI play
4. **State vs. animation desync** causing visual artifacts
5. **Cascading useEffect** creating unpredictable timing

**Solution:** Synchronize animation completion with state updates.
