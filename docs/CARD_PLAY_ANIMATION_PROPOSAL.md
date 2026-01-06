# Card Play Animation Proposal

## Overview
This document proposes a smooth animation system for cards being played from a player's hand to the trick area (table center).

## 🆕 UPDATE: Moti Animation Library

After reviewing the **Moti** animation library (powered by Reanimated 3), it offers significant advantages over vanilla React Native Animated:

### Why Use Moti?
✅ **Simpler API**: Declarative animations with `from`, `animate`, and `exit` props  
✅ **60 FPS Performance**: Runs on native thread via Reanimated 3  
✅ **Built-in AnimatePresence**: Easy mount/unmount animations  
✅ **State-driven**: Animations update automatically when props change  
✅ **Less Boilerplate**: No manual `useRef` or `Animated.Value` setup needed  
✅ **Better Exit Animations**: First-class support for unmount transitions  

### Moti vs React Native Animated

**Moti Example** (Simple & Clean):
```tsx
<MotiView
  from={{ translateX: 0, translateY: 0, scale: 1 }}
  animate={{ translateX: 100, translateY: 50, scale: 0.9 }}
  exit={{ opacity: 0 }}
  transition={{ type: 'timing', duration: 500 }}
/>
```

**React Native Animated Equivalent** (Verbose):
```tsx
const translateX = useRef(new Animated.Value(0)).current;
const translateY = useRef(new Animated.Value(0)).current;
const scale = useRef(new Animated.Value(1)).current;

useEffect(() => {
  Animated.parallel([
    Animated.timing(translateX, { toValue: 100, duration: 500 }),
    Animated.timing(translateY, { toValue: 50, duration: 500 }),
    Animated.timing(scale, { toValue: 0.9, duration: 500 }),
  ]).start();
}, []);
```

### Installation Required
```bash
npm install moti
# or
yarn add moti
```

**Note**: Moti requires `react-native-reanimated` (likely already in your project for Expo 50).

## Current State Analysis

### What Exists Now
1. **State Structure**: `playedCardAnimations` object exists in `GameReducer.js` but always has values `{x: 0, y: 0}`
2. **Card Rendering**: Cards appear instantly in `TrickArea` when played
3. **Hand Updates**: Cards are removed from hand immediately when `PLAY_CARD` action dispatches
4. **TrickArea Positioning**: Cards are positioned at fixed offsets based on player index

### Current Flow
```
User selects card → PLAY_CARD dispatched → Card removed from hand → Card appears in TrickArea
```

---

## Proposed Animation System

### Animation Goals
1. **Smooth trajectory**: Card travels from hand position to table position
2. **Natural timing**: 400-600ms duration for smooth but not sluggish feel
3. **Stagger support**: Multiple cards can animate simultaneously without conflict
4. **Performance**: Use `useNativeDriver: true` for 60fps animations
5. **Visual feedback**: Card scales/rotates slightly during flight for depth effect

### Conceptual Flow
```
User selects card → Card stays visible in hand → Animation starts → 
Card flies to table → Animation completes → Card removed from hand → 
Card appears in TrickArea
```

---

## Implementation Approaches

### **Option A: Overlay Animation Layer (Recommended)**

#### Architecture
- Create a new `<AnimatingCard>` overlay component that sits above all players
- When card is played, spawn an animated card clone in the overlay
- Animate from hand position to table position
- Remove animated card after completion, reveal static card in TrickArea

#### Advantages
✅ Clean separation of concerns (animation vs. game logic)  
✅ Doesn't require complex hand rendering during animation  
✅ Easy to calculate screen positions using `measure()` or absolute positioning  
✅ Can animate cards from any player position easily  
✅ Works well with existing state management  

#### Disadvantages
⚠️ Need to calculate/store initial card positions  
⚠️ Requires additional overlay layer in component tree  

#### Implementation Steps
1. Create `<AnimatingCards>` overlay component in `GameScreen.js`
2. Add animation state: `animatingCards` array with `{card, fromPos, toPos, playerIndex, id}`
3. When `PLAY_CARD` dispatches, add entry to `animatingCards` before state update
4. Use `Animated.parallel()` to animate translateX, translateY, scale, rotate
5. On animation complete, remove from `animatingCards` and proceed with normal state update
6. Delay hand card removal until animation completes

