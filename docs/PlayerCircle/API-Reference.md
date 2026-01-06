# API Reference - PlayerCircle Component

## Component Signature

```typescript
interface PlayerCircleProps {
  player: PlayerObject;
  playerIndex: number;
  isCurrentPlayer: boolean;
  gamePhase: string; // expect 'playing' when the turn timer should run
  onTimeUp: (playerIndex: number) => void;
  maxDuration?: number;
  onTimerStart?: (playerIndex: number) => void;
  onTimerStop?: (playerIndex: number) => void;
  size?: number;
  strokeWidth?: number;
}

interface PlayerObject {
  name?: string;
  isHuman?: boolean;
  hand?: any[];
}

interface PlayerCircleRef {
  triggerTimer: () => void;
  stopTimer: () => void;
  isTimerActive: boolean;
  timeLeft: number;
}
```

## Props Reference

### Required Props

#### `player: PlayerObject`
The player data object containing player information.

```javascript
const player = {
  name: "John Doe",
  isHuman: true,
  hand: [1, 2, 3, 4, 5]
};
```

#### `playerIndex: number`
Zero-based index identifying the player.

#### `isCurrentPlayer: boolean`
Indicates if this player is currently active.

#### `gamePhase: string`
Current phase of the game.
Use `'playing'` or your `GAME_PHASES.PLAYING` constant.

#### `onTimeUp: (playerIndex: number) => void`
Callback function called when the timer expires.

### Optional Props

#### `maxDuration?: number = 30`
Timer duration in seconds.

#### `onTimerStart?: (playerIndex: number) => void`
Callback when timer starts.

#### `onTimerStop?: (playerIndex: number) => void`
Callback when timer stops. When the countdown naturally expires, callbacks fire in this order:
1) internal stop/reset
2) `onTimeUp(playerIndex)`
3) `onTimerStop(playerIndex)`

#### `size?: number = 60`
Component size in pixels.

#### `strokeWidth?: number = 10`
Progress ring stroke width in pixels.

## Ref Methods

### `triggerTimer(): void`
Manually starts the countdown timer (only if `player.isHuman` and `gamePhase === 'playing'`).

### `stopTimer(): void`
Manually stops the countdown timer and resets animations.

### `isTimerActive: boolean`
Read-only property indicating timer state.

### `timeLeft: number`
Read-only property showing remaining seconds.

## Animation States

### Timer Inactive
- No progress ring visible
- No pump animation
- Normal circle styling

### Timer Active (Human player only)
- Progress ring visible and shrinking
- Pump animation running (scale 1.0 ↔ 1.15)
- Enhanced circle styling with glow

### Timer Urgent (≤10 seconds)
- Player initials turn red and slightly enlarge

Note: numeric countdown badge is disabled by default.

## Color Progression

The progress ring color changes based on remaining time:

| Progress | Color | Hex Code | Description |
|----------|-------|----------|-------------|
| 100-70% | Green | `#38a169` | Safe time |
| 70-30% | Yellow | `#d69e2e` | Caution |
| 30-0% | Orange | `#f56500` | Warning |
| 0% | Red | `#e53e3e` | Critical |

## Event Flow

### Automatic Timer Start
1. Component receives `player.isHuman === true`, `isCurrentPlayer === true`, and `gamePhase === 'playing'`
2. `startTimer()` is called automatically
3. `onTimerStart(playerIndex)` callback is fired
4. Progress ring animation begins
5. Pump animation starts

### Timer Expiration
1. Countdown reaches 0 seconds (or animation completes)
2. Internal stop/reset runs
3. `onTimeUp(playerIndex)` callback is fired
4. `onTimerStop(playerIndex)` callback is fired

### Manual Timer Control
1. Call `triggerTimer()` via ref (same conditions as auto-start)
2. Same flow as automatic start
3. Call `stopTimer()` via ref
4. Same flow as automatic stop

## Performance Characteristics
- Progress Ring: 60fps using `strokeDashoffset` with `strokeDasharray="<C> <C>"`
- Pump Effect: 60fps using `transform: scale` with native driver
- Color Interpolation: Smooth transitions between color states
- Automatic cleanup of intervals and animations

## Error Handling

### Invalid Props
- Missing required props will cause runtime errors
- Null/undefined `player` object is handled gracefully (initials fallback)

### Ref Access Errors
- Accessing ref methods before component mount returns `undefined`
- Methods are safely callable with optional chaining

## Platform Support
- ✅ iOS (React Native)
- ✅ Android (React Native)
- ✅ Web (react-native-web with SVG support)

## Version History

### v1.1.0
- Human-only timer visualization
- Default thicker ring (`strokeWidth=10`)
- Numeric badge hidden by default
- Phase comparison expects `'playing'`
- Fixed `strokeDasharray` for proper ring animation

### v1.0.0
- Initial implementation with basic timer functionality
- SVG progress ring animation
- Pump animation effect
- Manual timer control via refs
- Player profile modal
