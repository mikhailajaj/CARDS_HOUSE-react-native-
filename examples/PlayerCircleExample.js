import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import PlayerCircle from '../components/PlayerCircle';

const PlayerCircleExample = () => {
  const playerCircleRef = useRef();
  const [gamePhase, setGamePhase] = useState('PLAYING');
  const [currentPlayer, setCurrentPlayer] = useState(0);

  const mockPlayer = {
    name: 'John Doe',
    isHuman: true,
    hand: [1, 2, 3, 4, 5] // Mock hand with 5 cards
  };

  const handleTimeUp = (playerIndex) => {
    console.log(`Player ${playerIndex} time is up! AI will play automatically`);
    // Here you would implement your AI auto-play logic
    alert(`Player ${playerIndex} time is up! AI playing automatically...`);
  };

  const handleTimerStart = (playerIndex) => {
    console.log(`Timer started for player ${playerIndex}`);
  };

  const handleTimerStop = (playerIndex) => {
    console.log(`Timer stopped for player ${playerIndex}`);
  };

  const manualTrigger = () => {
    playerCircleRef.current?.triggerTimer();
  };

  const stopTimer = () => {
    playerCircleRef.current?.stopTimer();
  };

  const toggleGamePhase = () => {
    setGamePhase(prev => prev === 'PLAYING' ? 'WAITING' : 'PLAYING');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PlayerCircle Timer Demo</Text>
      
      <View style={styles.playerContainer}>
        <PlayerCircle
          ref={playerCircleRef}
          player={mockPlayer}
          playerIndex={0}
          isCurrentPlayer={currentPlayer === 0}
          gamePhase={gamePhase}
          maxDuration={15} // 15 seconds for demo
          onTimeUp={handleTimeUp}
          onTimerStart={handleTimerStart}
          onTimerStop={handleTimerStop}
        />
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={manualTrigger}>
          <Text style={styles.buttonText}>Manual Trigger</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={stopTimer}>
          <Text style={styles.buttonText}>Stop Timer</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={toggleGamePhase}>
          <Text style={styles.buttonText}>
            Phase: {gamePhase}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.instructions}>
        • Timer auto-starts when player is current and game phase is PLAYING{'\n'}
        • Progress ring SHRINKS around the circle over 15 seconds{'\n'}
        • Uses React Native Animated API for smooth performance{'\n'}
        • Circle pulses with "pump" animation{'\n'}
        • Ring color changes from green → yellow → orange → red{'\n'}
        • AI auto-play triggers when ring completely disappears
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#2d3748',
  },
  playerContainer: {
    marginBottom: 40,
  },
  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#4299e1',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    margin: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  instructions: {
    fontSize: 14,
    color: '#4a5568',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PlayerCircleExample;