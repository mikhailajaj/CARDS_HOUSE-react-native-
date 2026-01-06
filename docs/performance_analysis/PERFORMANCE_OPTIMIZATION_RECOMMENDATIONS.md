# Performance Optimization Recommendations

Detailed actionable recommendations to fix timing issues and improve performance.

---

## Critical Fixes (Must Implement)

### 1. Fix Card Disappearing During Animation

**Problem:** Cards removed from hand state before animation completes (500ms gap).

**Solution A: Animation-Aware State Management (Recommended)**

```javascript
// In GameScreen.js, modify handleCardPress and AI play logic

// Add animation tracking state
const [cardsInAnimation, setCardsInAnimation] = useState(new Set());

// Modified trigger function
const triggerCardAnimation = useCallback((playerIndex, card, cardIndexInHand) => {
  const animationId = generateAnimationId();
  const cardKey = `${card.suit}-${card.label}`;
  
  // Mark card as animating (don't remove from hand yet!)
  setCardsInAnimation(prev => new Set(prev).add(cardKey));
  
  // ... existing animation setup ...
  
  return animationId;
}, [gameState.players, screenDimensions]);

// Modified completion handler
const handleAnimationComplete = useCallback((animationId) => {
  const completedAnimation = animatingCards.find(anim => anim.id === animationId);
  
  if (completedAnimation) {
    const cardKey = `${completedAnimation.card.suit}-${completedAnimation.card.label}`;
    
    // Remove animation
    setAnimatingCards(prev => prev.filter(anim => anim.id !== animationId));
    
    // Remove from animation tracking
    setCardsInAnimation(prev => {
      const next = new Set(prev);
      next.delete(cardKey);
      return next;
    });
    
    // NOW safe to update game state
    dispatch({ 
      type: GAME_ACTIONS.ADD_CARD_TO_TRICK_AREA, 
      payload: { 
        card: completedAnimation.card, 
        playerIndex: completedAnimation.playerIndex 
      } 
    });
  }
}, [animatingCards]);

// Modify Hand component to show animating cards with opacity
// In Hand.js
<View style={{ 
  opacity: cardsInAnimation.has(`${card.suit}-${card.label}`) ? 0.5 : 1 
}}>
  <Card card={card} onPress={() => onCardPress(card)} />
</View>
```

**Solution B: Defer State Update (Alternative)**

```javascript
// Modify PLAY_CARD to NOT remove card from hand immediately
// Instead, mark it as "played" and filter in render

// In GameReducer.js
case GAME_ACTIONS.PLAY_CARD:
  // Don't remove from hand yet!
  const updatedPlayers = state.players.map(p => 
    p.id === playerIndex 
      ? { 
          ...p, 
          playedCard: card, // Mark as played
          // hand stays unchanged for now
        }
      : p
  );
  
  return {
    ...state,
    players: updatedPlayers,
    // ... rest of logic
  };

// In ADD_CARD_TO_TRICK_AREA, THEN remove from hand
case GAME_ACTIONS.ADD_CARD_TO_TRICK_AREA:
  return {
    ...state,
    players: state.players.map(p => 
      p.id === action.payload.playerIndex
        ? {
            ...p,
            hand: p.hand.filter(c => 
              !(c.suit === action.payload.card.suit && 
                c.label === action.payload.card.label)
            ),
            playedCard: null
          }
        : p
    ),
    animations: {
      ...state.animations,
      trickAreaCards: [...state.animations.trickAreaCards, {
        card: action.payload.card,
        playerIndex: action.payload.playerIndex,
        id: Date.now() + Math.random()
      }]
    }
  };
```

**Impact:** Eliminates 500ms invisibility window. **Critical for user experience.**

---

### 2. Fix Trick Completion Race Condition

**Problem:** ADVANCE_AFTER_TRICK clears table at same time 4th card animation completes.

**Solution: Add Animation Completion Counter**