---

### **Option B: In-Place Animation with Ghost Cards**

#### Architecture
- Keep card in hand during animation but make it "ghost" (semi-transparent)
- Create animated duplicate that flies to table
- When animation completes, remove from hand and show in TrickArea

#### Advantages
✅ Simpler state management  
✅ Original card position is already known  
✅ Less coordinate calculation needed  

#### Disadvantages
⚠️ "Ghost" card in hand might look odd  
⚠️ More complex hand rendering logic  
⚠️ Harder to handle fast successive plays  

---

### **Option C: Staged Reducer with Animation State**

#### Architecture
- Modify `PLAY_CARD` action to set `animating: true` flag
- Card stays in hand with special `isAnimating` flag
- After animation completes, dispatch `PLAY_CARD_COMPLETE` to actually remove card

#### Advantages
✅ Animation is part of game state machine  
✅ Clear tracking of animation status  
✅ Can prevent new plays during animation  

#### Disadvantages
⚠️ More complex reducer logic  
⚠️ Tighter coupling between animation and game logic  
⚠️ Need to handle animation interruptions/errors  

---

## Recommended Implementation: Option A (Overlay Layer)

### Detailed Design

#### 1. New State Structure
```javascript
// In GameScreen component state
const [animatingCards, setAnimatingCards] = useState([]);
// Each entry: { 
//   id: unique_id,
//   card: { suit, label },
//   playerIndex: 0-3,
//   fromPosition: { x, y, rotation },
//   toPosition: { x, y },
//   startTime: timestamp
// }
```

#### 2. Component Structure
```jsx
<View style={styles.container}>
  {/* Existing game components */}
  <TrickArea ... />
  <Player ... />
  
  {/* NEW: Animation overlay layer */}
  <AnimatingCardsOverlay cards={animatingCards} />
</View>
```

#### 3. AnimatingCardsOverlay Component (with Moti)
```javascript
import { AnimatePresence } from 'moti';

const AnimatingCardsOverlay = ({ cards }) => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <AnimatePresence>
        {cards.map(cardData => (
          <AnimatingCard 
            key={cardData.id}
            card={cardData.card}
            fromPosition={cardData.fromPosition}
            toPosition={cardData.toPosition}
            playerIndex={cardData.playerIndex}
            onComplete={() => handleAnimationComplete(cardData.id)}
          />
        ))}
      </AnimatePresence>
    </View>
  );
};
```

#### 4. AnimatingCard Component (with Moti) 🆕
```javascript
import { MotiView } from 'moti';

const AnimatingCard = ({ card, fromPosition, toPosition, onComplete }) => {
  const deltaX = toPosition.x - fromPosition.x;
  const deltaY = toPosition.y - fromPosition.y;

  return (
    <MotiView
      from={{
        translateX: 0,
        translateY: 0,
        scale: 1,
        rotate: `${fromPosition.rotation || 0}deg`,
      }}
      animate={{
        translateX: deltaX,
        translateY: deltaY,
        scale: [
          { value: 1.15, duration: 150 },
          { value: 0.95, duration: 350 },
        ],
        rotate: '0deg',
      }}
      exit={{
        opacity: 0,
        scale: 0.8,
      }}
      transition={{
        type: 'timing',
        duration: 500,
      }}
      onDidAnimate={(key, finished) => {
        if (finished && key === 'translateX') {
          onComplete();
        }
      }}
      style={{
        position: 'absolute',
        left: fromPosition.x,
        top: fromPosition.y,
        zIndex: 1000,
      }}
    >
      <Card card={card} cardWidth={80} />
    </MotiView>
  );
};
```

**Key Improvements with Moti:**
- ✅ No `useRef` or `useEffect` needed
- ✅ Declarative animation definitions
- ✅ Built-in sequence support (scale array)
- ✅ Automatic cleanup with `exit` prop
- ✅ `onDidAnimate` callback for completion handling
- ✅ Runs on native thread (60 FPS guaranteed)

#### 5. Position Calculation System

