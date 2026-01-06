# Performance Analysis Documentation

This folder contains comprehensive analysis of timing constraints and performance bottlenecks in the Tarneeb card game implementation.

## Issue Summary

During gameplay, cards are **disappearing from the table**, **visual glitches occur**, and the game experiences **timing/processing speed problems**. These issues stem from race conditions between animation completion and state updates.

---

## Documentation Files

### 1. [TIMING_AND_PERFORMANCE_ANALYSIS.md](./TIMING_AND_PERFORMANCE_ANALYSIS.md)
**Primary technical analysis document**

Contains:
- Executive summary of root causes
- Complete game flow overview
- Critical timing constraints (all timeouts/delays documented)
- Performance bottlenecks with complexity analysis
- Identified race conditions with code locations
- Memory and rendering performance issues
- Timing conflict matrix
- Detailed function timing profiles
- All hardcoded timing constants

**Key Findings:**
- **500ms animation duration** creates invisibility gaps
- **4 race conditions identified** (animation vs state updates)
- **11 concurrent useEffect hooks** causing unpredictable timing
- **AI computation takes 5-50ms per move** (195-1950ms per round)
- **Total artificial delays: ~48 seconds per round** (AI only)

### 2. [TIMING_FLOW_DIAGRAM.md](./TIMING_FLOW_DIAGRAM.md)
**Visual timing diagrams**

Contains:
- ASCII art flow diagrams for all critical timing scenarios
- Race condition visualizations
- Animation state vs game state diagrams
- Timeline breakdowns
- Memory leak scenarios
- Proposed fix architectures