```javascript
// In GameScreen.js
const [pendingAnimations, setPendingAnimations] = useState(0);

// Modified trigger function
const triggerCardAnimation = useCallback((playerIndex, card, cardIndexInHand) => {
  setPendingAnimations(prev => prev + 1); // Increment
  
  const animationId = generateAnimationId();
  // ... existing logic ...
  
  return animationId;
}, [gameState.players, screenDimensions]);

// Modified completion handler
const handleAnimationComplete = useCallback((animationId) => {
  // ... existing logic ...
  
  setPendingAnimations(prev => prev - 1); // Decrement
}, [animatingCards]);

// Modified advance effect - WAIT for animations
useEffect(() => {
  if (
    gameState.phase === GAME_PHASES.PLAYING &&
    gameState.playing.settling &&
    gameState.playing.currentTrick.length === 4 &&
    gameState.playing.pendingAdvance &&
    pendingAnimations === 0  // ← CRITICAL: Wait for all animations!
  ) {
    const { winner } = gameState.playing.pendingAdvance;
    const t = setTimeout(() => {
      dispatch({ type: GAME_ACTIONS.ADVANCE_AFTER_TRICK, payload: { winner } });
    }, 500);
    return () => clearTimeout(t);
  }
}, [
  gameState.phase, 
  gameState.playing.settling, 
  gameState.playing.currentTrick.length, 
  gameState.playing.pendingAdvance,
  pendingAnimations  // ← Add to dependencies
]);
```

**Impact:** Ensures table only clears after all animations complete. **Fixes disappearing 4th card.**

---

### 3. Prevent Overlapping AI Animations

**Problem:** AI plays every 800ms, animations take 500ms, can overlap.

**Solution: Animation Queue System**

```javascript
// In GameScreen.js
const animationQueueRef = useRef([]);
const isProcessingQueueRef = useRef(false);

const queueCardPlay = useCallback((playerIndex, card) => {
  animationQueueRef.current.push({ playerIndex, card });
  processQueue();
}, []);

const processQueue = useCallback(async () => {
  if (isProcessingQueueRef.current) return;
  if (animationQueueRef.current.length === 0) return;
  
  isProcessingQueueRef.current = true;
  const { playerIndex, card } = animationQueueRef.current.shift();
  
  // Find card index
  const player = gameState.players[playerIndex];
  const cardIndexInHand = player.hand.findIndex(
    c => c.suit === card.suit && c.label === card.label
  );
  
  // Trigger animation
  const animId = triggerCardAnimation(playerIndex, card, cardIndexInHand);
  
  // Dispatch state update
  dispatch({ type: GAME_ACTIONS.PLAY_CARD, payload: { playerIndex, card } });
  
  // Wait for animation to complete before processing next
  await new Promise(resolve => {
    const checkComplete = setInterval(() => {
      if (!animatingCards.some(a => a.id === animId)) {
        clearInterval(checkComplete);
        resolve();
      }
    }, 50);
  });
  
  isProcessingQueueRef.current = false;
  processQueue(); // Process next in queue
}, [gameState.players, triggerCardAnimation, animatingCards]);

// Modify AI effect to use queue instead of direct play
useEffect(() => {
  // ... AI logic ...
  
  if (card) {
    queueCardPlay(currentPlayer, card); // ← Use queue
  }
  
  // ... rest
}, [gameState.phase, gameState.playing.currentPlayer, queueCardPlay]);
```

**Impact:** Serializes AI moves, prevents visual conflicts. **Improves AI gameplay smoothness.**

---

### 4. Consolidate useEffect Hooks

**Problem:** 11 separate useEffect hooks can fire simultaneously, creating race conditions.

**Solution: State Machine Pattern**

```javascript
// Create centralized game flow controller
useEffect(() => {
  const phase = gameState.phase;
  const currentPlayer = gameState.playing.currentPlayer;
  const current = gameState.players[currentPlayer];
  
  // Single source of truth for game flow
  if (phase === GAME_PHASES.BIDDING) {
    handleBiddingPhase();
  } else if (phase === GAME_PHASES.PLAYING) {
    if (gameState.playing.settling && gameState.playing.pendingAdvance) {
      handleTrickCompletion();
    } else if (current && !current.isHuman && !aiGuardRef.current) {
      handleAiTurn();
    } else if (current && current.isHuman) {
      handleHumanTurn();
    }
  }
}, [
  gameState.phase,
  gameState.playing.currentPlayer,
  gameState.playing.settling,
  gameState.bidding.currentBidder,
  // ... consolidated dependencies
]);

// Separate handler functions
const handleBiddingPhase = useCallback(() => {
  // All bidding logic in one place
}, []);

const handleAiTurn = useCallback(() => {
  // All AI logic in one place
}, []);

const handleHumanTurn = useCallback(() => {
  // All human turn logic in one place
}, []);

const handleTrickCompletion = useCallback(() => {
  // All trick completion logic in one place
}, []);
```