##### For Human Player (Bottom - P3, Index 2):
```javascript
// Fan layout: need to calculate position of specific card in fan
const calculateCardPositionInFan = (cardIndex, totalCards, screenWidth) => {
  // Use same math as Hand.js fan layout
  const cardWidth = 110;
  const visibleWidth = cardWidth * 0.3;
  const totalFanWidth = (totalCards - 1) * visibleWidth + cardWidth;
  const fanWidth = Math.max(totalFanWidth, cardWidth * 2);
  const fanHeight = cardWidth * 1.8;
  const R = cardWidth * 2.2;
  const θ_total = Math.min(50, totalCards * 5);
  const cx = fanWidth / 2;
  const cy = fanHeight + R * 0.6;
  
  const θ_i = (cardIndex - (totalCards - 1) / 2) * (θ_total / Math.max(totalCards - 1, 1));
  const θ_rad = (θ_i * Math.PI) / 180;
  
  const x_i = cx + R * Math.sin(θ_rad);
  const y_i = cy - R * Math.cos(θ_rad);
  
  return {
    x: (screenWidth / 2) + x_i - (cardWidth / 2), // Center + offset
    y: screenHeight - 120 + y_i, // Bottom area + offset
    rotation: θ_i,
  };
};
```

##### For AI Players (Top & Sides):
```javascript
// Simplified - from center of their hand area
const calculateAICardPosition = (playerIndex, screenWidth, screenHeight) => {
  const positions = {
    0: { x: screenWidth / 2, y: 150 }, // Top player
    1: { x: 50, y: screenHeight / 2 }, // Left player
    3: { x: screenWidth - 50, y: screenHeight / 2 }, // Right player
  };
  return { ...positions[playerIndex], rotation: 0 };
};
```

##### Table Center Position:
```javascript
const getTablePosition = (playerIndex, screenWidth, screenHeight) => {
  const centerX = screenWidth / 2;
  const centerY = screenHeight / 2;
  const cardSpacing = 35;
  
  const offsets = {
    0: { x: 0, y: -cardSpacing - 20 }, // Top
    1: { x: -cardSpacing, y: 0 },      // Left
    2: { x: 0, y: cardSpacing + 10 },  // Bottom
    3: { x: cardSpacing, y: 0 },       // Right
  };
  
  return {
    x: centerX + offsets[playerIndex].x - 30,
    y: centerY + offsets[playerIndex].y - 30,
  };
};
```

#### 6. Integration with Play Flow

##### Modified handleCardPress (human player):
```javascript
const handleCardPress = (card, playerIndex) => {
  if (commitInProgressRef.current) return;
  // ... existing guards ...
  
  // When card is selected and committed:
  if (selectedCard && gameState.playing.currentPlayer === humanIndex) {
    const validation = isLegalPlay(selectedCard, currentPlayer.hand, leadSuit);
    if (validation.valid) {
      // START ANIMATION
      const cardIndexInHand = currentPlayer.hand.findIndex(
        c => c.suit === selectedCard.suit && c.label === selectedCard.label
      );
      
      const fromPos = calculateCardPositionInFan(
        cardIndexInHand, 
        currentPlayer.hand.length,
        screenWidth
      );
      
      const toPos = getTablePosition(humanIndex, screenWidth, screenHeight);
      
      const animId = `${Date.now()}_${humanIndex}`;
      setAnimatingCards(prev => [...prev, {
        id: animId,
        card: selectedCard,
        playerIndex: humanIndex,
        fromPosition: fromPos,
        toPosition: toPos,
        startTime: Date.now(),
      }]);
      
      // Delay the actual state dispatch until animation completes
      setTimeout(() => {
        dispatch({ type: GAME_ACTIONS.PLAY_CARD, payload: { playerIndex: humanIndex, card: selectedCard } });
        setAnimatingCards(prev => prev.filter(c => c.id !== animId));
      }, 500); // Match animation duration
      
      setSelectedCard(null);
      commitInProgressRef.current = true;
    }
  }
};
```

