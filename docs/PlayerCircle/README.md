# PlayerCircle Component Documentation

## Overview

The `PlayerCircle` component is an animated player avatar with a countdown timer feature. It displays a circular player avatar with an animated disappearing border that acts as a visual countdown timer. When the timer expires, it can automatically trigger AI gameplay.

## Features

- ✅ Animated Countdown Ring: A progress ring that shrinks around the player circle
- ✅ Color-Coded Timer: Ring color changes from green → yellow → orange → red as time runs out
- ✅ Pump Animation: The circle pulses when the timer is active
- ✅ Auto-Play Trigger: Automatically calls a callback when time expires (perfect for AI auto-play)
- ✅ Manual Control: Programmatic start/stop timer control via refs
- ✅ Player Profile Modal: Tap to view player details
- ✅ Customizable: Adjustable size and ring thickness
- ✅ Human-Only Timer: The ring appears only for human players (no ring for AI turns)

Note: Numeric countdown badge (seconds) is not shown by default.

## Installation

Make sure you have the required dependency:

```bash
npm install react-native-svg
```

## Basic Usage

```jsx
import React from 'react';
import PlayerCircle from './components/PlayerCircle';

const GameComponent = () => {
  const player = {
    name: 'John Doe',
    isHuman: true,
    hand: [1, 2, 3, 4, 5]
  };

  const handleTimeUp = (playerIndex) => {
    console.log(`Player ${playerIndex} time is up! AI will play automatically`);
    // Implement your AI auto-play logic here
  };

  return (
    <PlayerCircle
      player={player}
      playerIndex={0}
      isCurrentPlayer={true}
      gamePhase="playing"
      maxDuration={30}
      onTimeUp={handleTimeUp}
    />
  );
};
```

## Props

| Prop | Type | Default | Required | Description |
|------|------|---------|----------|-------------|
| `player` | `Object` | - | ✅ | Player data object |
| `playerIndex` | `number` | - | ✅ | Index of the player (0-based) |
| `isCurrentPlayer` | `boolean` | - | ✅ | Whether this is the active player |
| `gamePhase` | `string` | - | ✅ | Current game phase (use `'playing'` or the `GAME_PHASES.PLAYING` constant) |
| `onTimeUp` | `function` | - | ✅ | Callback when timer expires |
| `maxDuration` | `number` | `30` | ❌ | Timer duration in seconds |
| `onTimerStart` | `function` | - | ❌ | Callback when timer starts |
| `onTimerStop` | `function` | - | ❌ | Callback when timer stops |
| `size` | `number` | `60` | ❌ | Size of the component in pixels |
| `strokeWidth` | `number` | `10` | ❌ | Width of the progress ring |

### Player Object Structure

```javascript
const player = {
  name: string,        // Player's display name
  isHuman: boolean,    // true for human players, false for AI
  hand: Array          // Array of cards (length shown in profile)
};
```

## Advanced Usage

### Manual Timer Control

```jsx
import React, { useRef } from 'react';

const GameComponent = () => {
  const playerCircleRef = useRef();

  const startTimer = () => {
    playerCircleRef.current?.triggerTimer();
  };

  const stopTimer = () => {
    playerCircleRef.current?.stopTimer();
  };

  const checkTimerStatus = () => {
    const isActive = playerCircleRef.current?.isTimerActive;
    const timeLeft = playerCircleRef.current?.timeLeft;
    console.log(`Timer active: ${isActive}, Time left: ${timeLeft}`);
  };

  return (
    <PlayerCircle
      ref={playerCircleRef}
      player={player}
      playerIndex={0}
      isCurrentPlayer={true}
      gamePhase="playing"
      maxDuration={45}
      onTimeUp={handleTimeUp}
      onTimerStart={(playerIndex) => {
        console.log(`Timer started for player ${playerIndex}`);
      }}
      onTimerStop={(playerIndex) => {
        console.log(`Timer stopped for player ${playerIndex}`);
      }}
    />
  );
};
```

### Custom Styling

```jsx
<PlayerCircle
  player={player}
  playerIndex={0}
  isCurrentPlayer={true}
  gamePhase="playing"
  maxDuration={60}
  size={80}           // Larger circle
  strokeWidth={12}    // Thicker progress ring
  onTimeUp={handleTimeUp}
/>
```

## Ref Methods

When using a ref, the following methods/properties are available:

| Method | Returns | Description |
|--------|---------|-------------|
| `triggerTimer()` | `void` | Manually start the timer (only works for human player) |
| `stopTimer()` | `void` | Manually stop the timer |
| `isTimerActive` | `boolean` | Current timer state |
| `timeLeft` | `number` | Remaining time in seconds |

## Callbacks

### onTimeUp(playerIndex)

Called when the countdown timer reaches zero. After this callback, `onTimerStop` is also fired.

```javascript
const handleTimeUp = (playerIndex) => {
  // Implement AI auto-play logic
  console.log(`Player ${playerIndex} time expired`);
};
```

### onTimerStart(playerIndex)

Called when the timer starts (optional).

### onTimerStop(playerIndex)

Called when the timer stops (optional). When the timer expires, the order is:
1) internal stop/reset
2) `onTimeUp(playerIndex)`
3) `onTimerStop(playerIndex)`

## Animation Details

### Progress Ring Animation
- Duration: Linear animation over `maxDuration` seconds
- Direction: Clockwise from top (12 o'clock position)
- Colors: Interpolated from green → yellow → orange → red
- Easing: Linear for consistent countdown feel

### Pump Animation
- Scale: 1.0 → 1.15 → 1.0
- Duration: 600ms per cycle
- Repeat: Infinite loop while timer is active
- Easing: Ease in-out for smooth pulsing

### Urgency Indicators
- When `timeLeft <= 10` seconds:
  - Player initials turn red and increase font size
  - Enhanced circle styling to increase urgency

## Game Phase Integration

The timer automatically starts/stops based on game state:

```javascript
// Timer starts automatically when:
player.isHuman && isCurrentPlayer === true && gamePhase === 'playing'

// Timer stops automatically when:
!isCurrentPlayer || gamePhase !== 'playing'
```

Tip: Use `GAME_PHASES.PLAYING` from your state machine instead of hardcoding strings.

## Styling Customization

The component uses StyleSheet for styling. Key style classes:
- `circleContainer`: Main container with pump animation
- `circle`: Inner player circle
- `activeCircle`: Styling when player is active
- `timerActiveCircle`: Additional styling when timer is running
- `urgentText`: Text styling when time is low

## Performance Notes

- Uses React Native's `Animated` API for smooth animations
- `useNativeDriver: true` for transform animations (pump effect)
- `useNativeDriver: false` for color/stroke animations (required for SVG)
- Automatic cleanup of intervals and animations on unmount

## Troubleshooting

### Ring not visible
- Ensure it's the human player's turn (ring shows for human players only)
- Ensure `gamePhase === 'playing'`
- Verify `strokeWidth` is sufficiently large (default is 10)
- Ensure `react-native-svg` is installed

### Ref Methods Not Working
- Make sure you're using `forwardRef` correctly:
```javascript
const playerRef = useRef();

<PlayerCircle ref={playerRef} ... />
```

## Related Files
- API Reference - Complete technical reference
- Examples - Practical usage examples
- Component Source - Source code
- Example Implementation - Working example

## Dependencies
- `react-native-svg`: For SVG circle animations
- `react-native`: Core animated API

## Browser/Platform Support
- ✅ iOS (Expo Go & Development Build)
- ✅ Android (Expo Go & Development Build)
- ✅ Web (with react-native-web)

## License
This component is part of the Cards House project.
