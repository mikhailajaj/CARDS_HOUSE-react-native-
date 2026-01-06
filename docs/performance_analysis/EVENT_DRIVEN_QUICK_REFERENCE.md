# Event-Driven Architecture Quick Reference

> **Quick guide for implementing the event-driven architecture proposal**

## Installation

```bash
# No new dependencies needed - pure JavaScript implementation
# Optional: For storage (already in project)
npm install @react-native-async-storage/async-storage
```

## Quick Start: Phase 1 (Recommended)

### 1. Add Animation Completion Tracking

```javascript
// In GameScreen.js
const [animationsInProgress, setAnimationsInProgress] = useState(0);

// Before animation starts
setAnimationsInProgress(prev => prev + 1);

// After animation completes
animation.start(({ finished }) => {
  if (finished) {
    setAnimationsInProgress(prev => prev - 1);
  }
});

// Guard state updates
if (animationsInProgress === 0) {
  dispatch({ type: GAME_ACTIONS.ADVANCE_AFTER_TRICK });
}
```

### 2. Add Phase Guards to useEffects

```javascript
useEffect(() => {
  // Add guard at the top
  if (gameState.phase !== GAME_PHASES.PLAYING) return;
  if (animationsInProgress > 0) return;
  
  // Rest of effect logic...
}, [gameState.playing.currentPlayer]);
```

### 3. Add Coordination Flag in Reducer

```javascript
// In GameReducer.js
case GAME_ACTIONS.PLAY_CARD: {
  const newTrick = [...state.playing.currentTrick, { player, card }];
  const trickComplete = newTrick.length === 4;
  
  return {
    ...state,
    playing: {
      ...state.playing,
      currentTrick: newTrick,
      trickJustCompleted: trickComplete, // NEW FLAG
    },
  };
}
```

**Effort:** 3-5 days  
**Expected Result:** ~40% fewer re-renders, most race conditions eliminated

---

## Quick Start: Phase 2 (If Phase 1 Insufficient)

### 1. Create Event Bus

```bash
# Create new file
touch utils/GameEventBus.js
```

Copy the `GameEventQueue` implementation from the main proposal.

### 2. Register Handlers (Once on Mount)

```javascript
// In GameScreen.js
const stateRef = useRef(gameState);

useEffect(() => {
  stateRef.current = gameState;
}, [gameState]);

useEffect(() => {
  // Register all handlers
  const unsubs = [];
  
  unsubs.push(gameEventBus.on(GAME_EVENTS.CARD_PLAY_REQUESTED, async ({ playerIndex, card }) => {
    const state = stateRef.current; // Get latest state
    // Validate and emit ANIMATION_STARTED
  }));
  
  // ... more handlers
  
  return () => unsubs.forEach(unsub => unsub());
}, []); // Empty deps!
```

### 3. Emit Events from UI

```javascript
const handleCardPress = useCallback((card) => {
  gameEventBus.emit(GAME_EVENTS.CARD_PLAY_REQUESTED, {
    playerIndex: 2,
    card,
  });
}, []);
```

**Effort:** 1 week  
**Expected Result:** ~60% fewer re-renders, race conditions eliminated

---

## Event Types Reference

### Card Play Flow
```
CARD_PLAY_REQUESTED
  ↓
ANIMATION_STARTED
  ↓
ANIMATION_COMPLETED
  ↓
TRICK_COMPLETED (if trick done)
  ↓
TRICK_CLEARED
  ↓
TURN_CHANGED
```

### Complete Event List

**Playing Phase:**
- `CARD_SELECTED`
- `CARD_PLAY_REQUESTED`
- `ANIMATION_STARTED`
- `ANIMATION_COMPLETED`
- `TRICK_COMPLETED`
- `TRICK_CLEARED`
- `TURN_CHANGED`

**Bidding Phase:**
- `BIDDING_STARTED`
- `BID_SUBMITTED`
- `BID_PASSED`
- `DECLARER_SELECTED`

**Trump Selection:**
- `TRUMP_SELECTION_REQUESTED`
- `TRUMP_SELECTED`
- `TRUMP_CONFIRMED`

**AI Events:**
- `AI_THINKING`
- `AI_DECISION_MADE`
- `AI_BID_THINKING`
- `AI_BID_DECISION`

**Timeouts:**
- `HUMAN_TIMEOUT_STARTED`
- `HUMAN_TIMEOUT_EXPIRED`
- `TIMEOUT_CANCELLED`

---

## Common Patterns

### Wait for Event
```javascript
const payload = await gameEventBus.waitFor(GAME_EVENTS.ANIMATION_COMPLETED, 5000);
```