##### For AI Players:
```javascript
// In AI move effect:
const card = chooseAiCardSmart(...);
if (card) {
  const fromPos = calculateAICardPosition(currentPlayer, screenWidth, screenHeight);
  const toPos = getTablePosition(currentPlayer, screenWidth, screenHeight);
  
  const animId = `${Date.now()}_${currentPlayer}`;
  setAnimatingCards(prev => [...prev, {
    id: animId,
    card,
    playerIndex: currentPlayer,
    fromPosition: fromPos,
    toPosition: toPos,
  }]);
  
  setTimeout(() => {
    dispatch({ type: GAME_ACTIONS.PLAY_CARD, payload: { playerIndex: currentPlayer, card } });
    setAnimatingCards(prev => prev.filter(c => c.id !== animId));
  }, 500);
}
```

---

## Animation Variations & Enhancements

### Basic Animation (Phase 1)
- Simple translate X/Y from hand to table
- Duration: 500ms
- Easing: `Easing.out(Easing.cubic)`

### Enhanced Animation (Phase 2)
- **Scale pulse**: Card grows slightly (1.15x) then shrinks (0.95x) during flight
- **Rotation normalization**: Fan cards rotate to 0° when flying to center
- **Arc trajectory**: Use bezier curve for more natural arc path
- **Drop shadow**: Increase shadow during flight for depth effect

### Advanced Effects (Phase 3)
- **Card flip**: Quick flip animation when card lands
- **Table impact**: Slight "bounce" or "settle" when card reaches table
- **Trail effect**: Subtle motion blur or particle trail
- **Sound effects**: "Whoosh" sound during flight, "tap" on landing

---

## Performance Considerations

### Optimization Strategies
1. **Use `useNativeDriver: true`**: Offload animations to native thread (60fps)
2. **Limit concurrent animations**: At most 4 cards (one per player) animating at once
3. **Avoid layout calculations during animation**: Pre-calculate all positions
4. **Clean up completed animations**: Remove from state immediately after completion
5. **Memoize position calculations**: Cache screen dimension-based calculations

### Testing Checklist
- [ ] Animation runs at 60fps on low-end devices
- [ ] No jank when multiple cards animate simultaneously
- [ ] Memory doesn't leak from animation refs
- [ ] Animation cancels properly if game state changes mid-flight
- [ ] Works correctly on different screen sizes/orientations

---

## Implementation Phases

### Phase 1: Basic Overlay Animation (Recommended First)
- Create `AnimatingCardsOverlay` and `AnimatingCard` components
- Implement simple translate animation for human player only
- Test and refine positioning calculations
- **Estimated effort**: 4-6 hours

### Phase 2: All Players + Enhanced Effects
- Add animations for AI players (top/sides)
- Add scale and rotation effects
- Refine timing and easing curves
- **Estimated effort**: 3-4 hours

### Phase 3: Polish & Advanced Features
- Add arc trajectories
- Implement bounce/settle effects
- Add sound effects (if desired)
- Performance optimization pass
- **Estimated effort**: 2-3 hours

---

### Alternative: Quick Win Approach with Moti

If full overlay system is too complex, here's a **super simple** approach using Moti:

### Simple Fade + Scale Animation (Moti Version)
Just wrap the TrickArea cards with AnimatePresence and add animations:

```javascript
// In TrickArea.js
import { MotiView } from 'moti';
import { AnimatePresence } from 'moti';

const TrickArea = ({ trickCards, ... }) => {
  return (
    <View style={styles.container}>
      <View style={styles.centerTable}>
        {/* ... existing code ... */}
      </View>

      <AnimatePresence>
        {trickCards.map((trickCard, index) => {
          const position = getCardPosition(trickCard.playerIndex);
          
          return (
            <MotiView
              key={trickCard.id}
              from={{
                opacity: 0,
                scale: 0.5,
                translateY: -50, // Drop from above
              }}
              animate={{
                opacity: 1,
                scale: 1,
                translateY: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
              }}
              transition={{
                type: 'spring',
                damping: 15,
              }}
              style={[styles.playedCard, position]}
            >
              <Card card={trickCard.card} disabled={true} cardWidth={60} />
              {/* Player indicator */}
              <View style={styles.cardPlayerIndicator}>
                <Text style={styles.cardPlayerText}>P{trickCard.playerIndex + 1}</Text>
              </View>
            </MotiView>
          );
        })}
      </AnimatePresence>
    </View>
  );
};
```

