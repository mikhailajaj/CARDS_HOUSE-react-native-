import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createDeck, shuffleDeck, dealCards, initializePlayers, setTrumpSuit, getScores } from '../utils/gameLogic';
import Hand from '../components/Hand'; // Assuming you have a Hand component that can accept 'orientation' and 'overlap' props

export default function GameScreen() {
  const [deck, setDeck] = useState([]);
  const [players, setPlayers] = useState([]);
  const [trumpSuit, setTrumpSuitState] = useState(null);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    const newDeck = createDeck(); // create new deck
    shuffleDeck(newDeck); // shuffle the deck
    const hands = dealCards(newDeck); // deal cards to players
    const newPlayers = initializePlayers(hands); // initialize players with hands
    setDeck(newDeck);
    setPlayers(newPlayers);
    const selectedTrumpSuit = 'Hearts'; // Example trump suit
    setTrumpSuit(selectedTrumpSuit);
    setTrumpSuitState(selectedTrumpSuit);
  }, []);

  useEffect(() => {
    if (players.length > 0) {
      setScores(getScores()); // calculate scores
    }
  }, [players]);

  // Custom style function to position players based on index
  const getPlayerStyle = (index) => {
    switch (index) {
      case 0: return styles.playerBottom;
      case 1: return styles.playerRight;
      case 2: return styles.playerTop;
      case 3: return styles.playerLeft;
      default: return {};
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.trumpSuit}>Trump Suit: {trumpSuit}</Text>
      {players.map((player, index) => (
        <View key={index} style={[styles.player, getPlayerStyle(index)]}>
          <Text style={styles.playerName}>{player.name}</Text>
          {/* Pass orientation and overlap props to Hand component */}
          <Hand cards={player.hand} orientation={getPlayerOrientation(index)} overlap={20} />
          <Text style={styles.score}>Score: {scores[index]}</Text>
        </View>
      ))}
    </View>
  );
}

const getPlayerOrientation = (index) => {
  switch (index) {
    case 0: return 'horizontal';
    case 1: return 'vertical';
    case 2: return 'horizontal';
    case 3: return 'vertical';
    default: return 'horizontal';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trumpSuit: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  player: {
    position: 'absolute',
  },
  playerBottom: {
    bottom: 10,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerRight: {
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
  },
  playerTop: {
    top: 10,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playerLeft: {
    left: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '270deg' }],
  },
  playerName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  score: {
    marginTop: 10,
  },
});