### Wait for Sequence
```javascript
const results = await gameEventBus.waitForSequence([
  GAME_EVENTS.ANIMATION_STARTED,
  GAME_EVENTS.ANIMATION_COMPLETED,
  GAME_EVENTS.TURN_CHANGED,
], 10000);
```

### One-Time Handler
```javascript
gameEventBus.once(GAME_EVENTS.TRICK_COMPLETED, async ({ trickNumber }) => {
  console.log('Trick completed:', trickNumber);
});
```

### Pause/Resume (for Modals)
```javascript
gameEventBus.pause();
await showModal();
gameEventBus.resume();
```

---

## Testing Helpers

```javascript
import { EventBusTestHelper } from './utils/GameEventBus.test.helpers';

test('Card play sequence', async () => {
  const helper = new EventBusTestHelper(gameEventBus);
  helper.startCapture();
  
  // Trigger action
  gameEventBus.emit(GAME_EVENTS.CARD_PLAY_REQUESTED, { ... });
  
  // Wait for completion
  await gameEventBus.waitFor(GAME_EVENTS.TURN_CHANGED);
  
  // Assert sequence
  helper.assertSequence([
    'CARD_PLAY_REQUESTED',
    'ANIMATION_STARTED',
    'ANIMATION_COMPLETED',
    'TURN_CHANGED',
  ]);
  
  helper.stopCapture();
});
```

---

## Debugging

### View Event Log
```javascript
const log = gameEventBus.getEventLog();
console.table(log);
```

### Queue Status
```javascript
const status = gameEventBus.getStatus();
console.log(status);
// { queueLength: 0, processing: false, paused: false, handlerCount: 8, logSize: 150 }
```

### Enable Verbose Logging
```javascript
// Already enabled in dev builds
// Disable in production by checking __DEV__
```

---

## Migration Checklist

### Phase 1: Incremental Fixes
- [ ] Add `animationsInProgress` counter
- [ ] Add phase guards to all useEffects
- [ ] Replace `setTimeout` with animation callbacks
- [ ] Add `trickJustCompleted` flag in reducer
- [ ] Test card play flow thoroughly
- [ ] Test trick completion flow
- [ ] Verify no regressions in bidding/trump

### Phase 2: Event Orchestrator
- [ ] Create `utils/GameEventBus.js`
- [ ] Define event types for playing phase
- [ ] Implement handler registration pattern with `stateRef`
- [ ] Migrate card play flow to events
- [ ] Migrate trick completion to events
- [ ] Remove old useEffects for migrated flows
- [ ] Add event logging for debugging
- [ ] Test complete game flow
- [ ] Performance benchmark

### Phase 3: Full Event-Driven (Optional)
- [ ] Extend event types for all phases
- [ ] Migrate bidding flow to events
- [ ] Migrate trump selection to events
- [ ] Migrate round management to events
- [ ] Add replay functionality
- [ ] Add event-based analytics
- [ ] Comprehensive test suite
- [ ] Performance optimization
- [ ] Documentation and training

---

## Performance Expectations

| Phase | Re-renders/Card | Improvement | Effort |
|-------|----------------|-------------|---------|
| Current | 10-20 | Baseline | - |
| Phase 1 | 6-12 | ~40% | 3-5 days |
| Phase 2 | 3-6 | ~60% | 1 week |
| Phase 3 | 2-4 | ~70-80% | 2-3 weeks |

---

## Troubleshooting

### "Handlers firing multiple times"
- Check if handlers are registered in useEffect with dependencies
- Should register once with empty `[]` deps
- Use unsubscribe functions in cleanup

### "Stale state in handlers"
- Use `stateRef` pattern shown above
- Call `stateRef.current` inside handler
- Keep ref updated in separate useEffect

### "Animations not waiting"
- Use Animated API callbacks, not setTimeout
- Await animation completion before emitting ANIMATION_COMPLETED
- Check animation actually runs (test with slower animation)

### "Race conditions still occurring"
- Verify events are serialized (log queue processing)
- Check for code bypassing event bus (direct dispatch calls)
- Ensure all async operations are awaited

---

## Further Reading

- [Full Proposal](./EVENT_DRIVEN_ARCHITECTURE_PROPOSAL.md) - Complete technical details
- [Phase 1 Execution Plan](./PHASE_1_EXECUTION_PLAN.md) - Step-by-step implementation
- [Performance Analysis](./TIMING_AND_PERFORMANCE_ANALYSIS.md) - Current issues deep dive

---

**Need Help?** Review the main proposal document for complete code examples and detailed explanations.