**Pros**: 
- ✅ Only ~30 minutes implementation  
- ✅ Looks polished with spring animation  
- ✅ No new components needed  
- ✅ Works immediately for all players  

**Cons**: 
- ⚠️ No "flying from hand" trajectory
- ⚠️ Cards appear to drop into place rather than travel

---

## Files to Modify

### New Files (Full Overlay Approach)
- `components/AnimatingCardsOverlay.js` (new) - Overlay container with AnimatePresence
- `components/AnimatingCard.js` (new) - Individual card animation with MotiView
- `utils/cardAnimationHelpers.js` (new) - Position calculation utilities

### Modified Files (Full Overlay Approach)
- `screens/GameScreen.js` - Add animation state and integration
- `package.json` - Add `moti` dependency

### Modified Files (Quick Win Approach)
- `components/TrickArea.js` - Wrap cards with MotiView and AnimatePresence
- `package.json` - Add `moti` dependency

### No Changes Needed
- `utils/state/GameReducer.js` - Keep game logic separate (both approaches)
- `components/Hand.js` - No changes needed (both approaches)
- `components/Card.js` - Works as-is (both approaches)

---

## Decision Points

Before implementing, consider:

1. **Animation complexity**: Start with Phase 1 or go straight to Phase 2?
2. **All players or human only**: Animate AI cards or just human for now?
3. **Sound effects**: Include audio or visual only?
4. **Performance target**: What's the minimum device spec to support?

---

## Summary & Recommendation

### 🎯 Updated Recommendation with Moti

**Two Clear Paths Forward:**

#### Path 1: Quick Win (Recommended to Start) ⚡
**Approach**: Modify `TrickArea.js` with MotiView animations  
**Effort**: 30 minutes - 1 hour  
**Result**: Cards animate into place with scale/fade/drop effect  
**Best for**: Getting immediate visual improvement, testing if you like animations  

**Implementation:**
```bash
npm install moti
# Then modify TrickArea.js as shown in "Quick Win Approach" section
```

#### Path 2: Full Overlay System (Maximum Polish) 🌟
**Approach**: Option A - Overlay Animation Layer with Moti  
**Effort**: 4-6 hours (Phase 1), 6-8 hours total with all players  
**Result**: Cards fly from hand position to table with arc trajectory  
**Best for**: Professional, polished game feel with true "card flight" animation  

**Key Advantages with Moti:**
- ✅ **50% less code** than vanilla React Native Animated
- ✅ **60 FPS guaranteed** via Reanimated 3
- ✅ **Cleaner API** - declarative instead of imperative
- ✅ **Built-in AnimatePresence** - no manual mount/unmount handling
- ✅ **State-driven** - animations update when props change
- ✅ **Better DX** - easier to debug and maintain

### Revised Effort Estimates with Moti:

| Approach | Original Estimate | With Moti | Savings |
|----------|-------------------|-----------|---------|
| Quick Win | 1 hour | 30 min | 50% |
| Phase 1 (Overlay - Human only) | 4-6 hours | 3-4 hours | 33% |
| Phase 2 (All players) | +3-4 hours | +2-3 hours | 25% |
| Phase 3 (Polish) | +2-3 hours | +1-2 hours | 40% |

### Recommended Implementation Order:

1. **Start with Quick Win** (30 min)
   - Install Moti
   - Update TrickArea.js
   - Test and validate the concept
   
2. **If satisfied, upgrade to Full Overlay** (3-4 hours)
   - Create AnimatingCard component with MotiView
   - Add position calculation helpers
   - Integrate with GameScreen play flow
   
3. **Extend to all players** (+2-3 hours)
   - Add AI player position calculations
   - Test with different screen sizes
   
4. **Polish** (+1-2 hours optional)
   - Fine-tune timing curves
   - Add sound effects
   - Optimize performance

**Next Steps**:
1. ✅ Install Moti: `npm install moti`
2. ✅ Start with Quick Win approach in TrickArea.js
3. ✅ Test on device to validate feel and performance
4. ✅ Decide if upgrading to Full Overlay is worth the effort
5. ✅ Implement chosen approach incrementally
