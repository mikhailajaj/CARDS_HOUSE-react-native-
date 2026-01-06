# PlayerCircle Examples

## 1. Basic Human Player Timer

```jsx
import React from 'react';
import PlayerCircle from '../../components/PlayerCircle';

export default function BasicExample() {
  const player = { name: 'You', isHuman: true, hand: [] };

  return (
    <PlayerCircle
      player={player}
      playerIndex={2}
      isCurrentPlayer={true}
      gamePhase="playing"
      maxDuration={30}
      onTimeUp={(idx) => console.log('Time up for', idx)}
    />
  );
}
```

## 2. Wiring Through a Wrapper (PlayerCircles)

```jsx
import React from 'react';
import PlayerCircles from '../../components/PlayerCircles';

export default function TableOverlay({ gameState, onTimeUp }) {
  return (
    <PlayerCircles
      players={gameState.players}
      currentPlayer={gameState.playing.currentPlayer}
      onPlayerTimeUp={onTimeUp}
      gamePhase={gameState.phase}
    />
  );
}
```

## 3. Manual Timer Control via Ref

```jsx
import React, { useRef } from 'react';
import PlayerCircle from '../../components/PlayerCircle';

export default function ManualControl() {
  const ref = useRef(null);
  const player = { name: 'You', isHuman: true };

  return (
    <>
      <PlayerCircle
        ref={ref}
        player={player}
        playerIndex={2}
        isCurrentPlayer={true}
        gamePhase="playing"
        onTimeUp={() => console.log('time up')}
      />
      <Button title="Start" onPress={() => ref.current?.triggerTimer()} />
      <Button title="Stop" onPress={() => ref.current?.stopTimer()} />
    </>
  );
}
```

## 4. Custom Size and Ring Thickness

```jsx
<PlayerCircle
  player={{ name: 'You', isHuman: true }}
  playerIndex={2}
  isCurrentPlayer={true}
  gamePhase="playing"
  size={80}
  strokeWidth={12}
  onTimeUp={() => {}}
/>
```

## 5. Integration in GameScreen

```jsx
// in GameScreen.jsx
<PlayerCircles
  players={gameState.players}
  currentPlayer={gameState.playing.currentPlayer}
  onPlayerTimeUp={handlePlayerTimeUp}
  gamePhase={gameState.phase}
/>
```

Notes:
- The ring only shows for human players by default.
- If you want the ring also for AI, remove the `player.isHuman` checks in `PlayerCircle`.
- The numeric countdown badge is hidden by default; you can re-enable the block in the component if needed.
