import React from 'react';
import { View, StyleSheet } from 'react-native';
import PlayerCircle from './PlayerCircle';

const PlayerCircles = ({ 
  players, 
  currentPlayer, 
  onPlayerTimeUp, 
  gamePhase,
  isSettling = false,
  maxDuration = 15, // Timeout duration in seconds
}) => {
  return (
    <View style={styles.container}>
      {/* Player 1 - Top */}
      <View style={styles.topPlayer}>
        <PlayerCircle
          player={players[0]}
          playerIndex={0}
          isCurrentPlayer={currentPlayer === 0}
          onTimeUp={onPlayerTimeUp}
          position="top"
          gamePhase={gamePhase}
          isSettling={isSettling}
          maxDuration={maxDuration}
        />
      </View>

      {/* Player 2 - Left */}
      <View style={styles.leftPlayer}>
        <PlayerCircle
          player={players[1]}
          playerIndex={1}
          isCurrentPlayer={currentPlayer === 1}
          onTimeUp={onPlayerTimeUp}
          position="left"
          gamePhase={gamePhase}
          maxDuration={maxDuration}
        />
      </View>

      {/* Player 3 - Bottom */}
      <View style={styles.bottomPlayer}>
        <PlayerCircle
          player={players[2]}
          playerIndex={2}
          isCurrentPlayer={currentPlayer === 2}
          onTimeUp={onPlayerTimeUp}
          position="bottom"
          gamePhase={gamePhase}
          maxDuration={maxDuration}
        />
      </View>

      {/* Player 4 - Right */}
      <View style={styles.rightPlayer}>
        <PlayerCircle
          player={players[3]}
          playerIndex={3}
          isCurrentPlayer={currentPlayer === 3}
          onTimeUp={onPlayerTimeUp}
          position="right"
          gamePhase={gamePhase}
          maxDuration={maxDuration}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none', // Allow touches to pass through to underlying views
    // Ensure circles overlay all table elements and cards
    zIndex: 3000,
    elevation: 20,
  },
  topPlayer: {
    position: 'absolute',
    top: 160,
    left: '50%',
    marginLeft: -25, // Half of circle width
    zIndex: 3001,
    elevation: 30,
  },
  leftPlayer: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -25, // Half of circle height
    zIndex: 3001,
    elevation: 30,
  },
  bottomPlayer: {
    position: 'absolute',
    bottom: 60,
    left: '50%',
    marginLeft: -25, // Half of circle width
    zIndex: 3001,
    elevation: 30,
  },
  rightPlayer: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -25, // Half of circle height
    zIndex: 3001,
    elevation: 30,
  },
});

export default PlayerCircles;