**Impact:** Predictable execution order, eliminates race conditions. **Major stability improvement.**

---

## High Priority Optimizations

### 5. Optimize AI Logic with Caching

**Problem:** `chooseAiCardSmart()` recalculates suit groups every time (5-50ms × 39 times/round).

**Solution: Precompute Hand Analysis**

```javascript
// In PlayEngine.js, add caching
const handAnalysisCache = new WeakMap();

function analyzeHand(hand) {
  if (handAnalysisCache.has(hand)) {
    return handAnalysisCache.get(hand);
  }
  
  const analysis = {
    suitGroups: hand.reduce((acc, c) => {
      acc[c.suit] = acc[c.suit] || [];
      acc[c.suit].push(c);
      return acc;
    }, {}),
    sortedByValue: [...hand].sort((a, b) => getCardValue(b) - getCardValue(a)),
    // ... other precomputed data
  };
  
  handAnalysisCache.set(hand, analysis);
  return analysis;
}

export function chooseAiCardSmart({ hand, trick, leadSuit, trumpSuit, playerIndex, players }) {
  const analysis = analyzeHand(hand); // ← Use cached analysis
  const suitGroups = analysis.suitGroups;
  
  // Rest of logic uses precomputed data
  // ...
}
```

**Alternative: Compute at Deal Time**

```javascript
// In GameReducer.js, when dealing cards
case GAME_ACTIONS.CARDS_DEALT:
  return {
    ...state,
    players: action.payload.players.map(player => ({
      ...player,
      handAnalysis: analyzeHandForAI(player.hand) // ← Precompute
    })),
    // ...
  };
```

**Impact:** Reduces AI computation by ~50-70%. **Faster AI moves, less lag.**

---

### 6. Memoize Position Calculations

**Problem:** Card position calculated on every animation trigger.

**Solution: Precompute Position Lookup Tables**

```javascript
// In cardAnimationHelpers.js
const positionCache = new Map();

function getCacheKey(playerIndex, cardIndex, totalCards, screenWidth, screenHeight) {
  return `${playerIndex}-${cardIndex}-${totalCards}-${screenWidth}-${screenHeight}`;
}

export const getCardPositionInHand = (playerIndex, cardIndex, totalCards, screenDimensions) => {
  const { width, height } = screenDimensions;
  const key = getCacheKey(playerIndex, cardIndex, totalCards, width, height);
  
  if (positionCache.has(key)) {
    return positionCache.get(key);
  }
  
  let position;
  switch (playerIndex) {
    case 0: position = getTopPlayerCardPosition(cardIndex, totalCards, width, height); break;
    case 1: position = getLeftPlayerCardPosition(cardIndex, totalCards, width, height); break;
    case 2: position = getBottomPlayerCardPosition(cardIndex, totalCards, width, height); break;
    case 3: position = getRightPlayerCardPosition(cardIndex, totalCards, width, height); break;
    default: position = { x: width / 2, y: height / 2, rotation: 0 };
  }
  
  positionCache.set(key, position);
  return position;
};

// Clear cache on screen resize
export const clearPositionCache = () => positionCache.clear();
```

**Impact:** Eliminates redundant trigonometry calculations. **Minor improvement (~5-10ms saved per animation).**

---

### 7. Optimize React Rendering with Memoization

**Problem:** GameScreen re-renders 100-200 times per round, all children re-render.

**Solution: React.memo and useMemo**

```javascript
// In Player.js
import React, { memo } from 'react';

const Player = memo(({ playerData, onCardPress, canPlayCard, customCardWidth, fanLayout, selectedCard }) => {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison for expensive props
  return (
    prevProps.playerData.hand.length === nextProps.playerData.hand.length &&
    prevProps.selectedCard === nextProps.selectedCard &&
    prevProps.customCardWidth === nextProps.customCardWidth
  );
});

export default Player;

// In Hand.js
import React, { memo, useMemo } from 'react';

const Hand = memo(({ cards, onCardPress, canPlayCard, customCardWidth, fanLayout, selectedCard }) => {
  // Memoize expensive calculations
  const fanPositions = useMemo(() => {
    if (!fanLayout) return null;
    
    const N = cards.length;
    const positions = [];
    // ... expensive position calculations ...
    return positions;
  }, [cards.length, fanLayout, customCardWidth]);
  
  // Rest of component
});

// In TrickArea.js
const TrickArea = memo(({ trickCards, playedCardAnimations, leadSuit, currentTrick, trickNumber, totalTricks }) => {
  // Component logic
}, (prevProps, nextProps) => {
  return (
    prevProps.trickCards.length === nextProps.trickCards.length &&
    prevProps.trickNumber === nextProps.trickNumber
  );
});
```