**Diagrams Include:**
- Normal card play flow (single player)
- Trick completion flow (race condition #2)
- Rapid AI play sequence (overlapping animations)
- Human player with auto-timeout
- useEffect cascade on state change
- Animation state vs game state mismatch
- Full round timeline (13 tricks)
- Memory leak scenario

### 3. [PERFORMANCE_OPTIMIZATION_RECOMMENDATIONS.md](./PERFORMANCE_OPTIMIZATION_RECOMMENDATIONS.md)
**Actionable solutions and implementation guide**

Contains:
- **Critical fixes** (must implement immediately)
- **High priority optimizations** (major impact)
- **Medium priority optimizations** (UX improvements)
- **Low priority enhancements** (future work)
- Code examples for each fix
- Implementation priority roadmap (4-phase plan)
- Testing recommendations
- Success metrics

**Critical Fixes:**
1. Animation-aware state management (eliminates card disappearing)
2. Trick completion race condition fix (ensures 4th card appears)
3. Animation queue system (prevents overlapping)
4. Consolidated useEffect hooks (eliminates timing conflicts)

---

## Quick Reference: Root Causes

### Race Condition #1: Animation vs State Update
```
Problem: Card removed from hand state before 500ms animation completes
Result: Card invisible for 500ms (not in hand, not on table yet)
Location: GameScreen.js:237-288, AnimatingCard.js:43-47
```

### Race Condition #2: Trick Completion Collision
```
Problem: ADVANCE_AFTER_TRICK (500ms delay) fires at same time as 4th card animation completes (500ms)
Result: Table cleared before 4th card can be added
Location: GameScreen.js:426-439, GameReducer.js:516-544
```

### Race Condition #3: Overlapping AI Moves
```
Problem: AI plays every 800ms, animations take 500ms
Result: Multiple animations can overlap, causing visual conflicts
Location: GameScreen.js:442-503
```

### Race Condition #4: Human Timeout Edge Case
```
Problem: Manual card selection can race with 15s auto-play timeout
Result: Potential double-play (mitigated by commitInProgressRef)
Location: GameScreen.js:367-404, GameScreen.js:545-582
```

---

## Performance Bottlenecks Summary

| Function | Location | Est. Time | Frequency | Impact |
|----------|----------|-----------|-----------|---------|
| `chooseAiCardSmart()` | PlayEngine.js | 5-50ms | 39/round | **HIGH** |
| `evaluateBid()` | biddingStrategy.js | 2-10ms | 4-12/round | LOW |
| `determineTrickWinner()` | gameLogic.js | <1ms | 200-400/round | MEDIUM |
| `getCardPositionInHand()` | cardAnimationHelpers.js | <1ms | 52/round | LOW |
| `gameReducer PLAY_CARD` | GameReducer.js | 1-5ms | 52/round | MEDIUM |

**Total processing per round:** ~455-2,782ms (excluding artificial delays)

---

## Timing Constants Reference

| Constant | Value | Location | Purpose |
|----------|-------|----------|---------|
| Animation Duration | **500ms** | AnimatingCard.js:41 | Card flight time |
| Trick Settle Delay | **500ms** | GameScreen.js:436 | Table freeze after trick |
| AI Move Delay | **800ms** | GameScreen.js:461 | AI think time |
| AI Bid Delay | **1500ms** | GameScreen.js:311 | AI bidding pause |
| Trump Select Delay | **2000ms** | GameScreen.js:330 | Trump choice pause |
| Human Timeout | **15000ms** | GameScreen.js:364 | Auto-play timer |
| PlayerCircle Interval | **1000ms** | PlayerCircle.js:128 | Timer countdown |

---

## Implementation Roadmap

### Phase 1: Critical Fixes (Week 1) ⚠️ **URGENT**
**Goal:** Eliminate card disappearing issues

- [ ] Implement animation-aware state management
- [ ] Fix trick completion race condition
- [ ] Add animation queue system
- [ ] Write tests for race conditions

**Expected Result:** Cards always visible, no disappearing

### Phase 2: High Priority (Week 2)
**Goal:** Improve stability and performance

- [ ] Consolidate useEffect hooks into state machine
- [ ] Cache AI logic computations
- [ ] Add React.memo to Player components
- [ ] Limit state history growth

**Expected Result:** Stable gameplay, fewer re-renders

### Phase 3: UX Improvements (Week 3)
**Goal:** Make game feel faster and responsive

- [ ] Reduce all timeout durations by 40-50%
- [ ] Add user-configurable game speed
- [ ] Memoize position calculations
- [ ] Optimize determineTrickWinner

**Expected Result:** Round time reduced from 75s to ~40s

### Phase 4: Polish (Ongoing)
**Goal:** Long-term monitoring and refinement

- [ ] Add performance monitoring
- [ ] Implement animation frame management
- [ ] Comprehensive testing suite
- [ ] User testing and feedback

**Expected Result:** Production-ready, monitored performance

---

## How to Use This Documentation

### For Developers Implementing Fixes:
1. **Start with:** `TIMING_AND_PERFORMANCE_ANALYSIS.md` to understand the problems
2. **Visualize with:** `TIMING_FLOW_DIAGRAM.md` to see the race conditions
3. **Implement from:** `PERFORMANCE_OPTIMIZATION_RECOMMENDATIONS.md` with code examples
4. **Follow:** The 4-phase roadmap for prioritization

### For Code Review:
- Check that animation completion is awaited before state updates
- Verify no new setTimeout/useEffect without guards
- Ensure new animations are added to the queue system
- Confirm timing constants use configuration file

### For Testing:
- Run integration tests for rapid card plays
- Stress test with 4 AI players (fastest scenario)
- Monitor animation completion rates
- Check for memory leaks in animatingCards array

### For Performance Monitoring:
```javascript
// Add to GameScreen.js during development
useEffect(() => {
  console.log('[PERF] Animation queue length:', animatingCards.length);
  console.log('[PERF] Pending animations:', pendingAnimations);
}, [animatingCards, pendingAnimations]);
```

---

## Key Metrics to Track

### Before Fixes:
- ❌ Cards disappear for 500ms during play
- ❌ 4th card often doesn't appear on table
- ❌ Race conditions cause unpredictable behavior
- ❌ AI rounds take ~75 seconds
- ❌ Frame drops during rapid play

### After Phase 1:
- ✅ Cards always visible (0ms invisibility)
- ✅ All 4 cards reliably appear on table
- ✅ Race conditions eliminated
- ⏸️ AI rounds still ~75 seconds (unchanged)
- ⏸️ Frame drops reduced but present

### After Phase 3:
- ✅ Cards always visible
- ✅ Reliable trick display
- ✅ No race conditions
- ✅ AI rounds ~40 seconds (47% faster)
- ✅ Minimal frame drops
- ✅ User can control game speed

---

## Technical Context

### Game Architecture
- **State Management:** React useReducer with complex state machine
- **Animations:** Moti library (React Native animation)
- **Rendering:** React Native components with absolute positioning
- **AI Logic:** Synchronous JavaScript (no workers)
- **Turn System:** Anticlockwise (0→1→2→3→0)

### Animation System
- **Duration:** 500ms fixed (hardcoded)
- **Library:** Moti (uses React Native Reanimated)
- **Trigger:** User action or AI timeout
- **Completion:** Callback-based (onDidAnimate)
- **State:** Separate animatingCards array

### State Update Flow
```
Action Dispatch → Reducer (sync) → State Update → 
Component Re-render → useEffect Hooks (async) → 
More Dispatches...
```

**Problem:** Animations (500ms async) don't align with state updates (instant sync)

---

## Related Files

### Core Game Logic
- `screens/GameScreen.js` - Main game orchestration (1107 lines)
- `utils/state/GameReducer.js` - State machine (553 lines)
- `utils/engine/PlayEngine.js` - AI logic (162 lines)
- `utils/gameLogic.js` - Game rules (172 lines)

### Animation System
- `components/AnimatingCard.js` - Individual card animation (71 lines)
- `components/AnimatingCardsOverlay.js` - Animation layer (46 lines)
- `utils/cardAnimationHelpers.js` - Position calculations (140 lines)

### UI Components
- `components/TrickArea.js` - Table center display (176 lines)
- `components/Hand.js` - Player hand layout (112 lines)
- `components/Card.js` - Individual card rendering (139 lines)
- `components/PlayerCircle.js` - Timer display (413 lines)

### Supporting Logic
- `utils/biddingStrategy.js` - AI bidding (254 lines)
- `Bidding.js` - Bidding UI modal (200+ lines)

---

## Testing Strategy

### Unit Tests Needed
```
✓ Animation completion callbacks
✓ Race condition guards
✓ State update ordering
✓ Timer cleanup on unmount
✓ AI logic performance benchmarks
```

### Integration Tests Needed
```
✓ Rapid card play (stress test)
✓ 4-card trick completion
✓ AI vs AI full round
✓ Human timeout scenarios
✓ Animation overlap prevention
```

### Performance Tests Needed
```
✓ Render count per round (<200)
✓ AI logic execution time (<50ms)
✓ Animation completion rate (100%)
✓ Frame rate monitoring (≥60fps)
```

---

## Debugging Tips

### Enable Verbose Logging
```javascript
// Add to GameScreen.js
const DEBUG_TIMING = true;

useEffect(() => {
  if (DEBUG_TIMING) {
    console.log('[TIMING] Phase:', gameState.phase);
    console.log('[TIMING] Current player:', gameState.playing.currentPlayer);
    console.log('[TIMING] Animating cards:', animatingCards.length);
    console.log('[TIMING] Settling:', gameState.playing.settling);
  }
}, [gameState.phase, gameState.playing.currentPlayer, animatingCards, gameState.playing.settling]);
```

### Track Animation Lifecycle
```javascript
const triggerCardAnimation = useCallback((playerIndex, card, cardIndexInHand) => {
  const animationId = generateAnimationId();
  console.log(`[ANIM] START ${animationId} - Player ${playerIndex}, Card ${card.label}${card.suit}`);
  
  // ... existing code ...
  
  return animationId;
}, []);

const handleAnimationComplete = useCallback((animationId) => {
  console.log(`[ANIM] COMPLETE ${animationId}`);
  // ... existing code ...
}, []);
```

### Monitor Race Conditions
```javascript
// In trick advance effect
useEffect(() => {
  if (gameState.playing.settling && pendingAnimations > 0) {
    console.warn('[RACE] Trick settling while animations pending!', {
      pendingAnimations,
      trickCards: gameState.playing.currentTrick.length
    });
  }
}, [gameState.playing.settling, pendingAnimations]);
```

---

## FAQ

**Q: Why do cards disappear during play?**
A: Cards are removed from hand state immediately but animation takes 500ms. They exist only in animation state during this gap.

**Q: Why doesn't the 4th card appear on the table?**
A: Race condition: trick advance timer (500ms) and 4th card animation (500ms) both complete at same time. Table clears before card can be added.

**Q: Why do AI moves feel slow?**
A: Artificial delays: 800ms per AI move + 500ms animation = 1.3s per card. Plus 500ms settle delay = 3.7s per trick minimum.

**Q: Can we just increase animation speed?**
A: Partially helps, but doesn't fix race conditions. Need proper synchronization between animations and state.

**Q: Why so many useEffect hooks?**
A: Gradual feature additions without refactoring. Should be consolidated into state machine pattern.

**Q: Is this fixable without major rewrite?**
A: Yes! Critical fixes are localized changes. Phase 1 fixes can be implemented in ~2-3 days.

**Q: What's the biggest quick win?**
A: Fix #2 (trick completion race). Adding `pendingAnimations === 0` check prevents most disappearing cards.

**Q: Should we move to a different animation library?**
A: No. Moti is fine. Problem is architecture, not library.

---

## Contact & Contributions

When implementing fixes:
1. Create a feature branch: `fix/animation-race-conditions`
2. Implement fixes from Phase 1 first
3. Add tests for each fix
4. Update this documentation with results
5. Submit PR with performance metrics

Track progress in GitHub Issues:
- Issue #X: Card disappearing bug
- Issue #Y: Performance optimization
- Issue #Z: Timing race conditions

---

## Changelog

**2026-01-05:** Initial documentation created
- Analyzed all timing constraints
- Identified 4 race conditions
- Documented all performance bottlenecks
- Created implementation roadmap

**Next Update:** After Phase 1 implementation
- Document actual vs expected results
- Update metrics
- Add lessons learned

---

## Additional Resources

- [React Native Performance Docs](https://reactnative.dev/docs/performance)
- [Moti Animation Library](https://moti.fyi/)
- [React useEffect Best Practices](https://react.dev/reference/react/useEffect)
- [State Management Patterns](https://kentcdodds.com/blog/application-state-management-with-react)

---

**Status: Analysis Complete ✅ | Implementation Pending 🔄**

For questions or clarifications, refer to the specific analysis documents or create an issue.