**Impact:** Reduces unnecessary re-renders by 60-80%. **Significant performance improvement.**

---

### 8. Limit State Growth

**Problem:** `scoreHistory` array grows unbounded, deep state nesting causes expensive spreads.

**Solution A: Cap History Size**

```javascript
// In GameReducer.js
case GAME_ACTIONS.PLAY_CARD:
  // When adding to score history
  const newHistory = [...state.scoreHistory, historyEntry];
  
  // Keep only last 20 rounds
  const cappedHistory = newHistory.slice(-20);
  
  nextState = {
    ...nextState,
    scoreHistory: cappedHistory
  };
```

**Solution B: Flatten State Structure**

```javascript
// Instead of nested animations object:
animations: {
  trickAreaCards: [...],
  playedCardAnimations: {...}
}

// Use separate top-level keys:
trickAreaCards: [...],
playedCardAnimations: {...}

// Reduces spread depth, faster updates
```

**Impact:** Prevents memory growth, faster state updates. **Long-term stability improvement.**

---

## Medium Priority Optimizations

### 9. Reduce Timeout Durations (UX Improvement)

**Problem:** Games feel slow due to artificial delays.

**Current Timings:**
- AI Move: 800ms
- AI Bid: 1500ms
- Trump Select: 2000ms
- Trick Settle: 500ms

**Recommended Timings:**
- AI Move: **400ms** (50% faster)
- AI Bid: **800ms** (47% faster)
- Trump Select: **1000ms** (50% faster)
- Trick Settle: **300ms** (40% faster)

**Configuration:**

```javascript
// Create timing config file
// constants/timings.js
export const TIMING_CONFIG = {
  AI_MOVE_DELAY: 400,
  AI_BID_DELAY: 800,
  TRUMP_SELECT_DELAY: 1000,
  TRICK_SETTLE_DELAY: 300,
  ANIMATION_DURATION: 400, // Also reduce animation time
  HUMAN_TIMEOUT: 15000,
};

// Use throughout codebase
import { TIMING_CONFIG } from '../constants/timings';

setTimeout(() => {
  // AI logic
}, TIMING_CONFIG.AI_MOVE_DELAY);
```

**Impact:** Reduces full AI trick time from 3.7s to 1.9s (49% faster). **Major UX improvement.**

---

### 10. Add Animation Speed Setting

**Problem:** Users may want faster/slower gameplay.

**Solution: User-Configurable Speed**

```javascript
// In SettingsContext.js
const defaultSettings = {
  // ... existing settings
  gameSpeed: 'normal', // 'fast', 'normal', 'slow'
};

// In GameScreen.js
const getTimingMultiplier = (speed) => {
  switch (speed) {
    case 'fast': return 0.5;
    case 'slow': return 1.5;
    default: return 1.0;
  }
};

const multiplier = getTimingMultiplier(settings.gameSpeed);

// Apply to all timeouts
setTimeout(() => {
  // ...
}, TIMING_CONFIG.AI_MOVE_DELAY * multiplier);

// And animation duration
transition={{
  type: 'timing',
  duration: 500 * multiplier,
}}
```

**Impact:** User control over game pace. **Improved user satisfaction.**

---

### 11. Optimize determineTrickWinner

**Problem:** Called 200-400 times per round in AI simulations.

**Solution: Early Exit Optimization**

```javascript
// In gameLogic.js
export function determineTrickWinner(trickCards, trumpSuit, leadSuit) {
  if (!trickCards || trickCards.length === 0) return null;
  
  let winningIndex = 0;
  let winningCard = trickCards[0];
  let winningValue = getCardValue(winningCard);
  let winningIsTrump = winningCard.suit === trumpSuit;
  
  for (let i = 1; i < trickCards.length; i++) {
    const currentCard = trickCards[i];
    const currentValue = getCardValue(currentCard);
    const currentIsTrump = currentCard.suit === trumpSuit;
    
    // Early exit: trump beats non-trump
    if (currentIsTrump && !winningIsTrump) {
      winningIndex = i;
      winningCard = currentCard;
      winningValue = currentValue;
      winningIsTrump = true;
      continue;
    }
    
    // Early exit: non-trump can't beat trump
    if (!currentIsTrump && winningIsTrump) continue;
    
    // Both trump or both non-trump: compare values
    if (currentIsTrump && winningIsTrump) {
      if (currentValue > winningValue) {
        winningIndex = i;
        winningCard = currentCard;
        winningValue = currentValue;
      }
      continue;
    }
    
    // Both non-trump: only lead suit matters
    const currentIsLeadSuit = currentCard.suit === leadSuit;
    const winningIsLeadSuit = winningCard.suit === leadSuit;
    
    if (currentIsLeadSuit && winningIsLeadSuit) {
      if (currentValue > winningValue) {
        winningIndex = i;
        winningCard = currentCard;
        winningValue = currentValue;
      }
    } else if (currentIsLeadSuit && !winningIsLeadSuit) {
      winningIndex = i;
      winningCard = currentCard;
      winningValue = currentValue;
      winningIsTrump = false; // Update tracking
    }
  }
  
  return winningIndex;
}
```

**Impact:** Micro-optimization, saves ~10-20% on frequent calls. **Cumulative benefit over many calls.**

---

## Low Priority / Future Enhancements

### 12. Web Worker for AI Computation

**Problem:** AI logic blocks UI thread.

**Solution: Offload to Worker (Web Only)**

```javascript
// ai-worker.js
self.addEventListener('message', (e) => {
  const { hand, trick, leadSuit, trumpSuit, playerIndex, players } = e.data;
  
  // Run heavy AI logic
  const card = chooseAiCardSmart({ hand, trick, leadSuit, trumpSuit, playerIndex, players });
  
  self.postMessage({ card });
});

// In GameScreen.js (web platform only)
const aiWorker = new Worker('./ai-worker.js');

aiWorker.onmessage = (e) => {
  const { card } = e.data;
  // Use result
};

// Dispatch work
aiWorker.postMessage({ hand, trick, leadSuit, trumpSuit, playerIndex, players });
```

**Note:** Not available on React Native, web only.

**Impact:** Non-blocking AI computation. **Web platform benefit only.**

---

### 13. Performance Monitoring Hooks

**Problem:** No visibility into performance issues in production.

**Solution: Add Telemetry**

```javascript
// utils/performanceMonitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = [];
  }
  
  startTimer(label) {
    return {
      label,
      start: performance.now(),
      end: () => {
        const duration = performance.now() - this.start;
        this.metrics.push({ label, duration, timestamp: Date.now() });
        
        if (duration > 16) { // > 1 frame
          console.warn(`Slow operation: ${label} took ${duration.toFixed(2)}ms`);
        }
      }
    };
  }
  
  getStats() {
    // Aggregate metrics
    const byLabel = {};
    this.metrics.forEach(m => {
      if (!byLabel[m.label]) byLabel[m.label] = [];
      byLabel[m.label].push(m.duration);
    });
    
    return Object.entries(byLabel).map(([label, durations]) => ({
      label,
      count: durations.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      max: Math.max(...durations),
      min: Math.min(...durations),
    }));
  }
}

export const perfMonitor = new PerformanceMonitor();

// Usage in GameScreen.js
const timer = perfMonitor.startTimer('AI Move');
const card = chooseAiCardSmart({ ... });
timer.end();
```

**Impact:** Visibility into bottlenecks. **Development/debugging tool.**

---

### 14. Animation Frame Budget Management

**Problem:** Multiple animations running simultaneously can drop frames.

**Solution: Stagger Animation Starts**

```javascript
// In AnimatingCardsOverlay.js
const AnimatingCardsOverlay = ({ animatingCards = [], onAnimationComplete }) => {
  const [visibleCards, setVisibleCards] = useState([]);
  
  useEffect(() => {
    // Stagger animation starts by 50ms each
    animatingCards.forEach((card, index) => {
      setTimeout(() => {
        setVisibleCards(prev => [...prev, card]);
      }, index * 50);
    });
  }, [animatingCards]);
  
  return (
    <View style={styles.overlay} pointerEvents="none">
      <AnimatePresence>
        {visibleCards.map((cardData) => (
          <AnimatingCard key={cardData.id} {...cardData} />
        ))}
      </AnimatePresence>
    </View>
  );
};
```

**Impact:** Smoother animations, fewer frame drops. **Visual quality improvement.**

---

## Testing Recommendations

### Unit Tests for Timing Logic

```javascript
// __tests__/unit/animationSync.test.js
describe('Animation Synchronization', () => {
  test('should not remove card from hand until animation completes', async () => {
    const { gameState, triggerCardAnimation } = setupGame();
    const card = gameState.players[0].hand[0];
    
    triggerCardAnimation(0, card, 0);
    
    // Card should still be in hand during animation
    expect(gameState.players[0].hand).toContainEqual(card);
    
    // Wait for animation
    await waitFor(() => expect(animatingCards.length).toBe(0));
    
    // Now card should be removed
    expect(gameState.players[0].hand).not.toContainEqual(card);
  });
  
  test('should wait for all animations before trick advance', async () => {
    // Play 4 cards rapidly
    // Assert table doesn't clear until all 4 animations complete
  });
});
```

### Performance Benchmarks

```javascript
// __tests__/performance/ai-logic.bench.js
describe('AI Performance', () => {
  test('chooseAiCardSmart should complete within 50ms', () => {
    const hand = generateFullHand();
    const start = performance.now();
    
    chooseAiCardSmart({ hand, trick: [], leadSuit: null, trumpSuit: 'Hearts', playerIndex: 0, players: [] });
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(50);
  });
  
  test('full trick should complete within 5 seconds', async () => {
    // Run full trick simulation
    // Measure total time
  });
});
```

---

## Implementation Priority

### Phase 1 (Week 1) - Critical Fixes
- [ ] Fix #1: Animation-aware state management
- [ ] Fix #2: Trick completion race condition
- [ ] Fix #3: Animation queue system
- [ ] Testing for above fixes

### Phase 2 (Week 2) - High Priority Optimizations
- [ ] Fix #4: Consolidate useEffect hooks
- [ ] Opt #5: Cache AI logic
- [ ] Opt #7: React.memo for components
- [ ] Opt #8: Limit state growth

### Phase 3 (Week 3) - Medium Priority & UX
- [ ] Opt #9: Reduce timeout durations
- [ ] Opt #10: Animation speed setting
- [ ] Opt #6: Memoize positions
- [ ] Opt #11: Optimize determineTrickWinner

### Phase 4 (Ongoing) - Polish & Monitoring
- [ ] Opt #13: Performance monitoring
- [ ] Opt #14: Animation frame management
- [ ] Comprehensive testing
- [ ] User testing and feedback

---

## Expected Results

### Before Optimizations
- Card invisibility: 500ms gaps
- Trick completion: 4th card often disappears
- AI trick time: 3.7 seconds
- Round time: ~75 seconds
- Frame drops: Frequent during rapid play
- Race conditions: Multiple timing conflicts

### After Phase 1
- Card invisibility: **Eliminated**
- Trick completion: **Always shows 4 cards**
- AI trick time: 3.7 seconds (unchanged)
- Round time: ~75 seconds (unchanged)
- Frame drops: Reduced
- Race conditions: **Major conflicts resolved**

### After Phase 3
- Card invisibility: Eliminated
- Trick completion: Reliable
- AI trick time: **1.9 seconds** (49% faster)
- Round time: **~40 seconds** (47% faster)
- Frame drops: **Minimal**
- Race conditions: Fully resolved
- User control: Speed settings available

---

## Measuring Success

### Key Metrics to Track

1. **Animation Completion Rate**: Should be 100%
2. **Cards Displayed Correctly**: No disappearing cards
3. **Frame Rate**: Maintain 60fps during gameplay
4. **AI Response Time**: Average <50ms per decision
5. **User Satisfaction**: Gameplay feels smooth and responsive

### Monitoring in Production

```javascript
// Add to GameScreen.js
useEffect(() => {
  const metrics = {
    animationFailures: 0,
    avgAiTime: 0,
    frameDrops: 0,
  };
  
  // Log metrics on unmount or round end
  return () => {
    if (__DEV__) {
      console.log('Performance Metrics:', metrics);
    }
  };
}, []);
```

---

**End of Recommendations**
